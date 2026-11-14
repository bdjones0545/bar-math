// End-to-end proof that the leaderboards grade speed rounds server-side.
//
// Plays REAL 60-second speed rounds through the UI — Bar Math, Muscle and
// Bone — answering what the screen asks (with some deliberate misses), submits
// them, and checks that the server, which replays each round from its seed and
// answer log, posts exactly the totals the game showed. Then the negative
// cases, through the real request path: a resent submission is refused as a
// duplicate, a submission whose seed is altered in flight is graded against
// the questions that seed really asks (so the game's claimed totals never
// reach the board), and a second, worse round leaves the player's best as
// their one board row.
//
// Needs a server with a database it may write to — the local dev server
// (PGLite) is the intended target. NEVER point this at production: it posts
// scores.
//
//   node --experimental-strip-types scripts/speed-verify-smoke.mjs http://127.0.0.1:8080/
//
// Takes about five minutes: the rounds are real minutes.
import { chromium } from "playwright";
import { MUSCLES } from "../src/lib/anatomy/muscles.ts";
import { BONES } from "../src/lib/bones/bones.ts";

const url = process.argv[2] || "http://127.0.0.1:8080/";
if (/vercel\.app|bar-math\./.test(url) && !process.env.SPEED_SMOKE_ALLOW_REMOTE) {
  console.error("Refusing to post test scores to a deployed site. Use the local dev server.");
  process.exit(2);
}
let fails = 0;
const ok = (m) => console.log("PASS", m);
const fail = (m) => {
  console.log("FAIL", m);
  fails += 1;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// PW_CHANNEL=chrome uses an installed Chrome instead of Playwright's download.
const browser = await chromium.launch({
  args: ["--no-sandbox"],
  ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
});
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// Every submit request, so it can be replayed or tampered with.
const submits = [];
let tamper = null;
await page.route("**/_serverFn/**", async (route) => {
  const req = route.request();
  const body = req.postData() || "";
  if (req.method() === "POST" && body.includes('"seed"') && body.includes('"log"')) {
    submits.push({ url: req.url(), headers: req.headers(), body });
    if (tamper) {
      const forged = tamper(body);
      tamper = null;
      await route.continue({ postData: forged });
      return;
    }
  }
  await route.continue();
});

const text = () => page.locator("body").innerText();

async function goHome() {
  await page.goto(url, { waitUntil: "networkidle" });
  await sleep(400);
  if (await page.getByRole("button", { name: "Skip" }).count()) {
    await page.getByRole("button", { name: "Skip" }).click();
  }
}

/** Read the results screen's Correct / Incorrect / score from the DOM (labels are CSS-uppercased). */
async function results() {
  return page.evaluate(() => {
    const stat = (label) => {
      for (const card of document.querySelectorAll(".bm-card")) {
        const ps = card.querySelectorAll("p");
        if (ps.length >= 2 && ps[0].textContent.trim() === label)
          return Number(ps[1].textContent.trim());
      }
      return NaN;
    };
    return {
      correct: stat("Correct"),
      incorrect: stat("Incorrect"),
      score: Number(document.querySelector(".bm-pop")?.textContent?.trim() ?? NaN),
    };
  });
}

async function submitAs(name) {
  const input = page.getByPlaceholder("e.g. Bryan");
  if (await input.count()) await input.fill(name);
  await page.getByRole("button", { name: "Submit to leaderboard" }).click();
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    const t = await text();
    const m = t.match(/#(\d+) TODAY/);
    if (m) return { rank: Number(m[1]) };
    const err = t.match(
      /(could not be verified[^\n]*|already submitted[^\n]*|temporarily unavailable[^\n]*|too old[^\n]*)/,
    );
    if (err) return { error: err[1] };
  }
  return { error: "no answer from submit" };
}

// --- Bar Math -----------------------------------------------------------------
const PLATES = { LB: [45, 35, 25, 10, 5, 2.5], KG: [25, 20, 15, 10, 5, 2.5, 1.25] };
const BAR = { LB: 45, KG: 20 };

async function playBarRound({ maxCorrect = Infinity, missEvery = 5 }) {
  await page
    .getByRole("button", { name: /Speed Round/ })
    .first()
    .click();
  let answered = 0;
  let correctGiven = 0;
  const deadline = Date.now() + 80_000;
  while (Date.now() < deadline) {
    const t = await text();
    if (t.includes("SESSION COMPLETE")) break;
    const counting = await page.locator(".bm-countdown").count();
    const onTarget = await page.locator(".bm-play-target").count();
    const onIdentify = /What's on the bar\?/i.test(t);
    if (counting || (!onTarget && !onIdentify) || correctGiven >= maxCorrect) {
      await sleep(120);
      continue;
    }
    const unit = /\bKG\b/.test(t) && !/\bLB\b/.test(t) ? "KG" : "LB";
    answered += 1;
    const miss = missEvery > 0 && answered % missEvery === 0;
    // Act on what was just read; if the round ends mid-answer, look again.
    try {
      if (onTarget) {
        const raw = await page.locator(".bm-play-target").innerText({ timeout: 1500 });
        const target = Number(raw.replace(/[^\d.]/g, ""));
        let side = Math.round(((target - BAR[unit]) / 2) * 100);
        const pick = [];
        for (const p of PLATES[unit]) {
          while (side >= Math.round(p * 100) && pick.length < 7) {
            pick.push(p);
            side -= Math.round(p * 100);
          }
        }
        if (miss) pick.push(PLATES[unit].at(-1));
        for (const p of pick) {
          await page
            .locator(`button[aria-label="Add ${p} ${unit} plate to each side"]`)
            .click({ timeout: 1500 });
        }
        await page.getByRole("button", { name: "Check Answer" }).click({ timeout: 1500 });
      } else {
        const labels = await page.$$eval(".bm-side-left [aria-label$=' plate']", (els) =>
          els.map((e) => e.getAttribute("aria-label")),
        );
        const side = labels.reduce((s, l) => s + Number(String(l).split(" ")[0]), 0);
        const total = BAR[unit] + side * 2 + (miss ? 5 : 0);
        for (const ch of String(total)) await page.keyboard.press(ch);
        await page.keyboard.press("Enter");
      }
    } catch {
      continue;
    }
    if (!miss) correctGiven += 1;
    // Speed rounds auto-continue after a short beat; a miss waits for a tap.
    // The longer pause keeps the bot at a person's pace, well inside the
    // per-minute caps in rules.ts.
    await sleep(miss ? 300 : 1660);
    if (miss)
      await page
        .locator(".fixed.inset-0")
        .first()
        .click({ force: true })
        .catch(() => {});
    if (miss && onTarget && (await page.getByRole("button", { name: "Clear Bar" }).count())) {
      await page
        .getByRole("button", { name: "Clear Bar" })
        .click()
        .catch(() => {});
    }
  }
  for (let i = 0; i < 100 && !(await text()).includes("SESSION COMPLETE"); i++) await sleep(250);
  return results();
}

// --- Muscle / Bone -----------------------------------------------------------
async function playTapRound(kind, { tamperSeed = false }) {
  const isMuscle = kind === "muscle";
  const DATA = isMuscle ? MUSCLES : BONES;
  const attr = isMuscle ? "data-muscle" : "data-bone";
  const verb = isMuscle ? "POKE" : "WHACK";
  await page.getByRole("button", { name: "Speed", exact: true }).click();
  await sleep(300);
  await page.getByRole("button", { name: "Start" }).click();
  let answered = 0;
  const deadline = Date.now() + 75_000;
  while (Date.now() < deadline) {
    const t = await text();
    if (t.includes("SESSION COMPLETE")) break;
    const m = t.match(new RegExp(`${verb} THE ([^\\n]+)`));
    if (!m || (await page.locator(".bm-countdown").count())) {
      await sleep(120);
      continue;
    }
    const name = m[1].trim();
    const targets = DATA.filter((d) => d.speedName === name).map((d) => d.id);
    const hits = new Set(targets);
    for (const d of DATA) if (d.parent && hits.has(d.parent)) hits.add(d.id);
    answered += 1;
    const ids = await page.$$eval(`[${attr}]`, (els, a) => els.map((e) => e.getAttribute(a)), attr);
    const miss = answered % 6 === 0;
    const id = miss ? ids.find((x) => !hits.has(x)) : ids.find((x) => hits.has(x));
    if (!id) {
      await sleep(150);
      continue;
    }
    await page.locator(`[${attr}="${id}"]`).first().dispatchEvent("pointerdown");
    // ~1.1 s a tap: a quick human, well inside the per-minute caps.
    await sleep(1100);
  }
  for (let i = 0; i < 100 && !(await text()).includes("SESSION COMPLETE"); i++) await sleep(250);
  const shown = await results();
  if (tamperSeed) {
    tamper = (body) => {
      const doc = JSON.parse(body);
      const visit = (n) => {
        if (!n || typeof n !== "object") return;
        if (n.p && Array.isArray(n.p.k) && n.p.k.includes("seed")) {
          const i = n.p.k.indexOf("seed");
          n.p.v[i].s = (n.p.v[i].s + 1) >>> 0;
        }
        for (const v of Object.values(n)) visit(v);
      };
      visit(doc);
      return JSON.stringify(doc);
    };
  }
  return shown;
}

const PLAYER = "Smoke Tester";

/** The rows of one board (today, Rookie), read from the DOM. */
async function boardRows(game) {
  await goHome();
  await page.getByRole("button", { name: /Leaderboards/ }).click();
  await sleep(600);
  return page.evaluate(async (game) => {
    const click = (label) =>
      [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === label)?.click();
    click(game);
    await new Promise((r) => setTimeout(r, 200));
    click("TODAY");
    click("ROOKIE");
    await new Promise((r) => setTimeout(r, 1500));
    const lines = document.body.innerText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const rows = [];
    lines.forEach((l, i) => {
      const m = l.match(/^(\d+) CORRECT · (\d+)%$/);
      if (m)
        rows.push({
          name: lines[i - 1],
          correct: Number(m[1]),
          accuracy: Number(m[2]),
          score: Number(lines[i + 1]),
        });
    });
    return rows;
  }, game);
}

// ===========================================================================
await goHome();

// 1. Bar Math: an honest round with misses is posted with the game's totals.
const bar1 = await playBarRound({ missEvery: 5 });
if (bar1.correct > 0 && bar1.incorrect > 0) ok(`bar round played: ${JSON.stringify(bar1)}`);
else fail(`bar round did not play: ${JSON.stringify(bar1)}`);
const barSubmit = await submitAs(PLAYER);
if (barSubmit.rank) ok(`bar round accepted, #${barSubmit.rank} today`);
else fail(`bar round refused: ${barSubmit.error}`);

// 2. The same submission sent again is refused.
const first = submits.at(-1);
if (first) {
  const again = await page.request.post(first.url, { headers: first.headers, data: first.body });
  const body = await again.text();
  if (/duplicate/.test(body)) ok("resent submission refused as duplicate");
  else fail(`resent submission not refused: ${again.status()} ${body.slice(0, 200)}`);
} else fail("no submit request captured");

// 3. A second, worse round: the board keeps one row per player, their best.
await goHome();
const bar2 = await playBarRound({ maxCorrect: 2, missEvery: 0 });
const second = await submitAs(PLAYER);
if (second.rank) ok(`second bar round accepted (${bar2.correct} correct)`);
else fail(`second bar round refused: ${second.error}`);

let board = await boardRows("BAR MATH");
const mine = board.filter((r) => r.name === PLAYER);
if (mine.length === 1) ok("board shows the player once");
else fail(`board shows the player ${mine.length} times: ${JSON.stringify(board)}`);
if (mine[0] && mine[0].correct === bar1.correct && mine[0].score === bar1.score) {
  ok(
    `board row is the best round, with the game's totals (${bar1.correct} correct, ${bar1.score})`,
  );
} else fail(`board row is not the best round: ${JSON.stringify(board)}`);

// 4. Muscle: tamper the seed in flight — the server must refuse it.
await goHome();
await page.getByRole("button", { name: /Poke a Muscle/i }).click();
await sleep(400);
const muscle = await playTapRound("muscle", { tamperSeed: true });
if (muscle.correct > 0) ok(`muscle round played: ${JSON.stringify(muscle)}`);
else fail(`muscle round did not play: ${JSON.stringify(muscle)}`);
const forged = await submitAs(PLAYER);
board = await boardRows("MUSCLE");
const forgedRow = board.find((r) => r.name === PLAYER);
if (
  forged.error ||
  (forgedRow && forgedRow.correct < muscle.correct / 3 && forgedRow.score !== muscle.score)
) {
  ok(
    `tampered seed: the game showed ${muscle.correct} correct, the board got ${forgedRow ? forgedRow.correct : "nothing"} (${forged.error ?? "graded against the real questions"})`,
  );
} else fail(`tampered round kept the game's totals: ${JSON.stringify({ forged, board })}`);

// 5. Bone: an honest round is posted with the game's totals.
await goHome();
await page.getByRole("button", { name: /Whack a Bone/i }).click();
await sleep(400);
const bone = await playTapRound("bone", {});
const boneSubmit = await submitAs(PLAYER);
if (boneSubmit.rank) ok(`bone round accepted, #${boneSubmit.rank} today (${JSON.stringify(bone)})`);
else fail(`bone round refused: ${boneSubmit.error}`);
board = await boardRows("BONE");
const boneRow = board.find((r) => r.name === PLAYER);
if (boneRow && boneRow.correct === bone.correct && boneRow.score === bone.score)
  ok("bone board shows the game's totals");
else fail(`bone board: ${JSON.stringify(board)}`);

if (errors.length) fail("page errors: " + errors.slice(0, 3).join(" | "));
else ok("no page errors");
await browser.close();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);

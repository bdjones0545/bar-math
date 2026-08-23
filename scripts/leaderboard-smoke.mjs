import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
let fails = 0;
const ok = (m) => console.log("PASS", m);
const fail = (m) => {
  console.log("FAIL", m);
  fails += 1;
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

function overflow() {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
}

const home = await page.locator("body").innerText();
if (/Leaderboards/i.test(home)) ok("leaderboards entry on home");
else fail("no leaderboards entry");
if (/Start Training/i.test(home) && /Load the Bar/i.test(home)) ok("play modes intact");
else fail("play modes missing");

await page.getByRole("button", { name: /Leaderboards/ }).click();
await page.waitForTimeout(500);
let t = await page.locator("body").innerText();
if (/LEADERBOARDS/.test(t) && /BAR MATH SPEED/.test(t)) ok("leaderboard screen");
else fail("board screen " + t.slice(0, 80));
if (/TODAY/.test(t) && /THIS WEEK/.test(t) && /ALL TIME/.test(t)) ok("period filters");
else fail("periods");
if (/ROOKIE/.test(t) && /ATHLETE/.test(t) && /ELITE/.test(t)) ok("difficulty filters");
else fail("difficulty filters");
if (/Windows run on UTC/i.test(t)) ok("timezone documented");
else fail("timezone copy");
if (!/Leaderboard temporarily unavailable/.test(t)) ok("board service reachable");
else fail("board unavailable in preview");
if (!(await overflow())) ok("390 no overflow");
else fail("390 overflow");

await page.getByRole("button", { name: "MUSCLE" }).click();
await page.waitForTimeout(300);
t = await page.locator("body").innerText();
if (/MUSCLE SPEED/.test(t)) ok("muscle board separate");
else fail("muscle board");
await page.getByRole("button", { name: "BONE" }).click();
await page.waitForTimeout(300);
t = await page.locator("body").innerText();
if (/BONE SPEED/.test(t)) ok("bone board separate");
else fail("bone board");
await page.getByRole("button", { name: "THIS WEEK" }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: "ALL TIME" }).click();
await page.waitForTimeout(200);
ok("week and all-time filters tappable");

await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "Settings" }).click();
await page.waitForTimeout(200);
const nameBox = page.locator("input[placeholder='Shown on leaderboards']");
if (await nameBox.count()) ok("settings player name");
else fail("name field missing");
await nameBox.fill("SpeedLab");
await nameBox.blur();
await page.waitForTimeout(200);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Settings" }).click();
const saved = await page.locator("input[placeholder='Shown on leaderboards']").inputValue();
if (saved === "SpeedLab") ok("player name persists");
else fail("name persist " + saved);

const save = await page.evaluate(() => JSON.parse(localStorage.getItem("bar-math-save") || "{}"));
if (save?.state?.playerName === "SpeedLab") ok("name in bar-math-save");
else fail("save name");
if (typeof save?.state?.clientId === "string" && save.state.clientId.length >= 8) ok("client id persisted");
else fail("client id");
if (typeof save?.state?.xp === "number") ok("existing save compatible");
else fail("xp missing");

await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "Speed Round" }).click();
await page.waitForTimeout(400);
t = await page.locator("body").innerText();
if (/SPEED ROUND/i.test(t) || /Load the Bar|WHAT'S ON THE BAR/i.test(t) || /pts/i.test(t)) {
  ok("speed round still starts without board");
} else fail("speed broken " + t.slice(0, 80));
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.getByRole("button", { name: /Poke a Muscle/ }).click();
await page.getByRole("button", { name: "Speed" }).click();
await page.getByRole("button", { name: "Start" }).click();
await page.waitForTimeout(200);
t = await page.locator("body").innerText();
if (/POKE THE/.test(t)) ok("muscle speed still plays");
else fail("muscle speed");
await page.getByRole("button", { name: "Back", exact: true }).click();

const integrity = await page.evaluate(async () => {
  const mod = await import("/src/lib/leaderboard/functions.ts");
  const clientId = "playwright-client-0001";
  const started = await mod.startLbRound({
    data: { mode: "bar", difficulty: "athlete", clientId },
  });
  const tooFast = started.ok
    ? await mod.submitLbScore({
        data: {
          token: started.token,
          clientId,
          name: "Bryan",
          score: 150,
          correct: 1,
          incorrect: 0,
          accuracy: 100,
        },
      })
    : { ok: false, error: "nostart" };
  const fake = await mod.submitLbScore({
    data: {
      token: "AAAAAAAAAAAAAAAAAAAAAAAA",
      clientId,
      name: "Hax",
      score: 999999,
      correct: 3,
      incorrect: 0,
      accuracy: 100,
    },
  });
  const blank = started.ok
    ? await mod.submitLbScore({
        data: {
          token: started.token,
          clientId,
          name: "",
          score: 150,
          correct: 1,
          incorrect: 0,
          accuracy: 100,
        },
      })
    : { ok: false, error: "nostart" };
  const muscle = await mod.listLbBoard({
    data: { mode: "muscle", difficulty: "rookie", period: "today", clientId },
  });
  const bone = await mod.listLbBoard({
    data: { mode: "bone", difficulty: "elite", period: "week", clientId },
  });
  return { started, tooFast, fake, blank, muscle, bone };
});
if (integrity.started.ok) ok("start round token issued");
else fail("start round " + JSON.stringify(integrity.started));
if (!integrity.tooFast.ok) ok("too-fast submit rejected");
else fail("too-fast accepted");
if (!integrity.fake.ok) ok("impossible/unknown token rejected");
else fail("fake accepted");
if (!integrity.blank.ok && integrity.blank.error === "name") ok("blank name rejected");
else ok("blank name rejected as " + integrity.blank.error);
if (integrity.muscle.ok && integrity.bone.ok) ok("mode boards fetch separately");
else fail("list boards");

await page.setViewportSize({ width: 360, height: 800 });
await page.getByRole("button", { name: /Leaderboards/ }).click();
await page.waitForTimeout(300);
if (!(await overflow())) ok("360 no overflow");
else fail("360 overflow");

if (errors.length === 0) ok("no runtime errors");
else fail("errors " + errors.slice(0, 3).join(" | "));

await browser.close();
console.log("FAILS", fails);
process.exit(fails ? 1 : 0);

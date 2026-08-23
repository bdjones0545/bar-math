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
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

async function save() {
  return page.evaluate(() => {
    const raw = localStorage.getItem("bar-math-save");
    return raw ? JSON.parse(raw) : null;
  });
}

function overflow() {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
}

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
if (await page.getByRole("button", { name: /Poke a Muscle/ }).count()) ok("1 opens from tools");
else fail("missing poke card");

await page.getByRole("button", { name: "Settings" }).click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: /Athlete/ }).click();
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(150);
const before = await save();
const xp0 = before?.state?.xp ?? 0;
const unit0 = before?.state?.unit;
const diff0 = before?.state?.difficulty;

await page.getByRole("button", { name: /Poke a Muscle/ }).click();
await page.waitForTimeout(300);
let t = await page.locator("body").innerText();
if (t.includes("POKE A MUSCLE")) ok("poke screen");
else fail("screen " + t.slice(0, 120));
if (t.includes("ATHLETE")) ok("7 uses saved difficulty");
else fail("difficulty " + t.slice(0, 80));

const front = await page.locator("svg[aria-label='Anterior anatomy figure']").count();
const back = await page.locator("svg[aria-label='Posterior anatomy figure']").count();
if (front + back === 1) ok("2 one view at a time");
else fail("views " + front + "/" + back);

const prompt = (await page.locator("body").innerText()).match(/POKE THE ([^\n]+)/)?.[1]?.trim();
console.log("PROMPT", prompt);
if (prompt) ok("poke prompt " + prompt);
else fail("no poke prompt");

const targetMap = {
  SHOULDERS: "deltoid",
  CHEST: "pectoralis_major",
  BICEPS: "biceps_brachii",
  ABS: "rectus_abdominis",
  QUADS: "quadriceps",
  GLUTES: "gluteus_maximus",
  HAMSTRINGS: "hamstrings",
  CALVES: "gastrocnemius",
  "PECTORALIS MAJOR": "pectoralis_major",
  DELTOID: "deltoid",
  "BICEPS BRACHII": "biceps_brachii",
  "RECTUS ABDOMINIS": "rectus_abdominis",
  QUADRICEPS: "quadriceps",
  "TIBIALIS ANTERIOR": "tibialis_anterior",
  "FOREARM FLEXORS": "forearm_flexors",
  "EXTERNAL OBLIQUES": "external_obliques",
  TRAPEZIUS: "trapezius",
  "LATISSIMUS DORSI": "latissimus_dorsi",
  "TRICEPS BRACHII": "triceps_brachii",
  "GLUTEUS MAXIMUS": "gluteus_maximus",
  GASTROCNEMIUS: "gastrocnemius",
};
const targetId = targetMap[prompt ?? ""] ?? null;

if (targetId) {
  const ids = await page.$$eval("[data-muscle]", (els) => [
    ...new Set(els.map((e) => e.getAttribute("data-muscle"))),
  ]);
  const wrongId = ids.find((id) => id && id !== targetId);
  if (wrongId) {
    await page.locator(`[data-muscle="${wrongId}"]`).first().dispatchEvent("pointerdown");
    await page.waitForTimeout(200);
    t = await page.locator("body").innerText();
    if (t.includes("TRY AGAIN")) ok("5 incorrect does not pass");
    else fail("wrong tap " + t.slice(0, 140));
  } else fail("no distractor region");
  const rightPath = page.locator(`[data-muscle="${targetId}"]`).first();
  if (await rightPath.count()) {
    await rightPath.dispatchEvent("pointerdown");
    await page.waitForTimeout(350);
    t = await page.locator("body").innerText();
    if (t.includes("NAILED IT")) ok("4 correct tap validates");
    else fail("correct tap " + t.slice(0, 160));
  } else fail("missing target path " + targetId + " ids=" + ids.join(","));
} else fail("unknown prompt mapping " + prompt);

await page.getByRole("button", { name: "Name" }).click();
await page.waitForTimeout(250);
t = await page.locator("body").innerText();
if (t.includes("WHAT MUSCLE IS THIS?")) ok("6 reverse identification");
else fail("name mode " + t.slice(0, 120));
const nameBtn = page.locator("button").filter({ hasText: /Deltoid|Pectoralis|Biceps|Rectus|Quad|Glute|Hamstring|Calf|Trap|Lat|Tricep|Oblique|Tibialis|Forearm|Soleus|Erector/i }).first();
if (await nameBtn.count()) {
  await nameBtn.click();
  await page.waitForTimeout(250);
  ok("6 name choice tappable");
} else fail("no name choices");

await page.getByRole("button", { name: "Speed", exact: true }).click();
await page.waitForTimeout(200);
t = await page.locator("body").innerText();
if (t.includes("MUSCLE SPEED ROUND") || t.includes("60 seconds")) ok("speed lobby");
else fail("speed " + t.slice(0, 80));
if (await page.getByRole("button", { name: "Start" }).count()) {
  await page.getByRole("button", { name: "Start" }).click();
  await page.waitForTimeout(300);
  t = await page.locator("body").innerText();
  if (/POKE THE /.test(t)) ok("speed running");
  else fail("speed run " + t.slice(0, 120));
}

if (!(await overflow())) ok("8 no overflow 390");
else fail("overflow 390");

await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(200);

const after = await save();
if (after?.state?.difficulty === diff0) ok("11 difficulty intact");
else fail("diff clobber");
if (after?.state?.unit === unit0) ok("11 unit intact");
else fail("unit clobber");
if (typeof after?.state?.bestSpeedScore === "number") ok("11 bar speed best intact");
else fail("speed record missing");
if ((after?.state?.xp ?? 0) >= xp0) ok("xp not wiped");
else fail("xp wiped");

await page.getByRole("button", { name: /Conversion Measurements/ }).click();
await page.waitForTimeout(250);
t = await page.locator("body").innerText();
if (t.includes("CONVERSION MEASUREMENTS") && t.includes("220.46")) ok("9 conversion unchanged");
else fail("convert " + t.slice(0, 120));
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.getByRole("button", { name: "Start Training" }).click();
await page.waitForTimeout(250);
if (await page.getByRole("button", { name: "Skip" }).count()) {
  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Start Training" }).click();
  await page.waitForTimeout(250);
}
if ((await page.getByRole("button", { name: /Add 45|Add 25/ }).count()) > 0) ok("10 load the bar");
else fail("load missing");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "What's on the Bar?" }).click();
await page.waitForTimeout(200);
ok("10 identify");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "Speed Round" }).click();
await page.waitForTimeout(250);
if (await page.getByRole("button", { name: "Skip" }).count()) {
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Speed Round" }).click();
  await page.waitForTimeout(250);
}
ok("10 bar speed");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "Plate Math Trainer" }).click();
await page.waitForTimeout(200);
ok("10 trainer");
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.setViewportSize({ width: 360, height: 800 });
await page.getByRole("button", { name: /Poke a Muscle/ }).click();
await page.waitForTimeout(250);
if (!(await overflow())) ok("8 no overflow 360");
else fail("overflow 360");
const box = await page.locator("svg.anatomy-svg").boundingBox();
if (box && box.width >= 200 && box.height >= 280) ok("8 figure usable 360");
else fail("figure small " + JSON.stringify(box));

if (errors.length === 0) ok("12 no runtime errors");
else fail("errors " + errors.slice(0, 3).join(" | "));

await browser.close();
console.log("FAILS", fails);
process.exit(fails ? 1 : 0);

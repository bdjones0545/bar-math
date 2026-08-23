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
if (await page.getByRole("button", { name: /Whack a Bone/ }).count()) ok("1 opens from tools");
else fail("missing whack card");
if (await page.getByRole("button", { name: /Poke a Muscle/ }).count()) ok("13 poke still on home");
else fail("poke missing");
if (await page.getByRole("button", { name: /Conversion Measurements/ }).count()) ok("14 convert still on home");
else fail("convert missing");

await page.getByRole("button", { name: "Settings" }).click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: /Athlete/ }).click();
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(150);
const before = await save();
const xp0 = before?.state?.xp ?? 0;
const unit0 = before?.state?.unit;
const diff0 = before?.state?.difficulty;
const muscleSpeed0 = before?.state?.anatomyBestSpeed ?? 0;
const barSpeed0 = before?.state?.bestSpeedScore ?? 0;

await page.getByRole("button", { name: /Whack a Bone/ }).click();
await page.waitForTimeout(300);
let t = await page.locator("body").innerText();
if (t.includes("WHACK A BONE")) ok("whack screen");
else fail("screen " + t.slice(0, 120));
if (t.includes("ATHLETE")) ok("11 uses saved difficulty");
else fail("difficulty " + t.slice(0, 80));

const front = await page.locator("svg[aria-label='Anterior skeleton figure']").count();
const back = await page.locator("svg[aria-label='Posterior skeleton figure']").count();
if (front + back === 1) ok("2/3 one skeleton view at a time");
else fail("views " + front + "/" + back);
if (front) ok("2 front skeleton");
if (back) ok("3 back skeleton");

const prompt = (await page.locator("body").innerText()).match(/WHACK THE ([^\n]+)/)?.[1]?.trim();
console.log("PROMPT", prompt);
if (prompt) ok("whack prompt " + prompt);
else fail("no whack prompt");

const targetMap = {
  SKULL: "skull",
  JAW: "mandible",
  COLLARBONE: "clavicle",
  "SHOULDER BLADE": "scapula",
  BREASTBONE: "sternum",
  RIBS: "ribs",
  SPINE: "vertebral_column",
  PELVIS: "pelvis",
  "UPPER ARM BONE": "humerus",
  "THIGH BONE": "femur",
  KNEECAP: "patella",
  "SHIN BONE": "tibia",
  MANDIBLE: "mandible",
  CLAVICLE: "clavicle",
  SCAPULA: "scapula",
  STERNUM: "sternum",
  "VERTEBRAL COLUMN": "vertebral_column",
  HUMERUS: "humerus",
  RADIUS: "radius",
  ULNA: "ulna",
  CARPALS: "carpals",
  METACARPALS: "metacarpals",
  "PHALANGES OF THE HAND": "phalanges_hand",
  FEMUR: "femur",
  PATELLA: "patella",
  TIBIA: "tibia",
  FIBULA: "fibula",
  TARSALS: "tarsals",
  METATARSALS: "metatarsals",
  "PHALANGES OF THE FOOT": "phalanges_foot",
};
const target = targetMap[prompt] || (await page.evaluate(() => document.querySelector("[data-bone]")?.getAttribute("data-bone")));

const sides = await page.evaluate((id) => {
  const els = [...document.querySelectorAll(`[data-bone="${id}"]`)];
  return els.map((e) => e.id);
}, target);
if (sides.length >= 1) ok("7 canonical bone regions " + sides.join(","));
else fail("7 missing target regions");

const allBones = await page.evaluate(() =>
  [...new Set([...document.querySelectorAll("[data-bone]")].map((e) => e.getAttribute("data-bone")))],
);
if (!allBones.includes("brachialis") && !allBones.includes("deltoid")) ok("no muscle ids on skeleton");
else fail("leaked muscle ids");

const wrong = await page.evaluate((id) => {
  const els = [...document.querySelectorAll("[data-bone]")];
  const hit = els.find((e) => e.getAttribute("data-bone") !== id);
  return hit?.getAttribute("data-bone") || null;
}, target);
if (wrong) {
  await page.locator(`[data-bone="${wrong}"]`).first().dispatchEvent("pointerdown");
  await page.waitForTimeout(200);
  t = await page.locator("body").innerText();
  if (t.includes("TRY AGAIN") && !t.includes("NAILED IT")) ok("6 incorrect does not pass");
  else fail("6 false positive " + t.slice(0, 80));
}

await page.locator(`[data-bone="${target}"]`).first().dispatchEvent("pointerdown");
await page.waitForTimeout(400);
t = await page.locator("body").innerText();
if (t.includes("NAILED IT")) ok("5 correct tap validates");
else fail("5 correct " + t.slice(0, 120));

await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Name" }).click();
await page.waitForTimeout(250);
t = await page.locator("body").innerText();
if (t.includes("WHAT BONE IS THIS?")) ok("8 name the bone");
else fail("8 name " + t.slice(0, 80));
const choice = page.locator("button").filter({ hasText: /./ }).filter({ has: page.locator("xpath=.") });
const nameBtns = page.locator(".grid.grid-cols-2 button");
if ((await nameBtns.count()) === 4) ok("8 four choices");
else fail("8 choices " + (await nameBtns.count()));
await nameBtns.first().click();
await page.waitForTimeout(200);
ok("8 name choice tappable");

await page.getByRole("button", { name: "Speed", exact: true }).click();
await page.waitForTimeout(200);
t = await page.locator("body").innerText();
if (t.includes("BONE SPEED ROUND")) ok("9 speed lobby");
else fail("9 lobby");
await page.getByRole("button", { name: "Start" }).click();
await page.waitForTimeout(300);
t = await page.locator("body").innerText();
if (/WHACK THE /.test(t)) ok("9 bone speed running");
else fail("9 speed " + t.slice(0, 80));
const speedTarget = await page.evaluate(() => document.querySelector("[data-bone]")?.getAttribute("data-bone"));
if (speedTarget) {
  await page.locator(`[data-bone="${speedTarget}"]`).first().dispatchEvent("pointerdown");
  await page.waitForTimeout(200);
}

if (!(await overflow())) ok("12 no overflow 390");
else fail("390 overflow");

await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(200);
const after = await save();
if (after?.state?.difficulty === diff0) ok("16 difficulty intact");
else fail("difficulty clobbered");
if (after?.state?.unit === unit0) ok("16 unit intact");
else fail("unit clobbered");
if ((after?.state?.anatomyBestSpeed ?? 0) === muscleSpeed0) ok("10 muscle speed best intact");
else fail("muscle speed clobbered");
if ((after?.state?.bestSpeedScore ?? 0) === barSpeed0) ok("10 bar speed best intact");
else fail("bar speed clobbered");
if (typeof after?.state?.boneBestSpeed === "number") ok("10 bone speed field present");
else fail("boneBestSpeed missing");
if ((after?.state?.xp ?? 0) >= xp0) ok("xp not wiped");
else fail("xp wiped");

await page.getByRole("button", { name: /Poke a Muscle/ }).click();
await page.waitForTimeout(250);
t = await page.locator("body").innerText();
if (t.includes("POKE A MUSCLE") && t.includes("POKE THE")) ok("13 poke unchanged");
else fail("13 poke " + t.slice(0, 80));
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.getByRole("button", { name: /Conversion Measurements/ }).click();
await page.waitForTimeout(250);
await page.locator("input").fill("100");
await page.waitForTimeout(200);
t = await page.locator("body").innerText();
if (t.includes("220.46")) ok("14 conversion unchanged");
else fail("14 convert " + t.slice(0, 80));
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.getByRole("button", { name: "Start Training" }).click();
await page.waitForTimeout(250);
if (await page.getByRole("button", { name: "Skip" }).count()) {
  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Start Training" }).click();
  await page.waitForTimeout(250);
}
if ((await page.getByRole("button", { name: /Add 45|Add 25/ }).count()) > 0) ok("15 load the bar");
else fail("15 load");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "What's on the Bar?" }).click();
await page.waitForTimeout(200);
ok("15 identify");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "Speed Round" }).click();
await page.waitForTimeout(250);
if (await page.getByRole("button", { name: "Skip" }).count()) {
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Speed Round" }).click();
  await page.waitForTimeout(250);
}
ok("15 bar speed");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.getByRole("button", { name: "Plate Math Trainer" }).click();
await page.waitForTimeout(150);
ok("15 trainer");
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.setViewportSize({ width: 360, height: 800 });
await page.getByRole("button", { name: /Whack a Bone/ }).click();
await page.waitForTimeout(250);
if (!(await overflow())) ok("12 no overflow 360");
else fail("360 overflow");
const box = await page.locator("svg.skeleton-svg").boundingBox();
if (box && box.height >= 260 && box.width >= 180) ok("12 figure usable 360");
else fail("360 figure " + JSON.stringify(box));

if (errors.length === 0) ok("17 no runtime errors");
else fail("17 " + errors.slice(0, 3).join(" | "));

await browser.close();
console.log("FAILS", fails);
process.exit(fails ? 1 : 0);

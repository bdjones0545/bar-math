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

async function openHome() {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}

async function skipIntoLoad() {
  const start = page.getByRole("button", { name: "Start Training" });
  if (await start.count()) await start.click();
  await page.waitForTimeout(200);
  if (await page.getByRole("button", { name: "Skip" }).count()) {
    await page.getByRole("button", { name: "Skip" }).click();
    await page.waitForTimeout(150);
    if (await page.getByRole("button", { name: "Start Training" }).count()) {
      await page.getByRole("button", { name: "Start Training" }).click();
    }
  }
  await page.waitForTimeout(250);
}

function parseSave() {
  return page.evaluate(() => {
    const raw = localStorage.getItem("bar-math-save");
    return raw ? JSON.parse(raw) : null;
  });
}

await openHome();
await page.getByRole("button", { name: "Settings" }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Athlete/ }).click();
await page.waitForTimeout(150);
let save = await parseSave();
if (save?.state?.difficulty === "athlete") ok("settings writes athlete");
else fail("settings write " + JSON.stringify(save?.state));
if (await page.getByRole("button", { name: /Athlete/ }).getAttribute("aria-pressed") === "true") {
  ok("athlete pressed");
} else fail("athlete not pressed");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(150);

await skipIntoLoad();
save = await parseSave();
if (save?.state?.difficulty === "athlete") ok("play uses saved athlete");
else fail("play difficulty " + save?.state?.difficulty);
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(150);

await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);
save = await parseSave();
if (save?.state?.difficulty === "athlete") ok("refresh keeps athlete");
else fail("refresh " + save?.state?.difficulty);
await page.getByRole("button", { name: "Settings" }).click();
await page.waitForTimeout(200);
if (await page.getByRole("button", { name: /Athlete/ }).getAttribute("aria-pressed") === "true") {
  ok("settings still athlete");
} else fail("settings lost athlete");
await page.getByRole("button", { name: "Back", exact: true }).click();

await skipIntoLoad();
save = await parseSave();
if (save?.state?.difficulty === "athlete") ok("next game still athlete");
else fail("next game " + save?.state?.difficulty);
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.getByRole("button", { name: "kg", exact: true }).click();
await page.waitForTimeout(150);
save = await parseSave();
if (save?.state?.unit === "kg" && save?.state?.difficulty === "athlete") {
  ok("unit persist does not clobber difficulty");
} else fail("unit/diff " + JSON.stringify({ unit: save?.state?.unit, d: save?.state?.difficulty }));

const xpBefore = save?.state?.xp;
await page.evaluate(() => {
  const raw = localStorage.getItem("bar-math-save");
  const parsed = JSON.parse(raw);
  parsed.state.xp = 42;
  parsed.state.longestStreak = 7;
  parsed.state.bestSpeedScore = 900;
  delete parsed.state.difficulty;
  localStorage.setItem("bar-math-save", JSON.stringify(parsed));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);
save = await parseSave();
if (save?.state?.difficulty === "rookie") ok("legacy save defaults to rookie");
else fail("legacy difficulty " + save?.state?.difficulty);
if (save?.state?.xp === 42 && save?.state?.longestStreak === 7 && save?.state?.bestSpeedScore === 900) {
  ok("legacy progress intact");
} else fail("progress wiped " + JSON.stringify(save?.state));
if (save?.state?.unit === "kg") ok("legacy unit intact");
else fail("legacy unit " + save?.state?.unit);

void xpBefore;
await browser.close();
console.log("FAILS", fails);
process.exit(fails ? 1 : 0);

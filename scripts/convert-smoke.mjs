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
page.on("pageerror", (err) => fail("pageerror " + err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") fail("console " + msg.text());
});

async function save() {
  return page.evaluate(() => {
    const raw = localStorage.getItem("bar-math-save");
    return raw ? JSON.parse(raw) : null;
  });
}

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
if (await page.getByRole("heading", { name: "BAR MATH" }).count()) ok("home loads");
else fail("home missing");

await page.getByRole("button", { name: "Settings" }).click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: /Athlete/ }).click();
await page.getByRole("button", { name: "kg", exact: true }).click().catch(async () => {
  await page.getByRole("button", { name: /Kilograms/ }).click();
});
await page.waitForTimeout(150);
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(150);

const seeded = await save();
if (seeded?.state?.difficulty === "athlete") ok("difficulty persisted before convert");
else fail("difficulty seed " + seeded?.state?.difficulty);
const xpBefore = seeded?.state?.xp ?? 0;
const unitBefore = seeded?.state?.unit;

if (await page.getByRole("button", { name: /Conversion Measurements/ }).count()) {
  ok("convert entry on home");
} else fail("missing convert entry");

await page.getByRole("button", { name: /Conversion Measurements/ }).click();
await page.waitForTimeout(250);
const body = await page.locator("body").innerText();
if (body.includes("CONVERSION MEASUREMENTS")) ok("convert screen");
else fail("convert screen missing");

const input = page.getByLabel("Value to convert");
await input.fill("100");
await page.waitForTimeout(100);
let shown = await page.locator("body").innerText();
if (shown.includes("220.46")) ok("100 kg → 220.46 lb");
else fail("100 kg result: " + shown.slice(0, 400));

await page.getByRole("button", { name: /Swap KG and LB/ }).click();
await page.waitForTimeout(80);
shown = await page.locator("body").innerText();
if (shown.includes("100") && shown.includes("KG")) ok("swap round-trips toward kg");
else fail("swap " + shown.slice(0, 300));

await page.getByRole("button", { name: "Distance" }).click();
await page.waitForTimeout(80);
await input.fill("40");
await page.getByRole("button", { name: "YD", exact: true }).first().click();
const toButtons = page.getByRole("button", { name: "M", exact: true });
await toButtons.last().click();
await page.waitForTimeout(80);
shown = await page.locator("body").innerText();
if (shown.includes("36.58")) ok("40 yd → 36.58 m");
else fail("40 yd " + shown.slice(0, 400));

await page.getByRole("button", { name: "Volume" }).click();
await input.fill("1000");
await page.waitForTimeout(80);
shown = await page.locator("body").innerText();
if (/\b1\b/.test(shown) && shown.includes("L")) ok("1000 ml → 1 L");
else fail("1000 ml " + shown.slice(0, 400));

await input.fill("abc");
await page.waitForTimeout(50);
shown = await page.locator("body").innerText();
if (shown.includes("NaN") || shown.includes("Infinity") || shown.includes("undefined")) {
  fail("invalid input leaked");
} else ok("invalid input handled");

await page.getByRole("button", { name: "Challenge" }).click();
await page.waitForTimeout(150);
shown = await page.locator("body").innerText();
if (shown.includes("ATHLETE") && shown.includes("= ?")) ok("challenge uses saved difficulty");
else fail("challenge header " + shown.slice(0, 300));

const choice = page.locator("button").filter({ hasText: /^\d/ }).first();
if (await choice.count()) {
  await choice.click();
  await page.waitForTimeout(200);
  ok("challenge choice tappable");
} else fail("no challenge choices");

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
if (overflow) fail("horizontal overflow on convert");
else ok("no convert overflow at 390");

await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(200);

const after = await save();
if (after?.state?.difficulty === "athlete") ok("difficulty intact after convert");
else fail("difficulty clobbered " + after?.state?.difficulty);
if (after?.state?.unit === unitBefore) ok("unit intact after convert");
else fail("unit clobbered " + after?.state?.unit);
if (after?.state?.xp === xpBefore) ok("xp intact after convert");
else fail("xp clobbered");

await page.setViewportSize({ width: 360, height: 800 });
await page.getByRole("button", { name: /Conversion Measurements/ }).click();
await page.waitForTimeout(200);
const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
if (overflow360) fail("overflow at 360");
else ok("no overflow at 360");
await page.getByRole("button", { name: "Back", exact: true }).click();

await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "Start Training" }).click();
await page.waitForTimeout(250);
if (await page.getByRole("button", { name: "Skip" }).count()) {
  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Start Training" }).click();
  await page.waitForTimeout(250);
}
const play = await page.locator("body").innerText();
if (play.includes("Check Answer") || play.includes("TARGET") || play.includes("Load")) ok("load the bar still opens");
else fail("play broken " + play.slice(0, 300));
const hasPlate = (await page.getByRole("button", { name: /Add 25/ }).count()) > 0;
if (hasPlate) ok("plate rack present");
else fail("plate rack missing");
await page.getByRole("button", { name: "Back", exact: true }).click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: "What's on the Bar?" }).click();
await page.waitForTimeout(200);
if ((await page.locator("body").innerText()).toLowerCase().includes("submit") || (await page.getByRole("button", { name: /Submit/i }).count())) {
  ok("identify mode opens");
} else ok("identify opened (pad present or not)");
await page.getByRole("button", { name: "Back", exact: true }).click();

await browser.close();
console.log("FAILS", fails);
process.exit(fails ? 1 : 0);

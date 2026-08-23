import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8081/";
let fails = 0;
const ok = (m) => console.log("PASS", m);
const fail = (m) => {
  console.log("FAIL", m);
  fails += 1;
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const errors = [];

async function fresh(w = 390, h = 844) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return page;
}

async function startPlay(page) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(350);
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

const home = await fresh();
await home.goto(url, { waitUntil: "networkidle" });
await home.waitForTimeout(400);
const title = await home.title();
if (title.includes("BAR MATH") && title.includes("Barbell")) ok("1 title " + title);
else fail("1 title " + title);
const ht = await home.locator("body").innerText();
if (ht.toLowerCase().includes("how fast can you load the bar")) ok("1 tagline");
else fail("1 tagline");
if (ht.toLowerCase().includes("load both sides")) ok("1 footer");
else fail("1 footer");
if (ht.includes("START TRAINING") || ht.includes("Start Training")) ok("1 home CTA");
else fail("1 home CTA");
const ov = await home.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (!ov) ok("18 home no overflow 390");
else fail("18 home overflow");
const lower = ht.toLowerCase();
if (!lower.includes("sign in") && !lower.includes("log in") && !lower.includes("create account")) {
  ok("20 no account");
} else fail("20 auth friction");
await home.close();

const p = await fresh();
await startPlay(p);
const body = await p.locator("body").innerText();
if (body.includes("LB") || body.includes("TARGET") || body.includes("Target")) ok("2 start training");
else fail("2 start " + body.slice(0, 120));

for (const pl of ["45", "35", "25", "10", "5", "2.5"]) {
  const n2 = await p.locator(`button[aria-label="Add ${pl} LB plate to each side"]`).count();
  if (n2) ok("4/6 LB plate " + pl);
  else fail("LB plate " + pl);
}
const chk = await p.getByRole("button", { name: "Check Answer" }).boundingBox();
if (chk && chk.y + chk.height <= 844) ok("check in view");
else fail("check " + JSON.stringify(chk));

await p.locator('button[aria-label="Add 45 LB plate to each side"]').click();
await p.locator('button[aria-label="Add 5 LB plate to each side"]').click();
await p.locator('button[aria-label="Add 2.5 LB plate to each side"]').click();
await p.waitForTimeout(200);
let t = await p.locator("body").innerText();
if (t.includes("Current weight: 150 LB")) ok("6/8 current 150");
else fail("150 " + ((t.match(/Current weight:.*/) || [""])[0]));

await p.getByRole("button", { name: "Check Answer" }).click();
await p.waitForTimeout(400);
t = await p.locator("body").innerText();
const nailed = t.includes("NAILED IT");
const notyet = t.includes("NOT YET");
if (nailed || notyet) ok("8/9 feedback " + (nailed ? "correct" : "wrong"));
else fail("no feedback");
if (notyet) {
  await p.locator(".fixed.inset-0").click({ force: true });
  await p.waitForTimeout(200);
  if (await p.getByRole("button", { name: "Clear Bar" }).count()) ok("9 retry");
  else fail("stuck after wrong");
}

await p.getByRole("button", { name: "Clear Bar" }).click();
await p.waitForTimeout(150);
t = await p.locator("body").innerText();
if (t.includes("Current weight: 45 LB")) ok("10 clear bar");
else fail("clear");

for (let i = 0; i < 4; i++) {
  await p.locator('button[aria-label="Add 45 LB plate to each side"]').click();
}
await p.waitForTimeout(150);
t = await p.locator("body").innerText();
if (t.includes("Current weight: 405 LB")) ok("calc 405");
else fail("405");

await p.getByRole("button", { name: "kg", exact: true }).click();
await p.waitForTimeout(300);
for (const pl of ["25", "20", "15", "10", "5", "2.5", "1.25"]) {
  const n2 = await p.locator(`button[aria-label="Add ${pl} KG plate to each side"]`).count();
  if (n2) ok("5/7 KG plate " + pl);
  else fail("KG plate " + pl);
}
await p.locator('button[aria-label="Add 20 KG plate to each side"]').click();
await p.locator('button[aria-label="Add 15 KG plate to each side"]').click();
await p.locator('button[aria-label="Add 5 KG plate to each side"]').click();
await p.locator('button[aria-label="Add 1.25 KG plate to each side"]').click();
await p.waitForTimeout(200);
t = await p.locator("body").innerText();
if (t.includes("Current weight: 102.5 KG")) ok("7/calc 102.5");
else fail("102.5 " + ((t.match(/Current weight:.*/) || [""])[0]));

await p.getByRole("button", { name: "Back", exact: true }).click();
await p.waitForTimeout(200);
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(400);
const pressed = await p.getByRole("button", { name: "kg", exact: true }).getAttribute("aria-pressed");
if (pressed === "true") ok("14 unit persist");
else fail("unit persist " + pressed);

t = await p.locator("body").innerText();
if (/XP/.test(t)) ok("13 XP chrome");
else fail("XP");

for (const [name, expect] of [
  ["What's on the Bar", "Call the total"],
  ["Speed Round", "pts"],
  ["Plate Math Trainer", "Call the total"],
]) {
  await p.getByRole("button", { name: new RegExp(name) }).click();
  await p.waitForTimeout(300);
  const tx = await p.locator("body").innerText();
  if (
    tx.includes(expect) ||
    tx.includes("TARGET") ||
    tx.includes("Speed") ||
    tx.includes("TRAINER") ||
    tx.includes("Trainer") ||
    tx.includes("pts")
  ) {
    ok("3 " + name);
  } else fail("3 " + name + " " + tx.slice(0, 80).replace(/\n/g, " "));
  if (name === "Speed Round") {
    if (tx.includes("pts") || /[0-9]+s/.test(tx)) ok("12 speed timer");
    else {
      const bar = await p.locator(".bg-accent").count();
      if (bar) ok("12 speed timer bar");
      else fail("12 timer " + tx.slice(0, 100));
    }
  }
  await p.getByRole("button", { name: "Back", exact: true }).click();
  await p.waitForTimeout(150);
}

await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(300);
if (await p.getByRole("button", { name: "Start Training" }).count()) ok("16 refresh home");
else fail("16 refresh");

const m = await fresh(360, 640);
await startPlay(m);
const ov2 = await m.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (!ov2) ok("17/18 360 no overflow");
else fail("360 overflow");
const c2 = await m.getByRole("button", { name: "Check Answer" }).boundingBox();
if (c2 && c2.y + c2.height <= 640) ok("17 360 check");
else fail("360 check " + JSON.stringify(c2));
const tap = await m.locator('button[aria-label="Add 2.5 LB plate to each side"]').boundingBox();
if (tap && tap.width >= 44 && tap.height >= 44) ok("17 2.5 tap " + Math.round(tap.width));
else fail("tap " + JSON.stringify(tap));
await m.close();
await p.close();

if (errors.length) fail("19 errors " + errors.slice(0, 4).join(" | "));
else ok("19 no runtime errors");

await browser.close();
console.log("FAILS", fails);
process.exit(fails ? 1 : 0);

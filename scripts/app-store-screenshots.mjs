import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = "https://bar-math.vercel.app";
const output = new URL("../app-store-assets/", import.meta.url);

const devices = [
  { name: "iphone-65", width: 414, height: 896, scale: 3 },
  { name: "ipad-129", width: 1024, height: 1366, scale: 2 },
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const device of devices) {
  const page = await browser.newPage({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: new URL(`${device.name}-01-home.png`, output).pathname });

  await page.getByRole("button", { name: /Load the Bar Hit the target weight/i }).click();
  await page.screenshot({ path: new URL(`${device.name}-02-load.png`, output).pathname });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Conversion Measurements/i }).click();
  await page.screenshot({ path: new URL(`${device.name}-03-convert.png`, output).pathname });

  await page.close();
}

await browser.close();

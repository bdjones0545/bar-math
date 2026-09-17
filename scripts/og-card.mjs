#!/usr/bin/env node
/**
 * Render the share cards from the app's own art:
 *   public/og.jpg       1200x630  (Open Graph / X summary_large_image)
 *   public/x-banner.jpg 1200x264  (X 50:11 feed card)
 *
 * Built from scripts/og-card.html so the card tracks the app's tokens
 * (volt accent, Archivo, vector barbell) instead of a one-off render.
 * Fonts come from Google Fonts, so this needs network. Re-run after any
 * brand change:  node scripts/og-card.mjs
 *
 * JPEG quality is tuned to land well under brand-check's 600 KB cap
 * (scripts/brand-check.mjs MAX_CARD_BYTES).
 */
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const template = readFileSync(join(here, "og-card.html"), "utf8");

const PLATES = [
  ["xl", "45"],
  ["md", "25"],
  ["sm", "10"],
];

function barbell({ barTop, bar, shaft, style = "left:50%;transform:translateX(-50%)" }) {
  const side = (rev) =>
    `<div class="side${rev ? " r" : ""}">${PLATES.map(
      ([size, label]) => `<div class="plate ${size}"><span>${label}</span></div>`,
    ).join("")}</div>`;
  return `<div class="bar" style="top:${barTop}px;${style} scale(${bar});transform-origin:top center">
    <div class="sleeve"></div>${side(false)}<div class="collar"></div>
    <div class="shaft" style="width:${shaft}px"></div>
    <div class="collar"></div>${side(true)}<div class="sleeve"></div>
  </div>`;
}

const CARDS = {
  "public/og.jpg": {
    w: 1200,
    h: 630,
    body: `
      <p class="eyebrow" style="top:52px;font-size:18px">Olympic loading</p>
      <h1 class="title" style="top:78px;font-size:150px">BAR MATH</h1>
      <p class="tag" style="top:232px;font-size:26px">How fast can you load the bar?</p>
      ${barbell({ barTop: 292, bar: 1, shaft: 300 })}
      <p class="total" style="top:462px;font-size:64px">205<small>LB</small>
        <span class="sum">45 + (80 × 2) = 205</span></p>
      <div class="chips" style="top:565px">
        <span class="chip on">LB</span><span class="chip">KG</span>
        <span class="chip">Speed round</span><span class="chip">No account</span>
      </div>`,
  },
  "public/x-banner.jpg": {
    w: 1200,
    h: 264,
    body: `
      <p class="eyebrow" style="top:34px;left:120px;transform:none;font-size:14px">Olympic loading</p>
      <h1 class="title" style="top:52px;left:120px;transform:none;font-size:104px">BAR MATH</h1>
      <p class="tag" style="top:172px;left:124px;transform:none;font-size:20px">How fast can you load the bar?</p>
      ${barbell({ barTop: 82, bar: 0.5, shaft: 130, style: "left:955px;transform:translateX(-50%)" })}
      <div class="chips" style="top:206px;left:124px;transform:none">
        <span class="chip on">LB</span><span class="chip">KG</span>
      </div>`,
  },
};

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  for (const [rel, card] of Object.entries(CARDS)) {
    const page = await browser.newPage({
      viewport: { width: card.w, height: card.h },
      deviceScaleFactor: 1,
    });
    const html = template.replace(
      "<!-- Filled in by scripts/og-card.mjs -->",
      `<div class="card" style="--w:${card.w}px;--h:${card.h}px">${card.body}</div>`,
    );
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    // Fonts arrive async even after fonts.ready on first paint; give the layout a beat.
    await page.waitForTimeout(400);
    const out = join(root, rel);
    await page.screenshot({
      path: out,
      type: "jpeg",
      quality: 88,
      clip: { x: 0, y: 0, width: card.w, height: card.h },
    });
    const kb = Math.round(statSync(out).size / 1024);
    console.log(`${rel}  ${card.w}x${card.h}  ${kb} KB`);
    await page.close();
  }
} finally {
  await browser.close();
}

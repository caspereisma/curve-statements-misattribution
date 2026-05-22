#!/usr/bin/env node
/**
 * Curated design-archive capture.
 *
 *   pnpm snap <slug> "<summary>"
 *
 * Spins up the wireframe dev server (if not already running), opens the main
 * page at three viewports, writes full-page PNGs into
 *   screenshots/archive/<YYYY-MM-DD>_<slug>/
 * along with a meta.json describing the moment, then rebuilds the
 * screenshots/archive/INDEX.md.
 *
 * Run after a significant design change you want to remember. Examples:
 *   pnpm snap two-card-focus-panel "Side-by-side cards + NRP Matching header"
 *   pnpm snap unprocessed-bulk-add  "Replaced Export with Bulk add"
 */

import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ARCHIVE_DIR = join(ROOT, 'screenshots', 'archive');

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 1024 },
  { name: 'tablet-768',   width: 768,  height: 1024 },
  { name: 'mobile-375',   width: 375,  height: 812 },
];

const PAGE_URL = 'http://127.0.0.1:4321/data-matching.html';
const SERVER_CMD = ['python3', '-m', 'http.server', '4321', '--directory', 'wireframes/data-matching'];

function bail(msg) { console.error('snap: ' + msg); process.exit(1); }

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function gitInfo() {
  const sh = (...args) =>
    spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  return {
    branch: sh('rev-parse', '--abbrev-ref', 'HEAD'),
    commit: sh('rev-parse', '--short', 'HEAD'),
    remote: sh('config', '--get', 'remote.origin.url'),
  };
}

async function waitForServer(url, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch { /* not yet */ }
    await sleep(250);
  }
  return false;
}

async function ensureServer() {
  if (await waitForServer(PAGE_URL, 500)) return null;
  const child = spawn(SERVER_CMD[0], SERVER_CMD.slice(1), {
    cwd: ROOT, stdio: 'ignore', detached: true,
  });
  child.unref();
  if (!await waitForServer(PAGE_URL, 10_000)) bail('dev server did not start on :4321');
  return child;
}

// Optional sub-tab clicks per tab so captures land on a meaningful state.
const SUB_TAB_CLICK = {
  NewTracksCurve: '[data-sub-tab="Track"]',          // default to Track sub-tab
  NewTracksCurveRights: '[data-sub-tab="TrackRights"]',
};

// Map convenience aliases (used on the CLI) onto the actual `data-tab` value.
const TAB_ALIAS = {
  All: 'All',
  Unprocessed: 'Unmapped',
  TrackAliases: 'TrackAliases',
  NewTracksCurve: 'NewTracksCurve',
  NewTracksCurveRights: 'NewTracksCurve',  // same tab, different sub-tab
};

async function captureAll(targetDir, tab) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const captures = [];
  const tabAttr = tab ? TAB_ALIAS[tab] : null;
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(PAGE_URL);
    // The All-tab body is the safest "page ready" probe — it always renders.
    await page.waitForSelector('.dm-master tbody tr[data-idx]');
    await page.evaluate(() => document.fonts.ready);
    // Switch to the requested tab + sub-tab (if any).
    if (tabAttr && tabAttr !== 'All') {
      await page.click(`[data-tab="${tabAttr}"]`);
      if (SUB_TAB_CLICK[tab]) await page.click(SUB_TAB_CLICK[tab]);
      // Tiny settle delay so the new view renders before we capture.
      await page.waitForTimeout(150);
    }
    const out = join(targetDir, vp.name + '.png');
    await page.screenshot({ path: out, fullPage: true });
    captures.push({ viewport: vp.name, file: vp.name + '.png',
                    width: vp.width, height: vp.height, tab: tab || 'All' });
  }
  await browser.close();
  return captures;
}

async function main() {
  // Optional third arg is the tab to target (alias as in TAB_ALIAS). When
  // omitted, captures the All tab (default page load state).
  const args = process.argv.slice(2);
  if (args.length < 1) bail('usage: pnpm snap <slug> "<summary>" [tab]');
  const slug = args[0];
  const tab  = args.length > 2 && TAB_ALIAS[args[args.length - 1]] ? args[args.length - 1] : null;
  const summaryParts = args.slice(1, tab ? -1 : undefined);
  const summary = summaryParts.join(' ').trim();
  const date = todayStamp();
  const folder = `${date}_${slug}`;
  const targetDir = join(ARCHIVE_DIR, folder);
  if (existsSync(targetDir)) bail(`already exists: ${targetDir} — pick a different slug`);

  mkdirSync(targetDir, { recursive: true });
  console.log(`snap: capturing into ${targetDir} …`);

  await ensureServer();
  const captures = await captureAll(targetDir, tab);

  const meta = {
    slug, summary, date,
    captured_at: new Date().toISOString(),
    page_url: PAGE_URL,
    tab: tab || 'All',
    git: gitInfo(),
    captures,
  };
  writeFileSync(join(targetDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`snap: wrote ${captures.length} captures + meta.json`);

  // Rebuild the chronological index.
  const upd = spawnSync('node', [join(ROOT, 'scripts', 'update-index.mjs')],
    { stdio: 'inherit', cwd: ROOT });
  if (upd.status !== 0) bail('snap:index step failed');

  console.log(`snap: done. View ${join('screenshots', 'archive', 'INDEX.md')}`);
}

main().catch((err) => bail(err?.stack || String(err)));

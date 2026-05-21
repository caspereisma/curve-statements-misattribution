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

async function captureAll(targetDir) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const captures = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(PAGE_URL);
    await page.waitForSelector('.dm-master tbody tr[data-idx]');
    await page.evaluate(() => document.fonts.ready);
    const out = join(targetDir, vp.name + '.png');
    await page.screenshot({ path: out, fullPage: true });
    captures.push({ viewport: vp.name, file: vp.name + '.png',
                    width: vp.width, height: vp.height });
  }
  await browser.close();
  return captures;
}

async function main() {
  const [slug, ...summaryParts] = process.argv.slice(2);
  if (!slug) bail('usage: pnpm snap <slug> "<summary>"');
  const summary = summaryParts.join(' ').trim();
  const date = todayStamp();
  const folder = `${date}_${slug}`;
  const targetDir = join(ARCHIVE_DIR, folder);
  if (existsSync(targetDir)) bail(`already exists: ${targetDir} — pick a different slug`);

  mkdirSync(targetDir, { recursive: true });
  console.log(`snap: capturing into ${targetDir} …`);

  await ensureServer();
  const captures = await captureAll(targetDir);

  const meta = {
    slug, summary, date,
    captured_at: new Date().toISOString(),
    page_url: PAGE_URL,
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

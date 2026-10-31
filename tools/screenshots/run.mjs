/**
 * 无头 Chrome 跑现有绘制代码，按竖屏截 PNG。
 * 用法：node tools/screenshots/run.mjs [输出目录]
 * 依赖只装在 tools/screenshots/，project.config 的 packOptions 不把这个目录打进小游戏。
 */
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] || '/opt/cursor/artifacts/screens';
const chrome = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

await esbuild.build({
  absWorkingDir: here,
  entryPoints: ['entry.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: path.join(here, 'bundle.js'),
  legalComments: 'none',
  logLevel: 'silent',
});

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});

try {
  const page = await browser.newPage();
  await page.goto(pathToFileUrl(path.join(here, 'page.html')), { waitUntil: 'load' });
  const names = await page.evaluate(() => globalThis.screenNames);
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    const size = await page.evaluate((id) => globalThis.renderScreen(id), name);
    await page.setViewport({
      width: Math.max(size.w, 800),
      height: Math.max(size.h, 600),
      deviceScaleFactor: 1,
    });
    const file = path.join(outDir, `${name}.png`);
    const canvas = await page.$('#screen');
    if (!canvas) throw new Error('找不到画布');
    await canvas.screenshot({ path: file });
    const stat = fs.statSync(file);
    console.log(`${name}.png ${size.w}x${size.h} ${stat.size}`);
  }
} finally {
  await browser.close();
}

function pathToFileUrl(file) {
  const abs = path.resolve(file);
  return `file://${abs}`;
}

// Builds ezzo-c4.pdf from ezzo-c4.md: pandoc turns the Markdown into HTML, Chromium (Playwright) prints it.
// Text pages are A4 portrait; every diagram gets an A4 landscape page of its own, so its labels stay readable.
// Run from the repo root after node docs/c4/diagrams/build.mjs: node docs/c4/build-pdf.mjs
// Needs pandoc on the PATH and Playwright resolvable by Node.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');

// The last section, on rebuilding the diagrams, is for whoever maintains the repo and stays out of the PDF.
const markdownHtml = execFileSync('pandoc', ['--from', 'gfm', '--to', 'html5', '--wrap=none', join(here, 'ezzo-c4.md')], { encoding: 'utf8' });
const body = markdownHtml.replace(/<h2[^>]*>დიაგრამების განახლება<\/h2>[\s\S]*$/, '');

// Each diagram is inlined, so the PDF holds vector drawings, and moved onto a landscape page with its caption.
// A heading right before a diagram moves onto the diagram's page, so it is not left alone at the foot of a text page.
const withDiagrams = body.replace(
  /(<h[23][^>]*>.*?<\/h[23]>\s*)?<p><img\s+src="([^"]+)"\s+alt="([^"]*)"\s*\/><\/p>/g,
  (_, heading = '', src, alt) => {
    const svg = readFileSync(join(here, src), 'utf8').replace(/width="\d+" height="\d+"/, '');
    return `<section class="diagram">${heading}<div class="drawing">${svg}</div><p class="caption">${alt}</p></section>`;
  },
);

const html = `<!doctype html>
<html lang="ka"><head><meta charset="utf-8"><title>Ezzo C4</title>
<style>
  @page { size: A4 portrait; margin: 18mm 16mm; }
  @page wide { size: A4 landscape; margin: 10mm; }
  body { font-family: 'Noto Sans Georgian', 'DejaVu Sans', 'Sylfaen', sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1d1d1d; }
  h1 { font-size: 20pt; margin: 0 0 4pt; }
  h2 { font-size: 15pt; margin-top: 18pt; break-after: avoid; }
  h3 { font-size: 12pt; margin-top: 14pt; break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9pt; }
  th, td { border: 1px solid #b9b9b9; padding: 4pt 6pt; vertical-align: top; text-align: left; }
  th { background: #eef3f9; }
  tr { break-inside: avoid; }
  code { font-family: 'DejaVu Sans Mono', Consolas, monospace; font-size: 8.5pt; background: #f2f2f2; padding: 0 2pt; }
  pre { background: #f2f2f2; padding: 6pt; }
  pre code { padding: 0; }
  hr { display: none; }
  .diagram h2, .diagram h3 { margin: 0 0 4pt; }
  .diagram { page: wide; break-before: page; break-after: page; display: flex; flex-direction: column; height: 188mm; }
  .drawing { flex: 1; min-height: 0; }
  .drawing svg { width: 100%; height: 100%; }
  .caption { text-align: center; font-size: 9pt; color: #555; margin: 4pt 0 0; }
</style></head><body>${withDiagrams}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({ path: join(here, 'ezzo-c4.pdf'), preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`Wrote ${pathToFileURL(join(here, 'ezzo-c4.pdf')).pathname}`);

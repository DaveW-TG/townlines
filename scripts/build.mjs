import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const records = JSON.parse(await readFile(path.join(root, "data", "municipalities.json"), "utf8"));
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function reportPage(record) {
  const title = `${record.name} Council on Aging and Senior Center | TownLines`;
  const description = `What ${record.name} visibly supports for older residents and what meaningful programming residents actually receive.`;
  const url = `https://townlines.news/${record.slug}`;
  const examples = record.programExamples.map((item) => `<li><strong>${escapeHtml(item.title)}</strong>${escapeHtml(item.description)}</li>`).join("");
  const mechanisms = record.supportMechanisms.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const sources = record.sources.map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a><span>${escapeHtml(source.note)}</span></li>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="https://townlines.news/townlines-social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="TownLines — Independent. Skeptical. Local.">
<meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="https://townlines.news/townlines-social-card.png">
<link rel="canonical" href="${url}"><link rel="stylesheet" href="/styles.css"></head>
<body><header class="site-header"><a class="brand" href="/" aria-label="TownLines home"><img src="/townlines-logo-transparent.png" width="1774" height="887" alt="TownLines"></a><p>Independent. Skeptical. Local.</p></header>
<main><header class="report-hero"><div><p class="report-label">${escapeHtml(record.county)} · ${escapeHtml(record.state)}</p><h1>${escapeHtml(record.name)}</h1></div><p class="report-standfirst">What the town visibly supports for older residents, and what meaningful programming residents actually receive.</p></header>
<article class="report-body">
<section class="report-section" aria-labelledby="funding"><p class="eyebrow">Public funding</p><h2 id="funding">Council on Aging funding</h2><p class="fact-line">${escapeHtml(record.budgetSummary)}</p></section>
<section class="report-section" aria-labelledby="residents-get"><p class="eyebrow">The public-facing calendar</p><h2 id="residents-get">What residents actually get</h2><p>${escapeHtml(record.residentsGetSummary)}</p><ul class="examples">${examples}</ul></section>
<section class="report-section" aria-labelledby="how"><p class="eyebrow">Documented support</p><h2 id="how">How it happens</h2><p>${escapeHtml(record.supportSummary)}</p><ul class="support-list">${mechanisms}</ul></section>
<section class="report-section" aria-labelledby="unknown"><p class="eyebrow">Limits of the evidence</p><h2 id="unknown">What the record doesn’t show</h2><p>${escapeHtml(record.recordLimitations)}</p></section>
<section class="report-section" aria-labelledby="sources"><p class="eyebrow">Documents and public pages</p><h2 id="sources">Sources reviewed</h2><ul class="source-list">${sources}</ul></section>
<section class="report-section" aria-labelledby="reviewed"><h2 id="reviewed">Last reviewed</h2><p class="reviewed">${escapeHtml(record.lastReviewed)} · TownLines reports what public records support and does not treat a missing budget line as evidence that a program received no funding.</p></section>
</article></main><footer class="site-footer"><p><strong>TownLines</strong> is an independent local reporting project.</p><a href="mailto:editor@townlines.news">editor@townlines.news</a></footer></body></html>`;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, "index.html"), path.join(dist, "index.html"));
await cp(path.join(root, "styles.css"), path.join(dist, "styles.css"));
for (const asset of ["townlines-logo-transparent.png", "townlines-social-card.png"]) await cp(path.join(root, asset), path.join(dist, asset));
for (const record of records) await writeFile(path.join(dist, `${record.slug}.html`), reportPage(record));
console.log(`Built ${records.length} municipality reports in dist/.`);

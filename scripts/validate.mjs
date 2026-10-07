import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(await readFile(path.join(root, "data", "municipalities.json"), "utf8"));
const required = ["slug", "name", "state", "reportStatus", "fiscalYear", "municipalBudgetTotal", "staffingAmount", "explicitProgramSupport", "supplementalSupport", "budgetSummary", "residentsGetSummary", "programExamples", "supportMechanisms", "supportSummary", "recordLimitations", "sources", "lastReviewed", "internalCharacteristics"];
const forbidden = /\b(score|rank|rating|grade)\b/i;
if (records.length !== 2) throw new Error(`Expected exactly 2 municipality records; found ${records.length}.`);
for (const record of records) {
  for (const field of required) if (record[field] === undefined || record[field] === null || record[field] === "") throw new Error(`${record.name ?? record.slug}: missing ${field}.`);
  if (record.programExamples.length < 3 || record.programExamples.length > 5) throw new Error(`${record.name}: expected 3–5 examples.`);
  if (record.sources.length < 2) throw new Error(`${record.name}: expected at least 2 sources.`);
  for (const item of [...record.explicitProgramSupport, ...record.supplementalSupport]) if (!("amount" in item)) throw new Error(`${record.name}: support amount must be a number or null, never an implicit zero.`);
  if (forbidden.test([record.budgetSummary, record.residentsGetSummary, record.supportSummary, record.recordLimitations].join(" "))) throw new Error(`${record.name}: scoring language found in public copy.`);
  await access(path.join(root, "dist", `${record.slug}.html`));
}
const home = await readFile(path.join(root, "dist", "index.html"), "utf8");
if (!home.includes("What does your town provide older residents?")) throw new Error("Homepage question is missing.");
if (!home.includes("https://townlines.news/townlines-social-card.png")) throw new Error("Homepage OG image is not absolute.");
for (const record of records) {
  const report = await readFile(path.join(root, "dist", `${record.slug}.html`), "utf8");
  for (const heading of ["Council on Aging funding", "What residents actually get", "How it happens", "What the record doesn’t show", "Sources reviewed", "Last reviewed"]) if (!report.includes(heading)) throw new Error(`${record.name}: missing section “${heading}”.`);
  if (report.includes("internalCharacteristics")) throw new Error(`${record.name}: internal characteristics leaked into rendered page.`);
}
console.log("TownLines content and generated pages validated.");

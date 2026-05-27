/**
 * Import French quiz questions from dataset/database.txt
 * Format: "question \ answer" (backslash separator)
 * Lines starting with #S are Scrabble words — skipped.
 *
 * Usage (from backend/): node scripts/import-dataset.mjs
 */
import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, "../dataset/database.txt");

const p = new PrismaClient();

function cleanText(str) {
  return str
    .replace(/�/g, "")   // replace replacement chars from bad encoding
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const rl = createInterface({
    input: createReadStream(FILE, { encoding: "latin1" }),
    crlfDelay: Infinity,
  });

  let inserted = 0;
  let skipped  = 0;
  let batch    = [];
  const BATCH_SIZE = 500;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#S")) { skipped++; continue; }

    const sepIdx = trimmed.lastIndexOf(" \\ ");
    if (sepIdx === -1) { skipped++; continue; }

    const question = cleanText(trimmed.slice(0, sepIdx));
    const answer   = cleanText(trimmed.slice(sepIdx + 3));

    if (!question || !answer) { skipped++; continue; }

    batch.push({ question, answer, category: "Culture Générale", difficulty: "medium" });

    if (batch.length >= BATCH_SIZE) {
      await p.quizQuestion.createMany({ data: batch, skipDuplicates: true });
      inserted += batch.length;
      process.stdout.write(`\r  ${inserted} insérées...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await p.quizQuestion.createMany({ data: batch, skipDuplicates: true });
    inserted += batch.length;
  }

  console.log(`\nTerminé : ${inserted} questions insérées, ${skipped} lignes ignorées (Scrabble/vides).`);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());

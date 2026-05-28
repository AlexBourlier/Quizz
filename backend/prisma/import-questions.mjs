// Run once to populate quiz questions from dataset/database.txt
// Usage: node prisma/import-questions.mjs
// Must be run from the backend root directory.

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const BATCH = 500;

function parseLine(raw) {
  const line = raw.replace(/\r$/, "").trim();
  if (!line || line.startsWith("#S")) return null;

  let category = "autres";
  let rest = line;

  const catMatch = line.match(/^\{([^}]+)\}\s*(.*)/s);
  if (catMatch) {
    category = catMatch[1].trim();
    rest = catMatch[2].trim();
  }

  const sepIdx = rest.indexOf(" \\ ");
  if (sepIdx === -1) return null;

  const question = rest.slice(0, sepIdx).trim();
  const answer   = rest.slice(sepIdx + 3).trim();
  if (!question || !answer) return null;

  return { question, answer, category, difficulty: "medium" };
}

async function main() {
  const datasetPath = join(process.cwd(), "dataset", "database.txt");
  console.log(`Reading ${datasetPath}…`);

  const raw   = readFileSync(datasetPath, "latin1");
  const lines = raw.split("\n");

  const questions = [];
  for (const line of lines) {
    const q = parseLine(line);
    if (q) questions.push(q);
  }
  console.log(`Parsed ${questions.length} questions.`);

  const existing = await prisma.quizQuestion.count();
  console.log(`Existing questions in DB: ${existing}. Clearing…`);
  // Clear dependent records first
  await prisma.quizRoundHistory.deleteMany();
  await prisma.quizSuggestion.updateMany({ data: { questionId: null } });
  await prisma.quizQuestion.deleteMany();

  let imported = 0;
  for (let i = 0; i < questions.length; i += BATCH) {
    await prisma.quizQuestion.createMany({ data: questions.slice(i, i + BATCH) });
    imported += Math.min(BATCH, questions.length - i);
    process.stdout.write(`\r${imported} / ${questions.length}`);
  }
  console.log("\nDone!");

  const cats = await prisma.quizQuestion.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  console.log(`\n${cats.length} categories imported:`);
  cats.forEach((c) => console.log("  -", c.category));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

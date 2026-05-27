/**
 * Import quiz questions from Open Trivia Database (opentdb.com)
 * Usage: node scripts/import-questions.mjs
 *
 * Fetches ~500 questions across multiple categories and inserts them into QuizQuestion.
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&ecirc;/g, "ê")
    .replace(/&uuml;/g, "ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&auml;/g, "ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&hellip;/g, "…")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
}

// Categories: [opentdb_id, label, difficulty]
const BATCHES = [
  { category: 9,  label: "Culture Générale",  difficulty: "easy",   amount: 50 },
  { category: 9,  label: "Culture Générale",  difficulty: "medium", amount: 50 },
  { category: 9,  label: "Culture Générale",  difficulty: "hard",   amount: 50 },
  { category: 17, label: "Sciences",          difficulty: "easy",   amount: 30 },
  { category: 17, label: "Sciences",          difficulty: "medium", amount: 30 },
  { category: 23, label: "Histoire",          difficulty: "easy",   amount: 30 },
  { category: 23, label: "Histoire",          difficulty: "medium", amount: 30 },
  { category: 22, label: "Géographie",        difficulty: "easy",   amount: 30 },
  { category: 22, label: "Géographie",        difficulty: "medium", amount: 30 },
  { category: 11, label: "Cinéma",            difficulty: "easy",   amount: 30 },
  { category: 11, label: "Cinéma",            difficulty: "medium", amount: 30 },
  { category: 12, label: "Musique",           difficulty: "easy",   amount: 30 },
  { category: 12, label: "Musique",           difficulty: "medium", amount: 30 },
  { category: 15, label: "Jeux Vidéo",        difficulty: "easy",   amount: 30 },
  { category: 15, label: "Jeux Vidéo",        difficulty: "medium", amount: 30 },
  { category: 18, label: "Informatique",      difficulty: "easy",   amount: 30 },
  { category: 18, label: "Informatique",      difficulty: "medium", amount: 30 },
  { category: 21, label: "Sports",            difficulty: "easy",   amount: 30 },
  { category: 21, label: "Sports",            difficulty: "medium", amount: 30 },
  { category: 20, label: "Mythologie",        difficulty: "easy",   amount: 30 },
  { category: 20, label: "Mythologie",        difficulty: "medium", amount: 30 },
];

async function fetchBatch({ category, difficulty, amount }) {
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.response_code !== 0) {
    console.warn(`  ⚠ response_code=${json.response_code} pour category=${category} difficulty=${difficulty}`);
    return [];
  }
  return json.results;
}

async function main() {
  let total = 0;
  let skipped = 0;

  for (const batch of BATCHES) {
    console.log(`Fetching ${batch.amount} ${batch.difficulty} questions — ${batch.label}...`);

    // Wait 5.5s between requests to respect the API rate limit (5 req/sec limit)
    await new Promise((r) => setTimeout(r, 5500));

    const results = await fetchBatch(batch);

    const data = results.map((q) => ({
      question:   decodeHtml(q.question),
      answer:     decodeHtml(q.correct_answer),
      category:   batch.label,
      difficulty: batch.difficulty,
    }));

    for (const row of data) {
      try {
        await p.quizQuestion.create({ data: row });
        total++;
      } catch {
        // Duplicate or constraint error — skip silently
        skipped++;
      }
    }

    console.log(`  ✓ ${data.length} questions insérées (${skipped} ignorées)`);
  }

  console.log(`\nTerminé : ${total} questions importées, ${skipped} ignorées.`);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());

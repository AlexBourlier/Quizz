import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const BATCH_SIZE = 500;
const DATASET_PATH = path.join(__dirname, "../../dataset/database.txt");
function extractCategory(rawQuestion) {
    // Match {Category} at start of question text
    const match = rawQuestion.match(/^\{([^}]+)\}\s*/);
    if (match) {
        return {
            question: rawQuestion.slice(match[0].length).trim(),
            category: match[1].trim()
        };
    }
    return { question: rawQuestion, category: "autre" };
}
async function main() {
    const existing = await prisma.quizQuestion.count();
    if (existing > 0) {
        console.log(`Database already contains ${existing} questions. Skipping import.`);
        console.log("Delete existing questions first if you want to re-import.");
        return;
    }
    console.log(`Reading dataset from: ${DATASET_PATH}`);
    const fileStream = createReadStream(DATASET_PATH, { encoding: "latin1" });
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });
    let batch = [];
    let total = 0;
    let skipped = 0;
    for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        // Strip leading line number + tab (e.g. "42\t")
        const withoutNumber = trimmed.replace(/^\d+\t/, "");
        const sepIdx = withoutNumber.indexOf(" \\ ");
        if (sepIdx === -1) {
            skipped++;
            continue;
        }
        const rawQuestion = withoutNumber.slice(0, sepIdx).trim();
        const answer = withoutNumber.slice(sepIdx + 3).trim();
        if (!answer || answer.length > 255) {
            skipped++;
            continue;
        }
        const isScrabble = rawQuestion === "#S";
        if (isScrabble) {
            batch.push({
                question: `Trouvez ce mot valide au Scrabble (${answer.length} lettres)`,
                answer,
                category: "Scrabble",
                difficulty: "medium"
            });
        }
        else {
            const { question, category } = extractCategory(rawQuestion);
            batch.push({ question, answer, category, difficulty: "medium" });
        }
        if (batch.length >= BATCH_SIZE) {
            await prisma.quizQuestion.createMany({ data: batch });
            total += batch.length;
            process.stdout.write(`\rImported ${total} questions...`);
            batch = [];
        }
    }
    if (batch.length > 0) {
        await prisma.quizQuestion.createMany({ data: batch });
        total += batch.length;
    }
    console.log(`\nDone! Imported ${total} questions. Skipped ${skipped} invalid lines.`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});

import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const scrabbleIds = await p.quizQuestion
  .findMany({ where: { category: "Scrabble" }, select: { id: true } })
  .then((rows) => rows.map((r) => r.id));

console.log(`Found ${scrabbleIds.length} Scrabble questions.`);

const { count: historyCount } = await p.quizRoundHistory.deleteMany({
  where: { questionId: { in: scrabbleIds } },
});
console.log(`Deleted ${historyCount} round history records.`);

const { count: suggCount } = await p.quizSuggestion.updateMany({
  where: { questionId: { in: scrabbleIds } },
  data: { questionId: null },
});
console.log(`Unlinked ${suggCount} suggestion records.`);

const { count } = await p.quizQuestion.deleteMany({ where: { category: "Scrabble" } });
console.log(`Deleted ${count} Scrabble questions.`);

await p.$disconnect();

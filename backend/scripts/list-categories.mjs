import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const rows = await p.quizQuestion.groupBy({
  by: ["category"],
  _count: { _all: true },
  orderBy: { _count: { category: "desc" } }
});
console.log(rows.map(r => `${r.category}: ${r._count._all}`).join("\n"));
await p.$disconnect();

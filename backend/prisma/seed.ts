import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: "admin" },
      { name: "moderator" },
      { name: "user" }
    ],
    skipDuplicates: true
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "admin" } });
  const userRole  = await prisma.role.findUniqueOrThrow({ where: { name: "user" } });

  const adminPassword = await bcrypt.hash("admin12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@quizztest.local" },
    update: {},
    create: {
      username: "admin",
      email: "admin@quizztest.local",
      password: adminPassword,
      roleId: adminRole.id
    }
  });

  // Bot user — cannot log in (random unguessable password, never used for auth)
  const botPassword = await bcrypt.hash(randomUUID(), 12);
  await prisma.user.upsert({
    where: { email: "quizbot@quizztest.local" },
    update: {},
    create: {
      username: "QuizBot",
      email: "quizbot@quizztest.local",
      password: botPassword,
      roleId: userRole.id
    }
  });

  await prisma.room.createMany({
    data: [
      { name: "general", type: "public" },
      { name: "quiz-arena", type: "public" }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

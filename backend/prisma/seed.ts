import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: RoleName.admin },
      { name: RoleName.moderator },
      { name: RoleName.user }
    ],
    skipDuplicates: true
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.admin } });
  const password = await bcrypt.hash("admin12345", 12);

  await prisma.user.upsert({
    where: { email: "admin@quizztest.local" },
    update: {},
    create: {
      username: "admin",
      email: "admin@quizztest.local",
      password,
      roleId: adminRole.id
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

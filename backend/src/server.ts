import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { buildSocketServer } from "./socket/chat.socket.js";
import { checkAndResetLeaderboard } from "./services/quiz.service.js";
import { scheduleCleanup } from "./cron/cleanup.cron.js";

async function bootstrap() {
  const app = createApp();
  const httpServer = http.createServer(app);

  const io = buildSocketServer(httpServer);
  app.set("io", io);

  httpServer.listen(env.PORT, () => {
    console.log(`Backend listening on port ${env.PORT}`);
  });

  // Check monthly leaderboard reset on startup, then every hour
  checkAndResetLeaderboard().catch(console.error);
  setInterval(() => checkAndResetLeaderboard().catch(console.error), 60 * 60 * 1000);
  scheduleCleanup();

  const shutdown = async () => {
    await prisma.$disconnect();
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

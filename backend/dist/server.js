import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { buildSocketServer } from "./socket/chat.socket.js";
async function bootstrap() {
    const app = createApp();
    const httpServer = http.createServer(app);
    buildSocketServer(httpServer);
    httpServer.listen(env.PORT, () => {
        console.log(`Backend listening on port ${env.PORT}`);
    });
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

import { prisma } from "../config/prisma.js";
export async function createQuestion(data) {
    return prisma.quizQuestion.create({ data });
}
export async function createOrActivateGame(roomId) {
    const active = await prisma.quizGame.findFirst({
        where: { roomId, status: "active" }
    });
    if (active)
        return active;
    return prisma.quizGame.create({
        data: { roomId, status: "active", startedAt: new Date() }
    });
}
export async function endGame(gameId) {
    return prisma.quizGame.update({
        where: { id: gameId },
        data: { status: "finished", endedAt: new Date() }
    });
}
export async function getCategories() {
    const rows = await prisma.quizQuestion.findMany({
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" }
    });
    return rows.map((r) => r.category);
}
export async function getRandomQuestion(filters) {
    const where = {
        ...(filters?.categories?.length ? { category: { in: filters.categories } } : {}),
        ...(filters?.difficulty ? { difficulty: filters.difficulty } : {})
    };
    const total = await prisma.quizQuestion.count({ where });
    if (total === 0)
        return null;
    const skip = Math.floor(Math.random() * total);
    return prisma.quizQuestion.findFirst({ where, skip });
}
export async function applyScore(userId, points, wonRound = false) {
    return prisma.quizScore.upsert({
        where: { userId },
        update: {
            score: { increment: points },
            wins: wonRound ? { increment: 1 } : undefined,
            answersCount: { increment: 1 }
        },
        create: {
            userId,
            score: points,
            wins: wonRound ? 1 : 0,
            answersCount: 1
        }
    });
}
export async function getLeaderboard(limit = 20) {
    return prisma.quizScore.findMany({
        include: { user: { select: { id: true, username: true, avatar: true } } },
        orderBy: [{ score: "desc" }, { wins: "desc" }],
        take: limit
    });
}
export async function saveRoundHistory(data) {
    return prisma.quizRoundHistory.create({ data });
}
export async function resetLeaderboard() {
    await prisma.quizScore.updateMany({
        data: { score: 0, wins: 0, answersCount: 0 }
    });
    await prisma.settings.upsert({
        where: { key: "leaderboard:lastReset" },
        update: { value: new Date().toISOString() },
        create: { key: "leaderboard:lastReset", value: new Date().toISOString() }
    });
    console.log("Leaderboard reset for new month:", new Date().toISOString());
}
export async function checkAndResetLeaderboard() {
    const now = new Date();
    if (now.getDate() !== 1)
        return;
    const setting = await prisma.settings.findUnique({
        where: { key: "leaderboard:lastReset" }
    });
    if (setting) {
        const lastReset = new Date(setting.value);
        const sameMonth = lastReset.getFullYear() === now.getFullYear() &&
            lastReset.getMonth() === now.getMonth();
        if (sameMonth)
            return;
    }
    await resetLeaderboard();
}

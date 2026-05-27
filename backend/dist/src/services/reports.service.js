import { prisma } from "../config/prisma.js";
export async function createReport(data) {
    return prisma.report.create({ data });
}
export async function getReports(resolvedFilter) {
    return prisma.report.findMany({
        where: resolvedFilter !== undefined ? { resolved: resolvedFilter } : undefined,
        include: {
            reporter: { select: { id: true, username: true } },
            reported: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}
export async function resolveReport(reportId) {
    return prisma.report.update({
        where: { id: reportId },
        data: { resolved: true },
    });
}

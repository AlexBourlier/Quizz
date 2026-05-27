import { prisma } from "../config/prisma.js";
import { sendAdminAlert } from "./email.service.js";
import { env } from "../config/env.js";

export async function createReport(data: {
  reporterId: string;
  reportedId: string;
  messageContent?: string;
  messageAt?: Date;
  context: string;
  reason?: string;
}) {
  const report = await prisma.report.create({ data });

  const [reporter, reported] = await Promise.all([
    prisma.user.findUnique({ where: { id: data.reporterId }, select: { username: true } }),
    prisma.user.findUnique({ where: { id: data.reportedId }, select: { username: true } }),
  ]);

  sendAdminAlert(
    `Nouveau signalement — ${reported?.username ?? "inconnu"}`,
    `<p><strong>${reporter?.username ?? "??"}</strong> a signalé <strong>${reported?.username ?? "??"}</strong>.</p>
     <p>Contexte : ${data.context}</p>
     ${data.reason ? `<p>Raison : ${data.reason}</p>` : ""}
     ${data.messageContent ? `<p>Message : <em>${data.messageContent}</em></p>` : ""}
     <p><a href="${env.FRONTEND_URL}">Accéder à l'application</a></p>`,
  ).catch(() => undefined);

  return report;
}

export async function getReports(resolvedFilter?: boolean) {
  return prisma.report.findMany({
    where: resolvedFilter !== undefined ? { resolved: resolvedFilter } : undefined,
    include: {
      reporter: { select: { id: true, username: true } },
      reported: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveReport(reportId: string) {
  return prisma.report.update({
    where: { id: reportId },
    data: { resolved: true },
  });
}

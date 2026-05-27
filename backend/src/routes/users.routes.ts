import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { updateUserColor } from "../services/moderation.service.js";
import { prisma } from "../config/prisma.js";
import {
  deleteAccount,
  getPendingAvatars,
  setPendingAvatar,
  updateProfile
} from "../services/users.service.js";

const usersRouter = Router();
usersRouter.use(authMiddleware);

usersRouter.get("/me", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      pendingAvatar: true,
      color: true,
      role: { select: { name: true } }
    }
  });
  if (!user) return res.status(404).json({ message: "Introuvable" });
  return res.json({ ...user, role: user.role.name });
});

usersRouter.patch("/me/color", async (req: Request, res: Response) => {
  if (req.user!.isGuest) return res.status(403).json({ message: "Non disponible pour les comptes invités" });
  try {
    const { color } = z.object({ color: z.string() }).parse(req.body);
    await updateUserColor(req.user!.sub, color);
    return res.json({ color });
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

usersRouter.patch("/me", async (req: Request, res: Response) => {
  if (req.user!.isGuest) return res.status(403).json({ message: "Non disponible pour les comptes invités" });
  try {
    const { username } = z
      .object({ username: z.string().min(2).max(32).optional() })
      .parse(req.body);
    const updated = await updateProfile(req.user!.sub, { username });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

usersRouter.post("/me/avatar", async (req: Request, res: Response) => {
  if (req.user!.isGuest) return res.status(403).json({ message: "Non disponible pour les comptes invités" });
  try {
    const { avatar } = z
      .object({ avatar: z.string().min(1) })
      .parse(req.body);
    if (!avatar.startsWith("data:image/")) {
      return res.status(400).json({ message: "Format avatar invalide" });
    }
    const result = await setPendingAvatar(req.user!.sub, avatar);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

usersRouter.get("/pending-avatars", async (req: Request, res: Response) => {
  if (req.user!.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const pending = await getPendingAvatars();
  return res.json(pending);
});

usersRouter.post("/me/accept-terms", async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { termsAcceptedAt: new Date() },
  });
  return res.json({ ok: true, termsAcceptedAt: new Date().toISOString() });
});

usersRouter.delete("/me", async (req: Request, res: Response) => {
  try {
    await deleteAccount(req.user!.sub);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

export default usersRouter;

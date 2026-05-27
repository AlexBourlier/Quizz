import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  verifyEmail,
  resendVerificationEmail,
  handleParentalConsent,
} from "../services/auth.service.js";

const verificationRouter = Router();

// GET /api/auth/verify-email?token=...
verificationRouter.get("/verify-email", async (req: Request, res: Response) => {
  const token = String(req.query.token ?? "");
  if (!token) return res.status(400).json({ message: "Token manquant" });

  try {
    await verifyEmail(token);
    return res.json({ ok: true, message: "Email vérifié avec succès" });
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

// POST /api/auth/resend-verification (authenticated)
verificationRouter.post("/resend-verification", authMiddleware, async (req: Request, res: Response) => {
  try {
    await resendVerificationEmail(req.user!.sub);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

// GET /api/auth/parental-consent?token=...&action=approve|deny
verificationRouter.get("/parental-consent", async (req: Request, res: Response) => {
  const token  = String(req.query.token ?? "");
  const action = req.query.action as string;

  if (!token) return res.status(400).json({ message: "Token manquant" });
  if (action !== "approve" && action !== "deny") {
    return res.status(400).json({ message: "Action invalide" });
  }

  try {
    await handleParentalConsent(token, action);
    const msg = action === "approve"
      ? "Compte autorisé avec succès"
      : "Compte refusé et supprimé";
    return res.json({ ok: true, message: msg });
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

export default verificationRouter;

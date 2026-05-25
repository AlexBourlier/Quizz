import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../modules/auth/auth.validators.js";
import { login, logout, refresh, register } from "../services/auth.service.js";

export async function registerController(req: Request, res: Response) {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await register(parsed);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await login(parsed);
    return res.json(result);
  } catch (error) {
    return res.status(401).json({ message: (error as Error).message });
  }
}

export async function refreshController(req: Request, res: Response) {
  try {
    const refreshToken = String(req.body?.refreshToken ?? "");
    const result = await refresh(refreshToken);
    return res.json(result);
  } catch (error) {
    return res.status(401).json({ message: (error as Error).message });
  }
}

export async function logoutController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await logout(req.user.sub);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

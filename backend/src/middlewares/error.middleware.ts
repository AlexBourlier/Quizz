import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

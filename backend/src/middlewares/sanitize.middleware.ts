import type { NextFunction, Request, Response } from "express";
import xss from "xss";

function sanitizeObject(input: unknown): unknown {
  if (typeof input === "string") {
    return xss(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, sanitizeObject(value)])
    );
  }

  return input;
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query) as Request["query"];
  req.params = sanitizeObject(req.params) as Request["params"];
  next();
}

import type { JwtUserPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export {};

import { verifyAccessToken } from "../utils/jwt.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (!token) {
        return res.status(401).json({ message: "Missing token" });
    }
    try {
        req.user = verifyAccessToken(token);
        return next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}

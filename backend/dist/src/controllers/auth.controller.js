import { loginSchema, registerSchema } from "../modules/auth/auth.validators.js";
import { login, loginAsGuest, logout, refresh, register } from "../services/auth.service.js";
function getMeta(req) {
    const ip = (req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
        req.socket.remoteAddress ??
        undefined);
    const userAgent = req.headers["user-agent"] ?? undefined;
    return { ip, userAgent };
}
export async function registerController(req, res) {
    try {
        const parsed = registerSchema.parse(req.body);
        const result = await register(parsed, getMeta(req));
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function loginController(req, res) {
    try {
        const parsed = loginSchema.parse(req.body);
        const result = await login(parsed, getMeta(req));
        return res.json(result);
    }
    catch (error) {
        return res.status(401).json({ message: error.message });
    }
}
export async function refreshController(req, res) {
    try {
        const refreshToken = String(req.body?.refreshToken ?? "");
        const result = await refresh(refreshToken);
        return res.json(result);
    }
    catch (error) {
        return res.status(401).json({ message: error.message });
    }
}
export async function loginAsGuestController(_req, res) {
    try {
        const result = await loginAsGuest();
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function logoutController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await logout(req.user.sub);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

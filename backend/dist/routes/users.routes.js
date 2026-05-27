import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { updateUserColor } from "../services/moderation.service.js";
const usersRouter = Router();
usersRouter.use(authMiddleware);
usersRouter.patch("/me/color", async (req, res) => {
    try {
        const { color } = z.object({ color: z.string() }).parse(req.body);
        await updateUserColor(req.user.sub, color);
        return res.json({ color });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
});
export default usersRouter;

import { Router } from "express";
import authRouter from "./auth.routes.js";
import messagesRouter from "./messages.routes.js";
import quizRouter from "./quiz.routes.js";
import roomsRouter from "./rooms.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/rooms", roomsRouter);
router.use("/messages", messagesRouter);
router.use("/quiz", quizRouter);

export default router;

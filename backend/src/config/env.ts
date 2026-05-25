import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url(),
  QUIZ_HINT_INTERVAL_MS: z.coerce.number().default(30000),
  QUIZ_QUESTION_TIMEOUT_MS: z.coerce.number().default(120000),
  QUIZ_ANSWER_COOLDOWN_MS: z.coerce.number().default(1000)
});

export const env = envSchema.parse(process.env);

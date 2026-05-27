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
    QUIZ_ANSWER_COOLDOWN_MS: z.coerce.number().default(1000),
    MESSAGE_ENCRYPTION_KEY: z.string().length(64),
    ENCRYPTION_KEY_GCM_V1: z.string().length(64),
    ENCRYPTION_CURRENT_VERSION: z.string().default("gcm-v1"),
    DM_RETENTION_DAYS: z.coerce.number().default(90),
    REPORTED_MSG_RETENTION_DAYS: z.coerce.number().default(365),
    AUDIT_LOG_RETENTION_DAYS: z.coerce.number().default(365),
    SECURITY_LOG_RETENTION_DAYS: z.coerce.number().default(365),
    // Age & minor protection
    MIN_AGE_YEARS: z.coerce.number().default(13),
    PARENTAL_CONSENT_MIN_AGE: z.coerce.number().default(15),
    // New account restrictions
    NEW_ACCOUNT_DM_HOLD_HOURS: z.coerce.number().default(24),
    NEW_ACCOUNT_LINK_HOLD_HOURS: z.coerce.number().default(48),
    // Email (optional — skip if not set)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),
    // Captcha (optional — skip validation if not set)
    CAPTCHA_SECRET: z.string().optional(),
    CAPTCHA_PROVIDER: z.enum(["hcaptcha", "turnstile"]).default("turnstile"),
});
export const env = envSchema.parse(process.env);

import { env } from "../config/env.js";
const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export async function verifyCaptcha(token) {
    if (!env.CAPTCHA_SECRET)
        return true; // disabled in dev
    if (!token)
        return false;
    const verifyUrl = env.CAPTCHA_PROVIDER === "hcaptcha" ? HCAPTCHA_VERIFY_URL : TURNSTILE_VERIFY_URL;
    const body = new URLSearchParams({ secret: env.CAPTCHA_SECRET, response: token });
    try {
        const res = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
        });
        const json = (await res.json());
        return json.success === true;
    }
    catch {
        return false;
    }
}

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "../config/env.js";

const KEY = Buffer.from(env.MESSAGE_ENCRYPTION_KEY, "hex");

export function encryptText(plain: string): { cipher: string; iv: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return { cipher: encrypted.toString("hex"), iv: iv.toString("hex") };
}

export function decryptText(cipherHex: string, ivHex: string): string {
  const decipher = createDecipheriv("aes-256-cbc", KEY, Buffer.from(ivHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

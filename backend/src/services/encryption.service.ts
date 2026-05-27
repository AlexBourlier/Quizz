import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { keyManager } from "./key-manager.service.js";

const GCM_IV_BYTES = 16;
const GCM_TAG_BYTES = 16;

export type EncryptedPayload = {
  content: string;   // hex ciphertext
  iv: string;        // hex IV
  authTag: string;   // hex GCM auth tag
  keyVersion: string;
};

// ── GCM encrypt ──────────────────────────────────────────────────────────────

export function encrypt(plain: string): EncryptedPayload {
  const { key, version } = keyManager.getCurrent();
  const iv = randomBytes(GCM_IV_BYTES);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    content:    ciphertext.toString("hex"),
    iv:         iv.toString("hex"),
    authTag:    authTag.toString("hex"),
    keyVersion: version,
  };
}

// ── Unified decrypt (GCM new + CBC legacy) ───────────────────────────────────

export function decrypt(payload: {
  content: string;
  iv: string;
  authTag?: string | null;
  keyVersion: string;
}): string {
  if (payload.keyVersion === "cbc-v1") {
    return decryptCbcLegacy(payload.content, payload.iv);
  }
  return decryptGcm(payload);
}

function decryptGcm(payload: {
  content: string;
  iv: string;
  authTag?: string | null;
  keyVersion: string;
}): string {
  if (!payload.authTag) throw new Error("authTag manquant pour GCM");

  const key     = keyManager.getByVersion(payload.keyVersion);
  const iv      = Buffer.from(payload.iv, "hex");
  const tag     = Buffer.from(payload.authTag, "hex");
  const cipher  = Buffer.from(payload.content, "hex");

  if (tag.length !== GCM_TAG_BYTES) throw new Error("authTag invalide");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(cipher),
    decipher.final(),
  ]).toString("utf8");
}

// AES-256-CBC backward compat (messages existants)
function decryptCbcLegacy(cipherHex: string, ivHex: string): string {
  const key      = keyManager.getByVersion("cbc-v1");
  const iv       = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

// ── Integrity check ──────────────────────────────────────────────────────────

// GCM auth tag validation is implicit during decrypt (throws on tamper).
// This helper provides an explicit boolean for audit checks.
export function validateIntegrity(
  payload: { content: string; iv: string; authTag?: string | null; keyVersion: string },
): boolean {
  try {
    decrypt(payload);
    return true;
  } catch {
    return false;
  }
}

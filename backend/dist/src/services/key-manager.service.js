import { env } from "../config/env.js";
class KeyManagerService {
    keys = new Map();
    currentVersion;
    constructor() {
        this.currentVersion = env.ENCRYPTION_CURRENT_VERSION;
        this.loadKeys();
    }
    loadKeys() {
        // Pattern: ENCRYPTION_KEY_GCM_V1, ENCRYPTION_KEY_GCM_V2, …
        for (const [name, value] of Object.entries(process.env)) {
            const match = name.match(/^ENCRYPTION_KEY_(.+)$/);
            if (match && typeof value === "string" && value.length === 64) {
                const version = match[1].toLowerCase().replace(/_/g, "-"); // GCM_V1 → gcm-v1
                this.keys.set(version, Buffer.from(value, "hex"));
            }
        }
        if (!this.keys.has(this.currentVersion)) {
            throw new Error(`ENCRYPTION_KEY_${this.currentVersion.toUpperCase().replace(/-/g, "_")} manquante dans les variables d'environnement`);
        }
    }
    getCurrent() {
        return {
            key: this.keys.get(this.currentVersion),
            version: this.currentVersion,
            algorithm: "aes-256-gcm",
        };
    }
    getByVersion(version) {
        // Legacy CBC key
        if (version === "cbc-v1")
            return Buffer.from(env.MESSAGE_ENCRYPTION_KEY, "hex");
        const key = this.keys.get(version);
        if (!key)
            throw new Error(`Clé de chiffrement inconnue : ${version}`);
        return key;
    }
    listVersions() {
        return Array.from(this.keys.keys());
    }
}
export const keyManager = new KeyManagerService();

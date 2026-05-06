import { deriveEncryptionKey } from "@/utils/derive-encryption-key";

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

export async function encryptApiKey(plainText: string): Promise<string> {
  if (!plainText) throw new Error("plainText kosong — tidak ada yang dienkripsi");
  const key = await deriveEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plainText)
  );
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return bufToHex(combined.buffer);
}

export async function decryptApiKey(cipherHex: string): Promise<string> {
  if (!cipherHex) throw new Error("cipherHex kosong — tidak ada yang didekripsi");
  const key = await deriveEncryptionKey();
  const raw = hexToBuf(cipherHex);
  if (raw.length <= 12) throw new Error("Data terenkripsi tidak valid");
  const iv = raw.slice(0, 12);
  const ct = raw.slice(12);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    throw new Error("Dekripsi gagal — key tidak cocok atau data rusak");
  }
}

// Legacy base64 helpers kept for backward-compat with existing persisted data
const ENC_KEY_SEED = "njirlah-ai-v1";

async function deriveKeyLegacy(passphrase = ""): Promise<CryptoKey> {
  const seed =
    (typeof navigator !== "undefined" ? navigator.userAgent : "server") +
    (typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "0x0") +
    ENC_KEY_SEED +
    passphrase;
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(seed));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(plain: string, passphrase = ""): Promise<string> {
  if (!plain) return "";
  const key = await deriveKeyLegacy(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain)
  );
  const buf = new Uint8Array(iv.byteLength + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...Array.from(buf)));
}

export async function decrypt(cipher: string, passphrase = ""): Promise<string> {
  if (!cipher) return "";
  try {
    const key = await deriveKeyLegacy(passphrase);
    const raw = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const ct = raw.slice(12);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    return "";
  }
}

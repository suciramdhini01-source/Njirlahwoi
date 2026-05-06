const ENC_KEY_SEED = "njirlah-ai-v1";

async function deriveKey(passphrase = ""): Promise<CryptoKey> {
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
  const key = await deriveKey(passphrase);
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
    const key = await deriveKey(passphrase);
    const raw = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const ct = raw.slice(12);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    return "";
  }
}

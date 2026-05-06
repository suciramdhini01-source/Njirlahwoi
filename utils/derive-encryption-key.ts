export async function deriveEncryptionKey(): Promise<CryptoKey> {
  const seed =
    (typeof navigator !== "undefined" ? navigator.userAgent : "server") +
    (typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "0x0") +
    "njirlah-ai-v1";
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(seed));
  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

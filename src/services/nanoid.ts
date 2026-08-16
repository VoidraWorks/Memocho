// ─── Tiny nano-id for client-side ID generation ───────────────────────────────
// Avoids adding the full nanoid package just for a UUID utility.

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function nanoid(len = 12): string {
  let result = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) {
    result += CHARS[arr[i] % CHARS.length];
  }
  return result;
}

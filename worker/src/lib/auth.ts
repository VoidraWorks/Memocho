// ─── JWT + Password Auth (Cloudflare Workers native) ─────────────────────────
// Uses:
//   - SubtleCrypto PBKDF2 for password hashing (built-in, no WASM)
//   - jose for JWT signing/verification (CF Workers compatible)

import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "../types/index.ts";

// ─── Password Hashing (PBKDF2 via SubtleCrypto) ───────────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const HASH_ALGO = "SHA-256";
const KEY_LENGTH = 32; // bytes

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Hash a plaintext password. Returns a storable `salt:hash` string. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return `${bufToHex(salt.buffer)}:${bufToHex(derived)}`;
}

/** Verify a plaintext password against a stored hash string. */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = hexToBuf(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return bufToHex(derived) === hashHex;
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: { sub: string; email: string },
  secret: string,
  ttlSeconds: number
): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getSecretKey(secret));
}

export async function signRefreshToken(
  sub: string,
  secret: string,
  ttlSeconds: number
): Promise<string> {
  return new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getSecretKey(secret));
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret));
    return {
      sub: payload.sub as string,
      email: payload["email"] as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/** Hash a refresh token for safe storage (SHA-256, hex). */
export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return bufToHex(buf);
}

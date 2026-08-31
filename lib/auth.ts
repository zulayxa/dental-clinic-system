import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "dc_session";

function envSecret() {
  return process.env.AUTH_SECRET ?? "dental-care-local-auth-secret";
}

function hmac(value: string) {
  return createHmac("sha256", envSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createSessionValue(email: string) {
  const normalized = email.trim().toLowerCase();
  return `${normalized}.${hmac(normalized)}`;
}

export function sessionEmail(token: string | undefined) {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const email = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!email || !signature) return null;
  if (!safeEqual(signature, hmac(email))) return null;
  return email;
}

export function isValidSession(token: string | undefined) {
  return Boolean(sessionEmail(token));
}

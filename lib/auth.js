// ล็อกอินแบบง่าย: เลือกผู้ใช้ + รหัสผ่าน แล้วเก็บ session เป็น cookie ที่เซ็นด้วย HMAC
// ครั้งแรกใช้รหัสของบทบาท (ตั้งใน env) เปลี่ยนแล้วจะใช้รหัสของตัวเอง (เก็บเป็น scrypt hash)
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getPasswordHash, setPasswordHash } from "./db";
import { USERS } from "./staff";

const COOKIE = "fg_session";
const MAX_AGE = 7 * 24 * 3600;
const PASSWORDS = { manager: () => process.env.MANAGER_PASSWORD, staff: () => process.env.STAFF_PASSWORD };
const fail = (message, status) => Object.assign(new Error(message), { status });

const sign = (data) => createHmac("sha256", process.env.AUTH_SECRET || "").update(data).digest("base64url");
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const hashPassword = (pw, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;

async function checkPassword(user, password) {
  const stored = await getPasswordHash(user.id);
  if (stored) return same(hashPassword(password, stored.split(":")[0]), stored);
  const fallback = PASSWORDS[user.role]();
  if (!fallback) throw fail("ยังไม่ได้ตั้งรหัสผ่านในเซิร์ฟเวอร์ (MANAGER_PASSWORD, STAFF_PASSWORD)", 503);
  return same(password, fallback);
}

export async function login(userId, password) {
  if (!process.env.AUTH_SECRET) throw fail("ยังไม่ได้ตั้ง AUTH_SECRET ในเซิร์ฟเวอร์", 503);
  const user = USERS.find(u => u.id === userId);
  if (!user || !(await checkPassword(user, String(password || "")))) throw fail("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
  const data = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return { user, token: `${data}.${sign(data)}`, maxAge: MAX_AGE, cookie: COOKIE };
}

export async function changePassword(user, current, next) {
  next = String(next || "");
  if (!(await checkPassword(user, String(current || "")))) throw fail("รหัสผ่านปัจจุบันไม่ถูกต้อง", 400);
  if (next.length < 8) throw fail("รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร", 400);
  await setPasswordHash(user.id, hashPassword(next));
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value || "";
  const [data, sig] = token.split(".");
  if (!data || !sig || !process.env.AUTH_SECRET || !same(sig, sign(data))) return null;
  const { id, exp } = JSON.parse(Buffer.from(data, "base64url").toString());
  return exp > Date.now() ? USERS.find(u => u.id === id) || null : null;
}

// ใช้ใน API: ไม่ล็อกอิน = 401, บทบาทไม่พอ = 403
export async function requireUser(role) {
  const user = await currentUser();
  if (!user) throw fail("กรุณาเข้าสู่ระบบ", 401);
  if (role && user.role !== role) throw fail("ไม่มีสิทธิ์ทำรายการนี้", 403);
  return user;
}

export const SESSION_COOKIE = COOKIE;

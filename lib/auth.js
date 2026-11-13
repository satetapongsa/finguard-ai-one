// ล็อกอินแบบง่าย: เลือกผู้ใช้ + รหัสผ่านของบทบาท (ตั้งใน env) แล้วเก็บ session เป็น cookie ที่เซ็นด้วย HMAC
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { USERS } from "./staff";

const COOKIE = "fg_session";
const MAX_AGE = 7 * 24 * 3600;
const PASSWORDS = { manager: () => process.env.MANAGER_PASSWORD, staff: () => process.env.STAFF_PASSWORD };

const sign = (data) => createHmac("sha256", process.env.AUTH_SECRET || "").update(data).digest("base64url");
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function login(userId, password) {
  const user = USERS.find(u => u.id === userId);
  const expected = user && PASSWORDS[user.role]();
  if (!process.env.AUTH_SECRET || !expected) throw Object.assign(new Error("ยังไม่ได้ตั้งรหัสผ่านในเซิร์ฟเวอร์ (AUTH_SECRET, MANAGER_PASSWORD, STAFF_PASSWORD)"), { status: 503 });
  if (!same(String(password || ""), expected)) throw Object.assign(new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"), { status: 401 });
  const data = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return { user, token: `${data}.${sign(data)}`, maxAge: MAX_AGE, cookie: COOKIE };
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
  if (!user) throw Object.assign(new Error("กรุณาเข้าสู่ระบบ"), { status: 401 });
  if (role && user.role !== role) throw Object.assign(new Error("ไม่มีสิทธิ์ทำรายการนี้"), { status: 403 });
  return user;
}

export const SESSION_COOKIE = COOKIE;

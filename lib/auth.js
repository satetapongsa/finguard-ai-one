// ล็อกอิน: ตรวจรหัสกับผู้ใช้ในฐานข้อมูล แล้วเก็บ session เป็น cookie ที่เซ็นด้วย HMAC
import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { findUser, same, verifyUser } from "./users";

const COOKIE = "fg_session";
const MAX_AGE = 7 * 24 * 3600;
const fail = (message, status) => Object.assign(new Error(message), { status });
const sign = (data) => createHmac("sha256", process.env.AUTH_SECRET || "").update(data).digest("base64url");

export async function login(userId, password) {
  if (!process.env.AUTH_SECRET) throw fail("ยังไม่ได้ตั้ง AUTH_SECRET ในเซิร์ฟเวอร์", 503);
  const user = await verifyUser(userId, password);
  if (!user) throw fail("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
  const data = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return { user, token: `${data}.${sign(data)}`, maxAge: MAX_AGE, cookie: COOKIE };
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value || "";
  const [data, sig] = token.split(".");
  if (!data || !sig || !process.env.AUTH_SECRET || !same(sig, sign(data))) return null;
  const { id, exp } = JSON.parse(Buffer.from(data, "base64url").toString());
  return exp > Date.now() ? findUser(id) : null;
}

// ใช้ใน API: ไม่ล็อกอิน = 401, บทบาทไม่พอ = 403
export async function requireUser(role) {
  const user = await currentUser();
  if (!user) throw fail("กรุณาเข้าสู่ระบบ", 401);
  if (role && user.role !== role) throw fail("ไม่มีสิทธิ์ทำรายการนี้", 403);
  return user;
}

export const SESSION_COOKIE = COOKIE;

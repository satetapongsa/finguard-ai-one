// ผู้ใช้และรหัสผ่านเก็บในฐานข้อมูล (hash ด้วย scrypt)
// ครั้งแรกระบบสร้างผู้ใช้จากรายชื่อตั้งต้นใน staff.js ให้เอง โดยใช้รหัสของบทบาทจาก env เป็นรหัสเริ่มต้น
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { addUsers, loadUsers, setUserHash } from "./db";
import { USERS as SEED } from "./staff";

const fail = (message, status) => Object.assign(new Error(message), { status });
export const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const hashPassword = (pw, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
const publicUser = ({ hash, ...u }) => u;

async function allUsers() {
  const users = await loadUsers();
  const missing = SEED.filter(s => !users.some(u => u.id === s.id));
  if (!missing.length) return users;
  const pw = { manager: process.env.MANAGER_PASSWORD, staff: process.env.STAFF_PASSWORD };
  if (!pw.manager || !pw.staff) throw fail("ยังไม่ได้ตั้งรหัสผ่านเริ่มต้นในเซิร์ฟเวอร์ (MANAGER_PASSWORD, STAFF_PASSWORD)", 503);
  await addUsers(missing.map(u => ({ ...u, hash: hashPassword(pw[u.role]) })));
  return loadUsers();
}

export const listUsers = async () => (await allUsers()).map(publicUser);
export const findUser = async (id) => (await listUsers()).find(u => u.id === id) || null;

// คืนผู้ใช้ (ไม่มี hash) ถ้ารหัสถูก
export async function verifyUser(id, password) {
  const user = (await allUsers()).find(u => u.id === id);
  if (!user) return null;
  const [salt] = user.hash.split(":");
  return same(hashPassword(String(password || ""), salt), user.hash) ? publicUser(user) : null;
}

export async function changePassword(id, current, next) {
  next = String(next || "");
  if (!(await verifyUser(id, current))) throw fail("รหัสผ่านปัจจุบันไม่ถูกต้อง", 400);
  if (next.length < 8) throw fail("รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร", 400);
  await setUserHash(id, hashPassword(next));
}

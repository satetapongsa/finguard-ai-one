// ผู้ใช้และรหัสผ่านเก็บในฐานข้อมูล (hash ด้วย scrypt)
// ครั้งแรกระบบสร้างผู้ใช้จากรายชื่อตั้งต้นใน staff.js ให้เอง โดยใช้รหัสของบทบาทจาก env เป็นรหัสเริ่มต้น
// หัวหน้าเพิ่มผู้ใช้ รีเซ็ตรหัส และปิด/เปิดบัญชีได้ · ใส่รหัสผิด 5 ครั้งติด ล็อก 15 นาที
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { addUsers, loadUsers, updateUser } from "./db";
import { DEPTS, USERS as SEED } from "./staff";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const fail = (message, status) => Object.assign(new Error(message), { status });
export const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const hashPassword = (pw, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
const checkHash = (pw, stored) => same(hashPassword(String(pw || ""), stored.split(":")[0]), stored);
const publicUser = ({ id, name, nameEn, role, dept, active }) => ({ id, name, nameEn, role, dept, active: active !== false });
const strong = (pw) => { if (String(pw || "").length < 8) throw fail("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร", 400); return String(pw); };

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
export const findUser = async (id) => (await listUsers()).find(u => u.id === id && u.active) || null;

// คืนผู้ใช้ถ้ารหัสถูก · ผิดครบ 5 ครั้งล็อก 15 นาที (นับแยกรายคน เก็บในฐานข้อมูล)
export async function verifyUser(id, password) {
  const user = (await allUsers()).find(u => u.id === id);
  if (!user || user.active === false) return null;
  const lockedFor = Math.ceil((new Date(user.lockedUntil || 0) - Date.now()) / 60000);
  if (lockedFor > 0) throw fail(`ใส่รหัสผิดหลายครั้ง บัญชีถูกล็อกชั่วคราว ลองใหม่ใน ${lockedFor} นาที`, 429);
  if (checkHash(password, user.hash)) {
    if (user.fails || user.lockedUntil) await updateUser(id, { fails: 0, lockedUntil: null });
    return publicUser(user);
  }
  const fails = (user.fails || 0) + 1;
  await updateUser(id, fails >= MAX_FAILS
    ? { fails: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() }
    : { fails });
  return null;
}

export async function changePassword(id, current, next) {
  const user = (await allUsers()).find(u => u.id === id);
  if (!user || !checkHash(current, user.hash)) throw fail("รหัสผ่านปัจจุบันไม่ถูกต้อง", 400);
  await updateUser(id, { hash: hashPassword(strong(next)) });
}

// ---------- งานของหัวหน้า ----------
export async function createUser({ name, nameEn, role, dept, password }) {
  name = String(name || "").trim().slice(0, 80);
  nameEn = String(nameEn || "").trim().slice(0, 80) || name;
  if (!name) throw fail("กรุณาใส่ชื่อ", 400);
  if (!["manager", "staff"].includes(role)) throw fail("บทบาทไม่ถูกต้อง", 400);
  if (!DEPTS.includes(dept)) throw fail("ฝ่ายไม่ถูกต้อง", 400);
  const user = { id: `${role === "manager" ? "mgr" : "u"}-${randomBytes(3).toString("hex")}`, name, nameEn, role, dept, hash: hashPassword(strong(password)) };
  await allUsers();
  await addUsers([user]);
  return publicUser(user);
}

export async function adminUpdateUser(manager, id, { active, password }) {
  const user = (await allUsers()).find(u => u.id === id);
  if (!user) throw fail("ไม่พบผู้ใช้", 404);
  const fields = {};
  if (typeof active === "boolean") {
    if (id === manager.id && !active) throw fail("ปิดบัญชีของตัวเองไม่ได้", 400);
    fields.active = active;
  }
  if (password) Object.assign(fields, { hash: hashPassword(strong(password)), fails: 0, lockedUntil: null });
  if (!Object.keys(fields).length) throw fail("ไม่มีอะไรให้แก้", 400);
  await updateUser(id, fields);
  return publicUser({ ...user, ...fields });
}

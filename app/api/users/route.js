import { currentUser, requireUser } from "../../../lib/auth";
import { adminUpdateUser, createUser, listUsers } from "../../../lib/users";

export const dynamic = "force-dynamic";
const handle = (fn) => fn().catch(e => Response.json({ error: e.message }, { status: e.status || 500 }));

// รายชื่อผู้ใช้ (ไม่มีรหัส) · คนทั่วไปเห็นเฉพาะบัญชีที่เปิดอยู่ หัวหน้าเห็นทั้งหมด
export const GET = () => handle(async () => {
  const me = await currentUser().catch(() => null);
  const users = await listUsers();
  // หน้าเข้าสู่ระบบไม่แสดงบัญชีเจ้าของ (เข้าด้วยอีเมล) และไม่ส่งอีเมลออกไป
  return Response.json(me?.role === "manager" ? users : users.filter(u => u.active && !u.owner).map(({ email, ...u }) => u));
});

// หัวหน้าเพิ่มผู้ใช้
export const POST = (req) => handle(async () => {
  const me = await requireUser("manager");
  return Response.json(await createUser(me, await req.json().catch(() => ({}))), { status: 201 });
});

// หัวหน้ารีเซ็ตรหัส / ปิด-เปิดบัญชี
export const PATCH = (req) => handle(async () => {
  const me = await requireUser("manager");
  const { id, active, password } = await req.json().catch(() => ({}));
  return Response.json(await adminUpdateUser(me, id, { active, password }));
});

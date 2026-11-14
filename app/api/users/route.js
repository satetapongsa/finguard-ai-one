import { listUsers } from "../../../lib/users";

export const dynamic = "force-dynamic";

// รายชื่อผู้ใช้ (ไม่มีรหัส) สำหรับหน้าเข้าสู่ระบบและแสดงชื่อผู้รับงาน
export async function GET() {
  try {
    return Response.json((await listUsers()).map(({ id, name, nameEn, role, dept }) => ({ id, name, nameEn, role, dept })));
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

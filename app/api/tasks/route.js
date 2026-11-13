import { requireUser } from "../../../lib/auth";
import { updateTask } from "../../../lib/daily";

// อนุมัติ / ไม่อนุมัติ / ปิดงาน / คอมเมนต์ / แนบลิงก์หลักฐาน
export async function POST(req) {
  try {
    const user = await requireUser();
    const { taskId, status, comment, evidence } = await req.json().catch(() => ({}));
    if (!status && !comment && !evidence) return Response.json({ error: "ไม่มีอะไรให้บันทึก" }, { status: 400 });
    return Response.json(await updateTask(taskId, { status, comment, evidence }, user));
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

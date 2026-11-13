import { updateTask } from "../../../lib/daily";

const STATUSES = ["open", "done", "rejected"];

// อนุมัติ / ไม่อนุมัติ / ปิดงาน
export async function POST(req) {
  try {
    const { taskId, status } = await req.json().catch(() => ({}));
    if (!STATUSES.includes(status)) return Response.json({ error: "status ไม่ถูกต้อง" }, { status: 400 });
    return Response.json(await updateTask(taskId, status));
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

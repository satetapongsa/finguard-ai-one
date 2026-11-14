import { requireUser } from "../../../../lib/auth";
import { loadState } from "../../../../lib/db";
import { buildTaskList, sendEmail } from "../../../../lib/notify";
import { listUsers } from "../../../../lib/users";

export const dynamic = "force-dynamic";

// ส่งรายการงานเข้าอีเมลตอนที่กด: หัวหน้าได้งานทั้งหมดทุกธนาคาร พนักงานได้เฉพาะงานของตัวเอง
export async function POST() {
  try {
    const user = await requireUser();
    const { tasks, notices } = await loadState();
    const mine = tasks.filter(t => user.role === "manager" || t.assignee === user.id);
    if (!mine.length) return Response.json({ error: "ยังไม่มีงานให้ส่ง" }, { status: 400 });
    const r = await sendEmail(buildTaskList(mine, await listUsers(), notices, user));
    return r.sent ? Response.json({ sent: true, to: r.to, count: mine.length }) : Response.json({ error: r.reason }, { status: 502 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

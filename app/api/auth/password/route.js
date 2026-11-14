import { requireUser } from "../../../../lib/auth";
import { changePassword } from "../../../../lib/users";

export const dynamic = "force-dynamic";

// เปลี่ยนรหัสผ่านของตัวเอง
export async function POST(req) {
  try {
    const user = await requireUser();
    const { current, next } = await req.json().catch(() => ({}));
    await changePassword(user.id, current, next);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

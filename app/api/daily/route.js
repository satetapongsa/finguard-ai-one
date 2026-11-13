import { requireUser } from "../../../lib/auth";
import { BANKS } from "../../../lib/banks";
import { bankBrief, runDaily } from "../../../lib/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const fail = (e) => Response.json({ error: e.message }, { status: e.status || 500 });

// สรุปประจำวันของธนาคารที่เลือก (พนักงานเห็นเฉพาะงานของตัวเอง)
export async function GET(req) {
  try {
    const user = await requireUser();
    const bank = BANKS.find(b => b.real && b.id === new URL(req.url).searchParams.get("bank"));
    if (!bank) return Response.json({ error: "ไม่พบธนาคาร" }, { status: 404 });
    return Response.json(await bankBrief(bank.id, user));
  } catch (e) { return fail(e); }
}

// ปุ่ม "รันตอนนี้" (เฉพาะหัวหน้า)
export async function POST() {
  try { await requireUser("manager"); return Response.json(await runDaily()); } catch (e) { return fail(e); }
}

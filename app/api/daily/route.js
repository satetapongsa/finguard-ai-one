import { bankBrief, runDaily } from "../../../lib/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const fail = (e) => Response.json({ error: e.message }, { status: e.status || 500 });

// สรุปประจำวันของธนาคารที่เลือก
export async function GET(req) {
  try { return Response.json(await bankBrief(new URL(req.url).searchParams.get("bank"))); } catch (e) { return fail(e); }
}

// ปุ่ม "รันตอนนี้" ในหน้าเว็บ
export async function POST() {
  try { return Response.json(await runDaily()); } catch (e) { return fail(e); }
}

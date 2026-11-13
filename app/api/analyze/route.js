import { analyzeRegulation } from "../../../lib/agent";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!String(body.regText || "").trim()) return Response.json({ error: "ใส่เนื้อหาประกาศก่อน" }, { status: 400 });
    const result = await analyzeRegulation(body);
    if (!result.obligations.length) return Response.json({ error: "AI ไม่พบภาระหน้าที่ของธนาคารในข้อความนี้" }, { status: 422 });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

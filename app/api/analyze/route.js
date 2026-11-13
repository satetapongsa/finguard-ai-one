import { analyzeRegulation } from "../../../lib/agent";

export async function POST(req) {
  try {
    const body = await req.json();
    if (!String(body.regText || "").trim()) return Response.json({ error: "ใส่เนื้อหาประกาศก่อน" }, { status: 400 });
    return Response.json(await analyzeRegulation(body));
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

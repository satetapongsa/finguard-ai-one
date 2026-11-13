import { requireUser } from "../../../lib/auth";
import { fetchPublicHearings } from "../../../lib/bot";

// ร่างประกาศ ธปท. ที่เปิดรับฟังความคิดเห็นอยู่
export async function GET() {
  try {
    await requireUser();
    return Response.json({ hearings: await fetchPublicHearings() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 502 });
  }
}

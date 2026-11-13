import { runDaily } from "../../../lib/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel Cron เรียกทุกวัน 07:30 น. (เวลาไทย) ตาม vercel.json
export async function GET(req) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try { return Response.json(await runDaily()); } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}

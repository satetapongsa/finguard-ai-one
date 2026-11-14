import { requireUser } from "../../../../../lib/auth";
import { fetchNoticePdf } from "../../../../../lib/bot";
import { loadPdf, loadState, savePdf } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

// เปิดไฟล์ PDF ของประกาศจากฐานข้อมูลของเรา (ประกาศเก่าที่ยังไม่มีไฟล์ จะดึงจาก ธปท. มาเก็บให้ครั้งแรกที่เปิด)
export async function GET(req, { params }) {
  try {
    await requireUser();
    const { packId } = await params;
    if (!/^\d+$/.test(packId)) return Response.json({ error: "รหัสประกาศไม่ถูกต้อง" }, { status: 400 });
    let pdf = await loadPdf(packId);
    if (!pdf) {
      const notice = (await loadState()).notices[packId];
      if (!notice) return Response.json({ error: "ไม่พบประกาศ" }, { status: 404 });
      pdf = await fetchNoticePdf(notice.pdfUrl);
      await savePdf(packId, pdf);
    }
    return new Response(pdf, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="bot-notice-${packId}.pdf"`, "Cache-Control": "private, max-age=86400" }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

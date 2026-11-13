import { requireUser } from "../../../lib/auth";
import { extractText, getDocumentProxy } from "unpdf";

// ดึงข้อความจากไฟล์ PDF เพื่อนำไปวิเคราะห์
export async function POST(req) {
  try {
    await requireUser();
    const { dataBase64 } = await req.json();
    const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(dataBase64, "base64")));
    const { text } = await extractText(pdf, { mergePages: true });
    return Response.json({ text: text.replace(/\s+/g, " ").trim() });
  } catch (e) {
    return Response.json({ error: e.status ? e.message : "อ่านข้อความจาก PDF ไม่ได้" }, { status: e.status || 422 });
  }
}

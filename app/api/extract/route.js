import { extractText, getDocumentProxy } from "unpdf";

// ดึงข้อความจากไฟล์ PDF เพื่อนำไปวิเคราะห์
export async function POST(req) {
  try {
    const { dataBase64 } = await req.json();
    const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(dataBase64, "base64")));
    const { text } = await extractText(pdf, { mergePages: true });
    return Response.json({ text: text.replace(/\s+/g, " ").trim() });
  } catch {
    return Response.json({ error: "อ่านข้อความจาก PDF ไม่ได้" }, { status: 422 });
  }
}

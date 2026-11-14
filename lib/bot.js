// ดึงประกาศ ธปท. จริงจากระบบ FIPCS (ประกาศและหนังสือเวียนของ ธปท.) และอ่านข้อความจาก PDF
import { extractText, getDocumentProxy } from "unpdf";

const LIST_URL = "https://app.bot.or.th/FIPCS/Thai/PFIPCS_List.aspx?docgroup=1";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; FinGuard/1.0)" };
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// "30 ต.ค. 2569" -> "2026-10-30"
function toIsoDate(th) {
  const [d, m, y] = th.split(" ");
  const month = MONTHS.indexOf(m) + 1;
  return month ? `${Number(y) - 543}-${String(month).padStart(2, "0")}-${d.padStart(2, "0")}` : "";
}

// ประกาศ ธปท. ล่าสุดที่ยังใช้อยู่ เรียงจากใหม่ไปเก่า
export async function fetchLatestNotices(limit = 10) {
  const html = await fetch(LIST_URL, { headers: UA, cache: "no-store" }).then(r => {
    if (!r.ok) throw new Error(`ดึงรายการประกาศจาก ธปท. ไม่ได้ (${r.status})`);
    return r.text();
  });
  const rows = html.split(/<tr class="nonebgnews/).slice(1);
  return rows.map(row => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    return {
      packId: row.match(/packId=(\d+)/)?.[1],
      type: clean(cells[0] || ""),
      date: toIsoDate(clean(cells[1] || "")),
      title: clean(row.match(/<p class='setrow'>([\s\S]*?)<\/p>/)?.[1] || ""),
      pdfUrl: row.match(/href='(https:[^']+\.pdf)'/i)?.[1],
      active: /alt='ใช้อยู่'/.test(row)
    };
  }).filter(n => n.packId && n.pdfUrl && n.type === "ประกาศ ธปท." && n.active).slice(0, limit);
}

export async function fetchNoticePdf(pdfUrl) {
  const res = await fetch(pdfUrl, { headers: UA });
  if (!res.ok) throw new Error(`ดาวน์โหลด PDF จาก ธปท. ไม่ได้ (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// ส่งสำเนาให้ pdf.js เพราะมันอาจยึด buffer เดิมไปใช้
export async function pdfText(buf) {
  const { text } = await extractText(await getDocumentProxy(new Uint8Array(buf)), { mergePages: true });
  return text.replace(/\s+/g, " ").trim();
}

// ร่างประกาศที่ ธปท. เปิดรับฟังความคิดเห็นอยู่ (เตือนล่วงหน้าก่อนประกาศจริง) cache 1 ชั่วโมง
const HEARING_URL = "https://www.bot.or.th/content/bot/th/laws-and-rules/public-hearing/jcr:content/root/container/publichearinglist_19.publicHearingListingResults.20.p0.descending.ag0.st0.sk0.json";
const FULL_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

// "01 ธันวาคม 2569" -> "2026-12-01"
function fullThaiDate(th) {
  const [d, m, y] = String(th).trim().split(/\s+/);
  const month = FULL_MONTHS.indexOf(m) + 1;
  return month ? `${Number(y) - 543}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
}

export async function fetchPublicHearings() {
  const json = await fetch(HEARING_URL, { headers: UA, next: { revalidate: 3600 } }).then(r => {
    if (!r.ok) throw new Error(`ดึงรายการรับฟังความเห็นจาก ธปท. ไม่ได้ (${r.status})`);
    return r.json();
  });
  return Object.values(json.publicHearingResults || {})
    .flatMap(section => section.results || [])
    .filter(h => h.statusCode === "Open")
    .map(h => ({ title: h.listingTitle, url: h.pagePath, from: fullThaiDate(h.fromDt), to: fullThaiDate(h.toDt), daysLeft: Number(h.daysLeft) || 0, contact: h.contactName }))
    .sort((a, b) => a.to.localeCompare(b.to));
}

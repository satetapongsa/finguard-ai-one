// อีเมลผ่าน Resend (ไม่ตั้ง RESEND_API_KEY / NOTIFY_EMAIL = ไม่ส่ง)
// 1) สรุปหลังงานประจำวัน: งานใหม่ + งานที่เลยกำหนด  2) ปุ่ม "ส่งงานเข้าอีเมล": รายการงานทั้งหมดตอนที่กด
import { BANKS } from "./banks";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const bankName = (id) => BANKS.find(b => b.id === id)?.name || id;
const OPEN = ["pending_review", "open"];
const STATUS = { pending_review: "รออนุมัติ", open: "กำลังทำ", done: "เสร็จแล้ว", rejected: "ไม่อนุมัติ" };
const bangkokToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const link = () => (process.env.APP_URL ? `<p><a href="${esc(process.env.APP_URL)}">เปิด FinGuard AI</a></p>` : "");
const wrap = (body) => `<div style="font-family:sans-serif;font-size:14px;color:#0f172a">${body}${link()}</div>`;

export function buildDigest(tasks, newTaskIds, users, today = bangkokToday()) {
  const fresh = tasks.filter(t => newTaskIds.includes(t.taskId));
  const overdue = tasks.filter(t => OPEN.includes(t.status) && t.dueDate < today);
  if (!fresh.length && !overdue.length) return null;

  const rows = (list) => list.map(t => `<li><b>${esc(bankName(t.bankId))}</b> · ${esc(t.action)} <small>(กำหนด ${esc(t.dueDate)})</small></li>`).join("");
  const people = users.map(u => ({ u, fresh: fresh.filter(t => t.assignee === u.id), overdue: overdue.filter(t => t.assignee === u.id) }))
    .filter(p => p.fresh.length || p.overdue.length);

  return {
    subject: `FinGuard AI: งานใหม่ ${fresh.length} · เลยกำหนด ${overdue.length}`,
    html: wrap(`<h2>FinGuard AI · สรุปงานประจำวัน ${esc(today)}</h2>
      <p>งานใหม่ ${fresh.length} งาน · เลยกำหนด ${overdue.length} งาน</p>
      ${people.map(p => `<h3>${esc(p.u.name)} (${esc(p.u.dept)})</h3>
        ${p.fresh.length ? `<p>งานใหม่</p><ul>${rows(p.fresh)}</ul>` : ""}
        ${p.overdue.length ? `<p style="color:#b42318">เลยกำหนด</p><ul>${rows(p.overdue)}</ul>` : ""}`).join("")}`)
  };
}

// ตารางงานทั้งหมด แยกตามธนาคาร เรียงงานค้างขึ้นก่อน
export function buildTaskList(tasks, users, notices, who, today = bangkokToday()) {
  const name = (id) => users.find(u => u.id === id)?.name || id;
  const order = (t) => ["pending_review", "open", "done", "rejected"].indexOf(t.status);
  const td = 'style="border:1px solid #e2e8f0;padding:6px;vertical-align:top"';
  const banks = [...new Set(tasks.map(t => t.bankId))];
  const open = tasks.filter(t => OPEN.includes(t.status)).length;
  const overdue = tasks.filter(t => OPEN.includes(t.status) && t.dueDate < today).length;

  const table = (list) => `<table style="border-collapse:collapse;width:100%;font-size:13px">
    <tr style="background:#f1f5f9">${["สถานะ", "งาน", "ผู้รับงาน", "กำหนดเสร็จ", "ประกาศ"].map(h => `<th ${td}>${h}</th>`).join("")}</tr>
    ${list.sort((a, b) => order(a) - order(b) || a.dueDate.localeCompare(b.dueDate)).map(t => `<tr>
      <td ${td}>${STATUS[t.status] || t.status}${OPEN.includes(t.status) && t.dueDate < today ? ' <b style="color:#b42318">เลยกำหนด</b>' : ""}</td>
      <td ${td}>${esc(t.action)}${t.evidence ? `<br><a href="${esc(t.evidence)}">หลักฐาน</a>` : ""}</td>
      <td ${td}>${esc(name(t.assignee))}</td>
      <td ${td}>${esc(t.dueDate)}</td>
      <td ${td}>${esc(notices[t.packId]?.title || t.packId)}</td></tr>`).join("")}
  </table>`;

  return {
    subject: `FinGuard AI: งาน${who.role === "manager" ? "ทั้งหมด" : `ของ ${who.name}`} ${tasks.length} งาน (ค้าง ${open} · เลยกำหนด ${overdue})`,
    html: wrap(`<h2>FinGuard AI · งาน${who.role === "manager" ? "ทั้งหมด" : `ของ ${esc(who.name)}`} ณ ${esc(today)}</h2>
      <p>ทั้งหมด ${tasks.length} งาน · ค้าง ${open} · เลยกำหนด ${overdue} · ขอโดย ${esc(who.name)}</p>
      ${banks.map(b => `<h3>${esc(bankName(b))}</h3>${table(tasks.filter(t => t.bankId === b))}`).join("")}`)
  };
}

export async function sendEmail({ subject, html }) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) return { sent: false, reason: "ยังไม่ได้ตั้ง RESEND_API_KEY / NOTIFY_EMAIL" };
  const to = process.env.NOTIFY_EMAIL.split(",").map(s => s.trim()).filter(Boolean);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.NOTIFY_FROM || "FinGuard AI <onboarding@resend.dev>", to, subject, html })
  });
  if (res.ok) return { sent: true, to };
  const detail = await res.json().catch(() => ({}));
  return { sent: false, reason: `Resend ${res.status}${detail.message ? `: ${detail.message}` : ""}` };
}

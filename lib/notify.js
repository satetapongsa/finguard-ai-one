// อีเมลสรุปหลังงานประจำวัน: งานใหม่ของแต่ละคน + งานที่เลยกำหนด ส่งผ่าน Resend (ไม่ตั้ง key = ข้าม)
import { BANKS } from "./banks";
import { STAFF } from "./staff";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const bankName = (id) => BANKS.find(b => b.id === id)?.name || id;
const OPEN = ["pending_review", "open"];

export function buildDigest(tasks, newTaskIds, today = new Date().toISOString().slice(0, 10)) {
  const fresh = tasks.filter(t => newTaskIds.includes(t.taskId));
  const overdue = tasks.filter(t => OPEN.includes(t.status) && t.dueDate < today);
  if (!fresh.length && !overdue.length) return null;

  const rows = (list) => list.map(t => `<li><b>${esc(bankName(t.bankId))}</b> · ${esc(t.action)} <small>(กำหนด ${esc(t.dueDate)})</small></li>`).join("");
  const people = STAFF.map(s => ({ s, fresh: fresh.filter(t => t.assignee === s.id), overdue: overdue.filter(t => t.assignee === s.id) }))
    .filter(p => p.fresh.length || p.overdue.length);
  const url = process.env.APP_URL || "";

  const html = `<div style="font-family:sans-serif;font-size:14px">
    <h2>FinGuard AI · สรุปงานประจำวัน ${esc(today)}</h2>
    <p>งานใหม่ ${fresh.length} งาน · เลยกำหนด ${overdue.length} งาน</p>
    ${people.map(p => `<h3>${esc(p.s.name)} (${esc(p.s.dept)})</h3>
      ${p.fresh.length ? `<p>งานใหม่</p><ul>${rows(p.fresh)}</ul>` : ""}
      ${p.overdue.length ? `<p style="color:#b42318">เลยกำหนด</p><ul>${rows(p.overdue)}</ul>` : ""}`).join("")}
    ${url ? `<p><a href="${esc(url)}">เปิด FinGuard AI</a></p>` : ""}
  </div>`;
  return { subject: `FinGuard AI: งานใหม่ ${fresh.length} · เลยกำหนด ${overdue.length}`, html };
}

export async function sendDigest(digest) {
  if (!digest) return { sent: false, reason: "no tasks" };
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) return { sent: false, reason: "RESEND_API_KEY / NOTIFY_EMAIL not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.NOTIFY_FROM || "FinGuard AI <onboarding@resend.dev>", to: process.env.NOTIFY_EMAIL.split(","), ...digest })
  });
  return res.ok ? { sent: true } : { sent: false, reason: `Resend ${res.status}` };
}

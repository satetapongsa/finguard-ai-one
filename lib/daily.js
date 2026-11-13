// งานประจำวัน (cron 07:30): ดึงประกาศ ธปท. ใหม่ → ให้ AI เทียบกับทุกธนาคาร → สร้างงานและแบ่งให้พนักงาน
// Groq free tier จำกัด token ต่อนาที จึงทำทีละคู่ (ประกาศ × ธนาคาร) ภายในเวลาที่กำหนด ที่เหลือทำต่อรอบถัดไป
import { analyzeRegulation } from "./agent";
import { BANKS } from "./banks";
import { fetchLatestNotices, fetchNoticeText } from "./bot";
import { loadState, saveState, tryLock, unlock } from "./db";
import { pickAssignee } from "./staff";

const NEW_PER_RUN = 2;
const TIME_BUDGET_MS = 240_000;
const REAL_BANKS = BANKS.filter(b => b.real);

const addDays = (iso, n) => new Date(new Date(iso).getTime() + n * 86400000).toISOString().slice(0, 10);

// โหลดข้อมูลล่าสุด → แก้ → บันทึก ทุกครั้ง เพื่อไม่ทับสิ่งที่คนกดในหน้าเว็บระหว่างงานกำลังรัน
async function update(fn) {
  const state = await loadState();
  state.queue ||= [];
  const out = fn(state);
  await saveState(state);
  return out;
}

export async function runDaily() {
  if (!(await tryLock())) return { busy: true, message: "งานประจำวันกำลังรันอยู่แล้ว" };
  try {
    const started = Date.now();

    // 1) หาประกาศใหม่ที่ยังไม่เคยเห็น แล้วเข้าคิวให้ทุกธนาคาร
    const known = (await loadState()).notices;
    const fresh = (await fetchLatestNotices(15)).filter(n => !known[n.packId]).slice(0, NEW_PER_RUN);
    for (const n of fresh) {
      const text = (await fetchNoticeText(n.pdfUrl)).slice(0, 9000);
      await update(s => {
        s.notices[n.packId] = { ...n, text, fetchedAt: new Date().toISOString() };
        REAL_BANKS.forEach(b => s.queue.push({ packId: n.packId, bankId: b.id }));
      });
    }

    // 2) วิเคราะห์ตามคิวจนหมดเวลา (เรียก AI นอก update เพราะใช้เวลานาน)
    let done = 0, created = 0;
    while (Date.now() - started < TIME_BUDGET_MS) {
      const state = await loadState();
      const next = state.queue?.[0];
      if (!next) break;
      const n = state.notices[next.packId];
      const key = `${next.bankId}:${next.packId}`;
      let r;
      try { r = await analyzeRegulation({ title: n.title, regText: n.text, bankId: next.bankId, lang: "th" }); }
      catch (e) {
        if (e.status === 429) break; // โควตาหมด รอรอบถัดไป
        await update(s => { s.results[key] = { error: e.message, at: new Date().toISOString() }; s.queue.shift(); });
        continue;
      }
      created += await update(s => {
        s.results[key] = { summary: r.summary, effectiveDate: r.effectiveDate, obligations: r.obligations, gaps: r.gaps, at: new Date().toISOString() };
        for (const t of r.tasks) {
          s.tasks.push({
            taskId: `${next.bankId}-${next.packId}-${t.obligationId}`, bankId: next.bankId, packId: next.packId, obligationId: t.obligationId,
            action: t.action, owner: t.owner, assignee: pickAssignee(t.owner, s.tasks),
            status: t.needsHumanReview ? "pending_review" : "open",
            dueDate: r.effectiveDate >= n.date ? r.effectiveDate : addDays(n.date, 30), createdAt: new Date().toISOString()
          });
        }
        s.queue.shift();
        return r.tasks.length;
      });
      done++;
    }

    return await update(s => {
      const run = { at: new Date().toISOString(), newNotices: fresh.map(n => n.packId), analyzed: done, tasksCreated: created, remaining: s.queue.length };
      s.runs = [run, ...(s.runs || [])].slice(0, 30);
      return run;
    });
  } finally {
    await unlock();
  }
}

// ข้อมูลสำหรับหน้าเว็บของธนาคารหนึ่ง (ไม่ส่งข้อความเต็มของประกาศ)
export async function bankBrief(bankId) {
  const state = await loadState();
  const notices = Object.values(state.notices).sort((a, b) => b.date.localeCompare(a.date)).map(({ text, ...n }) => ({
    ...n, result: state.results[`${bankId}:${n.packId}`] || null, queued: (state.queue || []).some(q => q.packId === n.packId && q.bankId === bankId)
  }));
  return { notices, tasks: state.tasks.filter(t => t.bankId === bankId), lastRun: state.runs?.[0] || null };
}

export async function updateTask(taskId, status) {
  return update(s => {
    const task = s.tasks.find(t => t.taskId === taskId);
    if (!task) throw Object.assign(new Error("ไม่พบงาน"), { status: 404 });
    return Object.assign(task, { status, updatedAt: new Date().toISOString() });
  });
}

// งานประจำวัน (cron 07:30): ดึงประกาศ ธปท. ใหม่ → ให้ AI เทียบกับทุกธนาคาร → สร้างงานและแบ่งให้พนักงาน
// Groq free tier จำกัด token ต่อนาที จึงทำทีละคู่ (ประกาศ × ธนาคาร) ภายในเวลาที่กำหนด ที่เหลือทำต่อรอบถัดไป
import { analyzeRegulation } from "./agent";
import { BANKS } from "./banks";
import { fetchLatestNotices, fetchNoticeText } from "./bot";
import { loadState, saveState } from "./db";
import { pickAssignee } from "./staff";

const NEW_PER_RUN = 2;
const TIME_BUDGET_MS = 240_000;
const REAL_BANKS = BANKS.filter(b => b.real);

const addDays = (iso, n) => new Date(new Date(iso).getTime() + n * 86400000).toISOString().slice(0, 10);

export async function runDaily() {
  const started = Date.now();
  const state = await loadState();
  state.queue ||= [];

  // 1) หาประกาศใหม่ที่ยังไม่เคยเห็น แล้วเข้าคิวให้ทุกธนาคาร
  const fresh = (await fetchLatestNotices(15)).filter(n => !state.notices[n.packId]).slice(0, NEW_PER_RUN);
  for (const n of fresh) {
    const text = await fetchNoticeText(n.pdfUrl);
    state.notices[n.packId] = { ...n, text: text.slice(0, 9000), fetchedAt: new Date().toISOString() };
    REAL_BANKS.forEach(b => state.queue.push({ packId: n.packId, bankId: b.id }));
  }

  // 2) วิเคราะห์ตามคิวจนหมดเวลา
  let done = 0, created = 0;
  while (state.queue.length && Date.now() - started < TIME_BUDGET_MS) {
    const { packId, bankId } = state.queue[0];
    const n = state.notices[packId];
    let r;
    try { r = await analyzeRegulation({ title: n.title, regText: n.text, bankId, lang: "th" }); }
    catch (e) {
      if (e.status === 429) break; // โควตาหมด รอรอบถัดไป
      state.results[`${bankId}:${packId}`] = { error: e.message, at: new Date().toISOString() };
      state.queue.shift(); await saveState(state); continue;
    }
    state.results[`${bankId}:${packId}`] = { summary: r.summary, effectiveDate: r.effectiveDate, obligations: r.obligations, gaps: r.gaps, at: new Date().toISOString() };
    for (const t of r.tasks) {
      state.tasks.push({
        taskId: `${bankId}-${packId}-${t.obligationId}`, bankId, packId, obligationId: t.obligationId,
        action: t.action, owner: t.owner, assignee: pickAssignee(t.owner, state.tasks),
        status: t.needsHumanReview ? "pending_review" : "open",
        dueDate: r.effectiveDate >= n.date ? r.effectiveDate : addDays(n.date, 30), createdAt: new Date().toISOString()
      });
      created++;
    }
    state.queue.shift();
    done++;
    await saveState(state); // บันทึกทุกคู่ ถ้าหมดเวลากลางทางจะไม่เสียงานที่ทำแล้ว
  }

  const run = { at: new Date().toISOString(), newNotices: fresh.map(n => n.packId), analyzed: done, tasksCreated: created, remaining: state.queue.length };
  state.runs = [run, ...(state.runs || [])].slice(0, 30);
  await saveState(state);
  return run;
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
  const state = await loadState();
  const task = state.tasks.find(t => t.taskId === taskId);
  if (!task) throw Object.assign(new Error("ไม่พบงาน"), { status: 404 });
  Object.assign(task, { status, updatedAt: new Date().toISOString() });
  await saveState(state);
  return task;
}

// API ฝั่งเบราว์เซอร์: ข้อมูลทั้งหมดเก็บใน localStorage ของผู้ใช้
// ข้อมูลเก็บใน localStorage ของเบราว์เซอร์คนที่ใช้งานเท่านั้น

const BANK_POLICIES = [
  { policyId: "POL-001", title: "การรายงานธุรกรรมที่มีเหตุอันควรสงสัย", owner: "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์", text: "ธนาคารต้องรายงานธุรกรรมที่มีเหตุอันควรสงสัยต่อหน่วยงานกำกับภายใน 7 วันทำการนับแต่วันที่ตรวจพบ" },
  { policyId: "POL-002", title: "การเก็บรักษาข้อมูลลูกค้าและธุรกรรม", owner: "ฝ่ายปฏิบัติการ", text: "ธนาคารต้องเก็บรักษาข้อมูลการทำธุรกรรมของลูกค้าไว้ไม่น้อยกว่า 5 ปี" },
  { policyId: "POL-003", title: "การยืนยันตัวตนลูกค้าเมื่อเปิดบัญชี", owner: "ฝ่ายปฏิบัติการ", text: "การเปิดบัญชีต้องยืนยันตัวตนด้วยบัตรประจำตัวประชาชน และตรวจสอบสถานะบัตรกับฐานข้อมูลกลางของรัฐ" },
  { policyId: "POL-004", title: "วงเงินโอนต่อวัน", owner: "ฝ่ายดิจิทัลแบงกิ้ง", text: "ลูกค้าบุคคลธรรมดามีวงเงินโอนผ่านช่องทางดิจิทัลสูงสุด 500,000 บาทต่อวัน หากเกินต้องได้รับอนุมัติจากผู้จัดการสาขา" },
  { policyId: "POL-005", title: "การทบทวนความเสี่ยงลูกค้า", owner: "ฝ่ายบริหารความเสี่ยง", text: "ธนาคารต้องทบทวนระดับความเสี่ยงของลูกค้าความเสี่ยงสูงอย่างน้อยปีละ 1 ครั้ง" },
  { policyId: "POL-006", title: "การใช้บริการจากผู้ให้บริการภายนอกด้าน IT และ Cloud", owner: "ฝ่ายเทคโนโลยีสารสนเทศ", text: "ก่อนใช้บริการ Cloud หรือผู้ให้บริการภายนอกด้าน IT ต้องประเมินความเสี่ยงและได้รับอนุมัติจากคณะกรรมการบริหารความเสี่ยง" },
  { policyId: "POL-007", title: "แผนรองรับการดำเนินธุรกิจอย่างต่อเนื่อง (BCP)", owner: "ฝ่ายเทคโนโลยีสารสนเทศ", text: "ธนาคารต้องทดสอบแผน BCP ด้านระบบงานสำคัญอย่างน้อยทุก 2 ปี" },
  { policyId: "POL-008", title: "การรายงานเหตุการณ์ภัยไซเบอร์", owner: "ฝ่ายความปลอดภัยไซเบอร์", text: "เมื่อเกิดเหตุการณ์ภัยไซเบอร์ร้ายแรงต้องรายงานผู้บริหารระดับสูงทันที และรายงานหน่วยงานกำกับภายใน 72 ชั่วโมง" },
  { policyId: "POL-009", title: "การระงับธุรกรรมและบัญชีต้องสงสัย", owner: "ฝ่ายป้องกันทุจริต", text: "ธนาคารสามารถระงับบัญชีที่ต้องสงสัยว่าเกี่ยวข้องกับการทุจริตได้ไม่เกิน 7 วัน และแจ้งเจ้าของบัญชีภายใน 3 วันทำการ" },
  { policyId: "POL-010", title: "เจ้าหน้าที่กำกับการปฏิบัติตามกฎเกณฑ์", owner: "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์", text: "ธนาคารต้องมีเจ้าหน้าที่กำกับการปฏิบัติตามกฎเกณฑ์ที่รายงานตรงต่อคณะกรรมการตรวจสอบ" },
  { policyId: "POL-011", title: "การรายงานผลการบริหารความเสี่ยงต่อผู้บริหาร", owner: "ฝ่ายบริหารความเสี่ยง", text: "ผลการทบทวนความเสี่ยงลูกค้าต้องรายงานคณะกรรมการบริหารความเสี่ยงทุกไตรมาส" },
  { policyId: "POL-012", title: "การทบทวนนโยบายด้านเทคโนโลยีสารสนเทศ", owner: "ฝ่ายเทคโนโลยีสารสนเทศ", text: "ธนาคารต้องทบทวนนโยบายความเสี่ยงด้านเทคโนโลยีสารสนเทศอย่างน้อยปีละ 1 ครั้ง" }
];

const WATCH_FEED = [
  { regId: "BOT-WATCH-001", stage: "draft", title: "(ร่าง) แนวปฏิบัติการป้องกันภัยทุจริตทางการเงินผ่านช่องทางดิจิทัล", publishedAt: "2026-10-10", effectiveDate: "2027-04-01",
    text: "ร่างประกาศเพื่อรับฟังความคิดเห็น ข้อ 1 สถาบันการเงินต้องแจ้งเตือนลูกค้าผ่าน Mobile Banking ทุกครั้งที่มีการเปลี่ยนอุปกรณ์ที่ใช้ทำธุรกรรม ข้อ 2 สถาบันการเงินต้องระงับบัญชีที่ต้องสงสัยว่าเป็นบัญชีม้าได้ไม่เกิน 30 วัน และแจ้งเจ้าของบัญชีภายใน 24 ชั่วโมง ข้อ 3 สถาบันการเงินต้องรายงานสถิติบัญชีที่ถูกระงับต่อธนาคารแห่งประเทศไทยทุกเดือน" },
  { regId: "BOT-WATCH-002", stage: "final", title: "ประกาศการรายงานเหตุการณ์ภัยไซเบอร์ของสถาบันการเงิน", publishedAt: "2026-10-14", effectiveDate: "2027-01-01",
    text: "ข้อ 1 สถาบันการเงินต้องรายงานเหตุการณ์ภัยไซเบอร์ที่มีผลกระทบร้ายแรงต่อธนาคารแห่งประเทศไทยภายใน 24 ชั่วโมงนับแต่ตรวจพบ ข้อ 2 ต้องส่งรายงานสรุปสาเหตุและแนวทางแก้ไขภายใน 7 วัน ข้อ 3 ต้องทดสอบแผนรองรับการดำเนินธุรกิจอย่างต่อเนื่องด้าน IT อย่างน้อยปีละ 1 ครั้ง" },
  { regId: "BOT-WATCH-003", stage: "amendment", title: "ประกาศแก้ไขหลักเกณฑ์การเก็บรักษาข้อมูลธุรกรรม", publishedAt: "2026-10-16", effectiveDate: "2027-07-01",
    text: "แก้ไขเพิ่มเติม ข้อ 1 ให้สถาบันการเงินเก็บรักษาข้อมูลการทำธุรกรรมไว้ไม่น้อยกว่า 10 ปีนับแต่วันที่ยุติความสัมพันธ์กับลูกค้า ข้อ 2 ข้อมูลที่เก็บต้องเรียกดูได้ภายใน 3 วันทำการเมื่อธนาคารแห่งประเทศไทยร้องขอ" }
];

const SAMPLE_DOC_TEXT = "ประกาศตัวอย่างสำหรับโหมดจำลอง ข้อ 1 สถาบันการเงินต้องเปิดเผยค่าธรรมเนียมการโอนเงินทุกประเภทบนแอปพลิเคชันก่อนลูกค้ายืนยันธุรกรรม ข้อ 2 สถาบันการเงินต้องตอบข้อร้องเรียนของลูกค้าภายใน 15 วัน ข้อ 3 ต้องทบทวนนโยบายด้านเทคโนโลยีสารสนเทศอย่างน้อยปีละ 1 ครั้ง";

// ---------- storage ----------
const KEY = "fg-demo-v1";
let mem = null;
const blank = () => ({ regs: {}, obligations: [], gaps: [], tasks: [], alerts: [], docs: [] });
function load() {
  if (mem) return mem;
  try { mem = JSON.parse(localStorage.getItem(KEY)) || null; } catch { mem = null; }
  if (!mem) { mem = blank(); seed(); }
  return mem;
}
function save() {
  try {
    const slim = { ...mem, docs: mem.docs.map(d => d.size > 1500000 ? { ...d, dataBase64: null } : d) };
    localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {}
}
export function resetDemo() { mem = blank(); seed(); save(); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString();
const clone = (x) => JSON.parse(JSON.stringify(x));
const toB64 = (s) => btoa(unescape(encodeURIComponent(s)));

// ---------- ค้นแบบ bigram (เหมือนของจริง) ----------
const norm = (s) => String(s || "").toLowerCase().replace(/[\s.,:;()"'\-–/]+/g, "");
const grams = (s) => { const t = norm(s); const g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); return g; };
const PG = BANK_POLICIES.map(p => grams(p.title + p.text));
function search(q) {
  const qg = grams(q); if (!qg.size) return [];
  return BANK_POLICIES.map((p, i) => { let h = 0; qg.forEach(g => { if (PG[i].has(g)) h++; }); return { ...p, score: Math.round(h / qg.size * 100) / 100 }; })
    .sort((a, b) => b.score - a.score).slice(0, 3);
}

// ---------- Agent จำลอง ----------
const nums = (s) => (String(s).match(/\d[\d,]*/g) || []).map(n => n.replace(/,/g, ""));
function splitClauses(text) {
  const parts = String(text).split(/(?=ข้อ\s*\d+)/).map(s => s.trim()).filter(s => /^ข้อ\s*\d+/.test(s));
  if (parts.length) return parts;
  return String(text).split(/\s{2,}|\n+/).map(s => s.trim()).filter(s => s.length > 20).slice(0, 6).map((s, i) => `ข้อ ${i + 1} ${s}`);
}
function extract(clause, i) {
  const m = clause.match(/^ข้อ\s*(\d+)\s*/);
  const body = clause.replace(/^ข้อ\s*\d+\s*/, "").trim();
  const who = /ลูกค้า/.test(body.slice(0, 12)) ? "ลูกค้า" : "สถาบันการเงิน";
  const what = body.replace(/^(ให้)?(สถาบันการเงิน|ธนาคาร)?(ต้อง)?/, "").replace(/^ต้อง/, "").trim();
  const dl = body.match(/(ภายใน\s*\d+\s*(วันทำการ|วัน|ชั่วโมง|เดือน|ปี))|(อย่างน้อย\s*(ทุก\s*\d+\s*(เดือน|ปี)|ปีละ\s*\d+\s*ครั้ง))|(ทุกเดือน|ทุกไตรมาส)|(ไม่น้อยกว่า\s*\d+\s*(ปี|วัน))|(ไม่เกิน\s*\d+\s*(วัน|ชั่วโมง))/);
  const th = body.match(/\d[\d,]*\s*บาท/);
  return { obligationId: `OB-${i + 1}`, who, what: what.slice(0, 160), deadline: dl ? dl[0] : "-", threshold: th ? th[0] : "-", sourceClause: m ? `ข้อ ${m[1]}` : `ข้อ ${i + 1}` };
}
function judge(clause, cands, stage) {
  const top = cands[0];
  if (!top || top.score < 0.4) return { status: "missing", policyId: "-", confidence: 0.85, reason: `ไม่พบ policy ภายในที่ครอบคลุม${clause.slice(0, 5)}นี้ ต้องจัดทำข้อกำหนดใหม่` };
  const a = nums(clause), b = nums(top.text);
  const conf = Math.min(0.95, 0.55 + top.score * 0.4);
  if (a.length && b.length && !a.some(n => b.includes(n))) {
    return { status: "conflict", policyId: top.policyId, confidence: Math.round(conf * 100) / 100, reason: `${top.policyId} (${top.title}) เป็นเรื่องเดียวกัน แต่กำหนดตัวเลขหรือระยะเวลาไม่ตรงกับประกาศ (ประกาศ: ${a.join(", ")} · policy: ${b.join(", ")}) ต้องแก้ policy ให้เข้มเท่าประกาศ` };
  }
  if (top.score >= 0.75) return { status: "covered", policyId: top.policyId, confidence: Math.round(conf * 100) / 100, reason: `${top.policyId} (${top.title}) ครอบคลุมภาระหน้าที่นี้ครบ` };
  return { status: "partial", policyId: top.policyId, confidence: Math.round((conf - 0.1) * 100) / 100, reason: `${top.policyId} (${top.title}) เกี่ยวข้องแต่ยังไม่ครอบคลุมรายละเอียดบางส่วนของประกาศ ควรเพิ่มเติมให้ครบ${stage === "draft" ? " (เป็นร่างประกาศ ควรเริ่มประเมินผลกระทบล่วงหน้า)" : ""}` };
}

function addAlert(type, title, message, regId) {
  const s = load();
  s.alerts.unshift({ alertId: `${now()}#${Math.random().toString(36).slice(2, 8)}`, type, title, message, regId, read: false, createdAt: now() });
}

function analyzeSync({ regId, title, effectiveDate, regText, docKey, source, stage }, at) {
  const s = load();
  regId = String(regId || `BOT-${Date.now()}`).replace(/[^A-Za-z0-9\-_.]/g, "").slice(0, 80);
  effectiveDate = effectiveDate || "2026-12-01";
  let text = String(regText || "");
  if (!text.trim() && docKey) {
    const d = s.docs.find(x => x.key === docKey);
    text = d?.text || SAMPLE_DOC_TEXT;
  }
  if (!text.trim()) throw Object.assign(new Error("ใส่เนื้อหาประกาศหรือเลือกเอกสารก่อน"), { status: 400 });
  const ts = at || now();

  s.obligations = s.obligations.filter(o => o.regId !== regId);
  s.gaps = s.gaps.filter(g => g.regId !== regId);
  s.tasks = s.tasks.filter(t => t.regId !== regId);

  const trace = []; let turn = 1;
  const clauses = splitClauses(text);
  const obs = clauses.map((c, i) => extract(c, i));
  obs.forEach(o => { s.obligations.push({ ...o, regId, createdAt: ts }); trace.push({ turn, tool: "save_obligation", input: o, result: { saved: true } }); });
  turn++;
  const counts = { obligations: obs.length, covered: 0, partial: 0, missing: 0, conflict: 0, pending: 0, tasks: 0 };
  let t = 0;
  obs.forEach((o, i) => {
    const q = o.what.slice(0, 40);
    const cands = search(q);
    trace.push({ turn, tool: "search_internal_policy", input: { query: q }, result: { top: cands.map(c => `${c.policyId} (${c.score})`) } });
    const g = judge(clauses[i], cands, stage);
    const gapId = `GAP-${i + 1}`;
    s.gaps.push({ gapId: `${regId}#${gapId}`, obligationId: o.obligationId, regId, ...g, createdAt: ts });
    trace.push({ turn: turn + 1, tool: "save_gap", input: { gapId, obligationId: o.obligationId, ...g }, result: { saved: true } });
    counts[g.status]++;
    if (g.status !== "covered") {
      t++;
      const owner = BANK_POLICIES.find(p => p.policyId === g.policyId)?.owner || "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์";
      const action = g.status === "missing" ? `จัดทำ policy ใหม่ให้รองรับ${o.sourceClause}` : g.status === "conflict" ? `แก้ไข ${g.policyId} ให้สอดคล้องกับ${o.sourceClause}` : `ปรับปรุง ${g.policyId} ให้ครบตาม${o.sourceClause}`;
      const needs = g.confidence < 0.8 || g.status === "conflict" || stage === "draft";
      s.tasks.push({ taskId: `${regId}#TASK-${t}`, gapId: `${regId}#${gapId}`, regId, owner, action, dueDate: effectiveDate, needsHumanReview: needs, status: needs ? "pending_review" : "open", createdAt: ts });
      trace.push({ turn: turn + 2, tool: "create_task", input: { taskId: `TASK-${t}`, owner, action, dueDate: effectiveDate, needsHumanReview: needs }, result: { saved: true } });
      counts.tasks++; if (needs) counts.pending++;
    }
  });
  const risky = counts.missing + counts.conflict;
  const summary = `พบภาระหน้าที่ ${counts.obligations} ข้อ ครอบคลุมแล้ว ${counts.covered} ข้อ บางส่วน ${counts.partial} ข้อ ขาดหรือขัดกับ policy ${risky} ข้อ สร้างงาน ${counts.tasks} งาน โดย ${counts.pending} งานรอคนอนุมัติก่อนดำเนินการ (ผลจากโหมดจำลอง)`;
  s.regs[regId] = { regId, title: title || regId, effectiveDate, source: source || "manual", stage: stage || "final", docKey, status: "done", summary, counts, trace, turns: turn + 2, createdAt: ts, finishedAt: ts };
  addAlert(risky ? "risk" : "done", `วิเคราะห์เสร็จ: ${title || regId}`, `พบ ${counts.obligations} ภาระหน้าที่ · ขาด/ขัดแย้ง ${risky} · รออนุมัติ ${counts.pending} งาน`, regId);
  return { regId, summary, turns: turn + 2, trace, counts };
}

function seed() {
  const back = (h) => new Date(Date.now() - h * 3600000).toISOString();
  const f = WATCH_FEED[0];
  addAlert("new", `พบร่างประกาศ (รับฟังความเห็น): ${f.title}`, `เผยแพร่ ${f.publishedAt} · มีผล ${f.effectiveDate} · Agent เริ่มวิเคราะห์อัตโนมัติ`, f.regId);
  analyzeSync({ ...f, regText: f.text, source: "watcher" }, back(20));
  analyzeSync({ regId: "BOT-AML-DEMO", title: "รายงานธุรกรรมที่มีเหตุอันควรสงสัย", effectiveDate: "2027-01-01", source: "manual",
    regText: "ข้อ 1 ให้สถาบันการเงินรายงานธุรกรรมที่มีเหตุอันควรสงสัยต่อธนาคารแห่งประเทศไทยภายใน 3 วันทำการนับแต่วันที่ตรวจพบ ข้อ 2 ให้สถาบันการเงินเก็บรักษาข้อมูลการทำธุรกรรมไว้ไม่น้อยกว่า 10 ปี ข้อ 3 ให้สถาบันการเงินแต่งตั้งเจ้าหน้าที่กำกับดูแลด้านการปฏิบัติตามกฎเกณฑ์ภายใน 90 วันนับแต่วันที่ประกาศมีผลบังคับใช้" }, back(3));
  mem.docs.push({ key: `docs/regulation/${Date.now()}-sample.txt`, name: "ประกาศตัวอย่าง.txt", kind: "regulation", size: SAMPLE_DOC_TEXT.length * 3, lastModified: back(5), contentType: "text/plain", text: SAMPLE_DOC_TEXT, dataBase64: toB64(SAMPLE_DOC_TEXT) });
  mem.alerts.forEach((a, i) => { if (i > 0) a.read = true; });
}

// ---------- router ----------
export async function mockApi(path, options = {}) {
  const s = load();
  const method = (options.method || "GET").toUpperCase();
  const [p, qs] = path.split("?");
  const q = Object.fromEntries(new URLSearchParams(qs || ""));
  const body = options.body ? JSON.parse(options.body) : {};
  await sleep(150 + Math.random() * 250);
  const out = (x) => { save(); return clone(x); };
  const bad = (m) => { throw Object.assign(new Error(m), { status: 400 }); };

  switch (`${method} ${p}`) {
    case "GET /policies": return out({ policies: BANK_POLICIES });
    case "GET /regulations": {
      const regs = Object.values(s.regs).map(({ trace, ...r }) => r).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return out({ regulations: regs });
    }
    case "GET /results": {
      if (!q.regId) bad("ต้องระบุ regId");
      return out({ regId: q.regId, regulation: s.regs[q.regId] || null,
        obligations: s.obligations.filter(o => o.regId === q.regId), gaps: s.gaps.filter(g => g.regId === q.regId), tasks: s.tasks.filter(t => t.regId === q.regId) });
    }
    case "GET /overview":
      return out({ regulations: Object.values(s.regs).map(({ trace, ...r }) => r), tasks: s.tasks, gaps: s.gaps });
    case "GET /alerts":
      return out({ alerts: s.alerts.slice(0, 50), unread: s.alerts.filter(a => !a.read).length });
    case "POST /alerts/read": {
      let n = 0; s.alerts.forEach(a => { if ((body.all || a.alertId === body.alertId) && !a.read) { a.read = true; n++; } });
      return out({ updated: n });
    }
    case "POST /review": {
      const t = s.tasks.find(x => x.taskId === body.taskId);
      if (!t || !["approved", "rejected"].includes(body.decision)) bad("ต้องระบุ taskId และ decision เป็น approved หรือ rejected");
      Object.assign(t, { status: body.decision, reviewedBy: body.reviewer || "reviewer", reviewedAt: now() });
      const r = s.regs[t.regId]; if (r?.counts) r.counts.pending = s.tasks.filter(x => x.regId === t.regId && x.status === "pending_review").length;
      return out({ task: t });
    }
    case "POST /run": case "POST /": {
      await sleep(6000 + Math.random() * 4000);
      return out(analyzeSync({ ...body, source: body.docKey ? "upload" : "manual" }));
    }
    case "GET /watch/feed":
      return out({ feed: WATCH_FEED.map(({ text, ...f }) => ({ ...f, analyzed: !!s.regs[f.regId] })) });
    case "POST /watch/run": {
      const next = WATCH_FEED.find(f => !s.regs[f.regId]);
      await sleep(1500);
      if (!next) return out({ found: 0, message: "ไม่พบประกาศใหม่ ทุกฉบับในแหล่งที่ติดตามวิเคราะห์แล้ว (กดรีเซ็ตข้อมูลจำลองเพื่อเริ่มใหม่)" });
      const stageTh = { draft: "ร่างประกาศ (รับฟังความเห็น)", final: "ประกาศใหม่", amendment: "ประกาศแก้ไข" }[next.stage];
      addAlert("new", `พบ${stageTh}: ${next.title}`, `เผยแพร่ ${next.publishedAt} · มีผล ${next.effectiveDate} · Agent เริ่มวิเคราะห์อัตโนมัติ`, next.regId);
      await sleep(5000 + Math.random() * 3000);
      return out({ found: 1, ...analyzeSync({ ...next, regText: next.text, source: "watcher" }) });
    }
    case "GET /documents":
      return out({ documents: s.docs.map(({ dataBase64, text, ...d }) => d).sort((a, b) => String(b.lastModified).localeCompare(String(a.lastModified))) });
    case "POST /documents": {
      if (!body.fileName || !body.dataBase64) bad("ต้องมี fileName และ dataBase64");
      const ext = body.fileName.split(".").pop().toLowerCase();
      if (!["pdf", "txt", "md", "html", "htm", "csv", "doc", "docx", "xls", "xlsx"].includes(ext)) bad("รองรับเฉพาะ pdf, docx, txt, md, html, csv, xlsx");
      const size = Math.floor(body.dataBase64.length * 3 / 4);
      if (size > 4 * 1024 * 1024) bad("ไฟล์ใหญ่เกิน 4 MB");
      let text = null;
      if (["txt", "md", "csv"].includes(ext)) { try { text = decodeURIComponent(escape(atob(body.dataBase64))); } catch {} }
      const key = `docs/${body.kind === "policy" ? "policy" : "regulation"}/${Date.now()}-${body.fileName}`;
      s.docs.push({ key, name: body.fileName, kind: body.kind === "policy" ? "policy" : "regulation", size, lastModified: now(), contentType: body.contentType || "application/octet-stream", dataBase64: body.dataBase64, text });
      return out({ key, size });
    }
    case "GET /documents/file": {
      const d = s.docs.find(x => x.key === q.key);
      if (!d) bad("ไม่พบเอกสาร");
      if (!d.dataBase64) bad("ไฟล์นี้ใหญ่เกินกว่าจะเก็บข้ามการรีเฟรชในโหมดจำลอง กรุณาอัปโหลดใหม่");
      return out({ key: d.key, name: d.name, contentType: d.contentType, dataBase64: d.dataBase64 });
    }
    default: bad(`ไม่มีเส้นทาง ${method} ${p}`);
  }
}

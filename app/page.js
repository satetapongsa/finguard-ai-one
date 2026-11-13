"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { mockApi, resetDemo } from "./mock";

const STATUS_TH = { covered: "ครอบคลุมแล้ว", partial: "ครอบคลุมบางส่วน", missing: "ยังไม่มีใน policy", conflict: "ขัดกับ policy" };
const TASK_TH = { pending_review: "รอคนอนุมัติ", open: "เปิดงานแล้ว", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ" };
const TOOL_TH = { search_internal_policy: "ค้น policy ภายใน", save_obligation: "ดึงภาระหน้าที่", save_gap: "ตัดสินผลเทียบ", create_task: "สร้างงาน" };
const SOURCE_TH = { manual: "กรอกเอง", watcher: "Watcher อัตโนมัติ", upload: "จากเอกสาร" };
const STAGE_TH = { draft: "ร่าง · รับฟังความเห็น", final: "ประกาศใหม่", amendment: "ประกาศแก้ไข" };
const ALERT_ICON = { new: "megaphone", risk: "alert", done: "check", error: "xcircle" };

// ข้อความประกาศด้านล่างเป็นตัวอย่างจำลองเพื่อ demo ไม่ใช่ประกาศ ธปท. ฉบับจริง
const TOPICS = [
  { id: "AML", tag: "AML / CFT", title: "รายงานธุรกรรมที่มีเหตุอันควรสงสัย", effectiveDate: "2027-01-01",
    text: "ข้อ 1 ให้สถาบันการเงินรายงานธุรกรรมที่มีเหตุอันควรสงสัยต่อธนาคารแห่งประเทศไทยภายใน 3 วันทำการนับแต่วันที่ตรวจพบ ข้อ 2 ให้สถาบันการเงินเก็บรักษาข้อมูลการทำธุรกรรมไว้ไม่น้อยกว่า 10 ปี ข้อ 3 ให้สถาบันการเงินแต่งตั้งเจ้าหน้าที่กำกับดูแลด้านการปฏิบัติตามกฎเกณฑ์ภายใน 90 วันนับแต่วันที่ประกาศมีผลบังคับใช้" },
  { id: "EKYC", tag: "e-KYC", title: "การยืนยันตัวตนลูกค้าผ่านช่องทางดิจิทัล", effectiveDate: "2027-03-01",
    text: "ข้อ 1 การเปิดบัญชีผ่านช่องทางดิจิทัลต้องยืนยันตัวตนด้วยการเปรียบเทียบภาพใบหน้า (biometric comparison) กับข้อมูลบัตรประจำตัวประชาชน ข้อ 2 สถาบันการเงินต้องตรวจสอบสถานะบัตรประจำตัวประชาชนกับฐานข้อมูลของกรมการปกครองทุกครั้งที่เปิดบัญชี ข้อ 3 ห้ามเปิดบัญชีให้บุคคลที่มีชื่ออยู่ในรายชื่อบัญชีม้าที่หน่วยงานรัฐแจ้ง" },
  { id: "MULE", tag: "Fraud", title: "มาตรการป้องกันบัญชีม้าและการโอนผิดปกติ", effectiveDate: "2026-12-15",
    text: "ข้อ 1 สถาบันการเงินต้องจำกัดวงเงินโอนผ่าน Mobile Banking ไม่เกิน 50,000 บาทต่อวันสำหรับลูกค้าที่ไม่ได้ยืนยันตัวตนด้วยใบหน้า ข้อ 2 การโอนตั้งแต่ 50,000 บาทต่อครั้งขึ้นไปต้องยืนยันตัวตนด้วยใบหน้าทุกครั้ง ข้อ 3 สถาบันการเงินต้องระงับธุรกรรมที่สงสัยว่าเป็นบัญชีม้าได้ทันทีและแจ้งเจ้าของบัญชีภายใน 24 ชั่วโมง" },
  { id: "CDD", tag: "Risk", title: "การทบทวนความเสี่ยงลูกค้า", effectiveDate: "2027-02-01",
    text: "ข้อ 1 ให้สถาบันการเงินทบทวนระดับความเสี่ยงของลูกค้าที่มีความเสี่ยงสูงอย่างน้อยทุก 6 เดือน ข้อ 2 ให้ทบทวนลูกค้าความเสี่ยงปานกลางอย่างน้อยทุก 2 ปี ข้อ 3 ผลการทบทวนต้องเสนอผู้บริหารระดับสูงพิจารณาอย่างน้อยปีละ 1 ครั้ง" },
  { id: "ITRM", tag: "IT Risk", title: "การใช้บริการ Cloud และความเสี่ยงด้าน IT", effectiveDate: "2027-06-01",
    text: "ข้อ 1 สถาบันการเงินต้องประเมินความเสี่ยงก่อนใช้บริการ Cloud สำหรับงานที่มีนัยสำคัญ และแจ้งธนาคารแห่งประเทศไทยล่วงหน้าไม่น้อยกว่า 30 วัน ข้อ 2 ต้องทดสอบแผนรองรับการดำเนินธุรกิจอย่างต่อเนื่องด้าน IT อย่างน้อยปีละ 1 ครั้ง ข้อ 3 ต้องรายงานเหตุการณ์ภัยไซเบอร์ที่มีผลกระทบร้ายแรงต่อธนาคารแห่งประเทศไทยภายใน 24 ชั่วโมง" },
  { id: "CASH", tag: "Reporting", title: "การรายงานธุรกรรมเงินสด", effectiveDate: "2026-12-01",
    text: "ข้อ 1 สถาบันการเงินต้องรายงานธุรกรรมเงินสดที่มีมูลค่าตั้งแต่ 500,000 บาทขึ้นไปต่อธนาคารแห่งประเทศไทยภายใน 7 วันทำการ ข้อ 2 สถาบันการเงินต้องทบทวนนโยบายการบริหารความเสี่ยงด้านเทคโนโลยีสารสนเทศอย่างน้อยปีละ 1 ครั้ง และเสนอคณะกรรมการอนุมัติ" }
];

const RUN_STEPS = ["อ่านประกาศและแยกเป็นข้อ", "ดึงภาระหน้าที่ (ใคร ทำอะไร เมื่อไหร่)", "ค้น policy ภายในของ Bank A", "ตัดสินว่าครอบคลุม / ขาด / ขัดแย้ง", "สร้างงานและส่งข้อที่ไม่มั่นใจให้คนอนุมัติ"];
const NAV = [["dash", "ภาพรวม", "dashboard"], ["analyze", "วิเคราะห์ประกาศ", "scan"], ["history", "ประวัติ", "history"], ["docs", "คลังเอกสาร", "folder"], ["policies", "Policy ธนาคาร", "shield"]];


/* ================= ไอคอน (SVG เส้น) ================= */
const ICONS = {
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  megaphone: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8.5a4 4 0 0 1 0 7M18 6a7.5 7.5 0 0 1 0 12",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  check: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3",
  xcircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6",
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2",
  folder: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z",
  shield: "M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  clipboard: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  radar: "M12 12 19 5M19.1 4.9A10 10 0 1 0 22 12M16.2 7.8A6 6 0 1 0 18 12M12 12h.01",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  back: "M19 12H5M12 19l-7-7 7-7",
  thumbsup: "M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8a2 2 0 0 1-2 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9z",
  thumbsdown: "M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-8A2 2 0 0 1 6.6 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9z",
  sparkle: "M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2zM19 3v4M21 5h-4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  play: "M5 3l14 9-14 9z",
  layers: "M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
};
function Icon({ name, size = 18, className = "", stroke = 1.8 }) {
  return (
    <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ""} />
    </svg>
  );
}

async function call(path, options = {}) {
  return mockApi(path, options);
}
const get = (p) => call(p, { method: "GET" });
const post = (p, body) => call(p, { method: "POST", body: JSON.stringify(body || {}) });

const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
const pct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;
const fmtDate = (s) => { if (!s) return "-"; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }); };
const fmtTime = (s) => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
const daysUntil = (s) => Math.ceil((new Date(s) - new Date()) / 86400000);
const fmtSize = (n) => n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
const clauseLabel = (ob, i) => /^ข้อ\s*\d+/.test(ob.sourceClause || "") ? ob.sourceClause : `ข้อที่ ${i + 1}`;
const fileToBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = () => rej(new Error("อ่านไฟล์ไม่สำเร็จ")); r.readAsDataURL(file); });

export default function Home() {
  const [tab, setTab] = useState("dash");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [ov, setOv] = useState(null);
  const [feed, setFeed] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [docs, setDocs] = useState([]);
  const [detail, setDetail] = useState(null);
  const [running, setRunning] = useState(false);
  const [watching, setWatching] = useState(false);
  const [busyTask, setBusyTask] = useState("");
  const [ai, setAi] = useState(null);
  const lastUnread = useRef(0);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 4000); };
  const safe = (fn) => async (...a) => { setError(""); try { return await fn(...a); } catch (e) { setError(e.message); } };

  const loadAlerts = useCallback(async () => {
    const r = await get("/alerts");
    setAlerts(r.alerts || []); setUnread(r.unread || 0);
    return r.unread || 0;
  }, []);
  const loadOverview = useCallback(async () => { setOv(await get("/overview")); }, []);
  const loadFeed = useCallback(async () => { setFeed((await get("/watch/feed")).feed || []); }, []);
  const loadDocs = useCallback(async () => { setDocs((await get("/documents")).documents || []); }, []);

  useEffect(() => {
    safe(async () => {
      await Promise.all([loadAlerts(), loadOverview(), loadFeed(), loadDocs(), get("/policies").then(r => setPolicies(r.policies || [])), get("/status").then(setAi)]);
    })();
    const t = setInterval(async () => {
      try { const u = await loadAlerts(); if (u > lastUnread.current) { loadOverview(); loadFeed(); } lastUnread.current = u; } catch {}
    }, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openReg = safe(async (regId, extra) => {
    setBellOpen(false); setTab("detail"); setDetail({ loading: true, regId });
    const r = await get(`/results?regId=${encodeURIComponent(regId)}`);
    setDetail({ ...r, ...(extra || {}) });
  });

  const runAnalyze = safe(async (form) => {
    setRunning(true);
    try {
      const r = await post("/run", form);
      await Promise.all([loadAlerts(), loadOverview()]);
      await openReg(r.regId, { trace: r.trace, summary: r.summary });
    } finally { setRunning(false); }
  });

  const runWatcher = safe(async () => {
    setWatching(true);
    try {
      const r = await post("/watch/run");
      await Promise.all([loadAlerts(), loadOverview(), loadFeed()]);
      if (!r.found) flash(r.message); else flash(`Watcher พบประกาศใหม่และวิเคราะห์เสร็จ: ${r.regId}`);
    } finally { setWatching(false); }
  });

  const review = safe(async (taskId, decision) => {
    setBusyTask(taskId);
    try {
      await post("/review", { taskId, decision, reviewer: "Compliance officer" });
      await loadOverview();
      if (detail?.regId) { const r = await get(`/results?regId=${encodeURIComponent(detail.regId)}`); setDetail(d => ({ ...d, ...r })); }
    } finally { setBusyTask(""); }
  });

  const readAll = safe(async () => { await post("/alerts/read", { all: true }); await loadAlerts(); });
  const clickAlert = safe(async (a) => { if (!a.read) post("/alerts/read", { alertId: a.alertId }).then(loadAlerts).catch(() => {}); if (a.regId) openReg(a.regId); });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo"><Icon name="shield" size={22} stroke={2} /></span>
          <div><h1>FinGuard AI</h1><p>Regulatory Compliance Agent · ประกาศ ธปท. → ภาระหน้าที่ → gap → งาน</p></div>
        </div>
        <div className="top-right">
          <span className="pill">{ai?.ai ? `AI · Groq · ${ai.model}` : "โหมดจำลอง"}</span>
          <button className="pill reset" onClick={() => { if (confirm("ล้างข้อมูลจำลองทั้งหมดแล้วเริ่มใหม่?")) { resetDemo(); location.reload(); } }}>รีเซ็ตข้อมูล</button>
          <div className="bell-wrap">
            <button className="bell" onClick={() => setBellOpen(o => !o)} aria-label="การแจ้งเตือน">
              <Icon name="bell" size={20} />{unread > 0 && <em>{unread}</em>}
            </button>
            {bellOpen && (
              <div className="bell-panel">
                <div className="bell-head"><b>การแจ้งเตือน</b>{unread > 0 && <button className="link" onClick={readAll}>อ่านทั้งหมด</button>}</div>
                {alerts.length === 0 && <p className="muted pad">ยังไม่มีการแจ้งเตือน</p>}
                <ul>
                  {alerts.map(a => (
                    <li key={a.alertId} className={a.read ? "" : "unread"}>
                      <button onClick={() => clickAlert(a)}>
                        <span className={`ai ${a.type}`}><Icon name={ALERT_ICON[a.type] || "bell"} size={16} /></span>
                        <span><b>{a.title}</b><small>{a.message}</small><small className="muted">{fmtTime(a.createdAt)}</small></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {ai && !ai.ai && <div className="demo-banner">ยังไม่ได้ตั้ง GROQ_API_KEY: ระบบใช้การวิเคราะห์แบบกฎแทน AI</div>}

      <nav className="nav">
        {NAV.map(([k, label, icon]) => (
          <button key={k} className={tab === k || (tab === "detail" && k === "history") ? "on" : ""} onClick={() => setTab(k)}><Icon name={icon} size={17} />{label}</button>
        ))}
      </nav>

      {error && <div className="alert">{error} <button className="link" onClick={() => setError("")}>ปิด</button></div>}
      {toast && <div className="toast">{toast}</div>}

      {tab === "dash" && <Dashboard ov={ov} feed={feed} watching={watching} onWatch={runWatcher} onOpen={openReg} onReview={review} busyTask={busyTask} />}
      {tab === "analyze" && <Analyze docs={docs} running={running} onRun={runAnalyze} onUploaded={loadDocs} setError={setError} />}
      {tab === "history" && <History regs={ov?.regulations} onOpen={openReg} onRefresh={safe(loadOverview)} />}
      {tab === "docs" && <Docs docs={docs} onRefresh={safe(loadDocs)} setError={setError} onAnalyze={(d) => { setTab("analyze"); setTimeout(() => window.dispatchEvent(new CustomEvent("fg-doc", { detail: d })), 0); }} />}
      {tab === "policies" && <Policies policies={policies} />}
      {tab === "detail" && <Detail d={detail} onBack={() => setTab("history")} onReview={review} busyTask={busyTask} policies={policies} />}
    </div>
  );
}

/* ================= ภาพรวม ================= */
function Dashboard({ ov, feed, watching, onWatch, onOpen, onReview, busyTask }) {
  if (!ov) return <div className="card empty">กำลังโหลดข้อมูล...</div>;
  const regs = ov.regulations || [];
  const pending = (ov.tasks || []).filter(t => t.status === "pending_review");
  const risky = (ov.gaps || []).filter(g => g.status === "missing" || g.status === "conflict").length;
  const upcoming = regs.filter(r => r.effectiveDate && daysUntil(r.effectiveDate) >= 0).sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const soon = upcoming.filter(r => daysUntil(r.effectiveDate) <= 90).length;
  const byOwner = {}; (ov.tasks || []).filter(t => t.status !== "approved" && t.status !== "rejected").forEach(t => { byOwner[t.owner] = (byOwner[t.owner] || 0) + 1; });
  const ownerRows = Object.entries(byOwner).sort((a, b) => b[1] - a[1]);
  const maxOwner = Math.max(1, ...ownerRows.map(r => r[1]));
  const titleOf = (regId) => regs.find(r => r.regId === regId)?.title || regId;

  return (
    <div className="dash">
      <section className="stats four">
        <div className="stat"><Icon name="file" className="si" /><b>{regs.length}</b><span>ประกาศที่วิเคราะห์แล้ว</span></div>
        <div className="stat focus"><Icon name="clipboard" className="si" /><b>{pending.length}</b><span>งานรอคนอนุมัติ</span></div>
        <div className="stat bad"><Icon name="alert" className="si" /><b>{risky}</b><span>ข้อที่ขาด / ขัดกับ policy</span></div>
        <div className="stat warn"><Icon name="calendar" className="si" /><b>{soon}</b><span>ประกาศมีผลภายใน 90 วัน</span></div>
      </section>

      <div className="dash-grid">
        <section className="card">
          <div className="card-head">
            <div><h2 className="ht"><Icon name="radar" />Watcher ติดตามประกาศ ธปท.</h2><p className="hint">แหล่งประกาศตัวอย่าง · กดตรวจหาเพื่อให้ AI วิเคราะห์ฉบับใหม่</p></div>
            <button className="btn primary sm" onClick={onWatch} disabled={watching}><Icon name={watching ? "refresh" : "search"} size={16} className={watching ? "spin" : ""} />{watching ? "กำลังตรวจและวิเคราะห์..." : "ตรวจหาประกาศใหม่ตอนนี้"}</button>
          </div>
          <ul className="feed">
            {feed.map(f => (
              <li key={f.regId}>
                <span className={`stage ${f.stage}`}>{STAGE_TH[f.stage]}</span>
                <div className="feed-main"><b>{f.title}</b><small className="muted">เผยแพร่ {fmtDate(f.publishedAt)} · มีผล {fmtDate(f.effectiveDate)}</small></div>
                {f.analyzed ? <button className="link" onClick={() => onOpen(f.regId)}>ดูผล</button> : <span className="muted small">ยังไม่วิเคราะห์</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="ht"><Icon name="calendar" />ใกล้มีผลบังคับใช้</h2>
          {upcoming.length === 0 && <p className="muted">ยังไม่มีข้อมูล</p>}
          <ul className="timeline">
            {upcoming.slice(0, 6).map(r => {
              const d = daysUntil(r.effectiveDate);
              return (
                <li key={r.regId}>
                  <span className={`days ${d <= 30 ? "hot" : d <= 90 ? "warm" : ""}`}>{d} วัน</span>
                  <button className="link" onClick={() => onOpen(r.regId)}>{r.title}</button>
                  <small className="muted">{fmtDate(r.effectiveDate)}</small>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="dash-grid">
        <section className="card">
          <h2 className="ht"><Icon name="clipboard" />งานรอคนอนุมัติ ({pending.length})</h2>
          {pending.length === 0 && <p className="muted">ไม่มีงานค้าง</p>}
          <div className="stack">
            {pending.slice(0, 6).map(t => (
              <div key={t.taskId} className="mini-task">
                <div><b>{t.action}</b><small className="muted">{t.owner} · กำหนด {t.dueDate || "-"} · <button className="link" onClick={() => onOpen(t.regId)}>{titleOf(t.regId)}</button></small></div>
                <div className="task-actions">
                  <button className="btn approve sm" disabled={busyTask === t.taskId} onClick={() => onReview(t.taskId, "approved")}>อนุมัติ</button>
                  <button className="btn reject sm" disabled={busyTask === t.taskId} onClick={() => onReview(t.taskId, "rejected")}>ไม่อนุมัติ</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="ht"><Icon name="users" />งานค้างแยกตามหน่วยงาน</h2>
          {ownerRows.length === 0 && <p className="muted">ไม่มีงานค้าง</p>}
          <ul className="bars">
            {ownerRows.map(([o, n]) => (
              <li key={o}><span>{o}</span><div className="bar"><i style={{ width: `${(n / maxOwner) * 100}%` }} /></div><b>{n}</b></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ================= วิเคราะห์ประกาศ ================= */
function Analyze({ docs, running, onRun, onUploaded, setError }) {
  const [topicId, setTopicId] = useState("");
  const [form, setForm] = useState({ regId: "", title: "", effectiveDate: "", regText: "", docKey: "" });
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const regDocs = docs.filter(d => d.kind === "regulation");

  useEffect(() => {
    const h = (e) => { const d = e.detail; setTopicId("doc"); setForm({ regId: `BOT-DOC-${stamp()}`, title: d.name, effectiveDate: "", regText: "", docKey: d.key }); };
    window.addEventListener("fg-doc", h); return () => window.removeEventListener("fg-doc", h);
  }, []);
  useEffect(() => {
    if (!running) return; setStep(0);
    const t = setInterval(() => setStep(s => Math.min(s + 1, RUN_STEPS.length - 1)), 800);
    return () => clearInterval(t);
  }, [running]);

  const pick = (t) => { setTopicId(t.id); setForm({ regId: `BOT-${t.id}-${stamp()}`, title: t.title, effectiveDate: t.effectiveDate, regText: t.text, docKey: "" }); };
  const pickCustom = () => { setTopicId("custom"); setForm({ regId: `BOT-CUSTOM-${stamp()}`, title: "", effectiveDate: "", regText: "", docKey: "" }); };
  const pickDoc = () => { setTopicId("doc"); setForm({ regId: `BOT-DOC-${stamp()}`, title: "", effectiveDate: "", regText: "", docKey: regDocs[0]?.key || "" }); };
  const up = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function quickUpload(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) return setError("ไฟล์ใหญ่เกิน 4 MB");
    setUploading(true);
    try {
      const r = await post("/documents", { fileName: f.name, contentType: f.type, kind: "regulation", dataBase64: await fileToBase64(f) });
      await onUploaded();
      setForm(fm => ({ ...fm, docKey: r.key, title: fm.title || f.name.replace(/\.[^.]+$/, "") }));
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }

  const submit = (e) => { e.preventDefault(); if (!form.regText.trim() && !form.docKey) return setError("ใส่เนื้อหาประกาศหรือเลือกเอกสารก่อน"); onRun(form); };

  return (
    <div className="grid">
      <aside className="col">
        <section className="card">
          <h2>1. เลือกหัวข้อประกาศ ธปท.</h2>
          <p className="hint">ข้อความในหัวข้อเป็นตัวอย่างจำลองเพื่อ demo</p>
          <div className="topics">
            {TOPICS.map(t => (
              <button key={t.id} type="button" className={`topic ${topicId === t.id ? "on" : ""}`} onClick={() => pick(t)} disabled={running}>
                <span className="tag">{t.tag}</span><span className="topic-title">{t.title}</span>
              </button>
            ))}
            <button type="button" className={`topic ${topicId === "doc" ? "on" : ""}`} onClick={pickDoc} disabled={running}>
              <span className="tag">PDF / ไฟล์</span><span className="topic-title">วิเคราะห์จากเอกสาร</span>
            </button>
            <button type="button" className={`topic ${topicId === "custom" ? "on" : ""}`} onClick={pickCustom} disabled={running}>
              <span className="tag">กรอกเอง</span><span className="topic-title">วางข้อความประกาศ</span>
            </button>
          </div>
        </section>
      </aside>

      <main className="col">
        {!topicId && !running && (
          <div className="card empty">
            <h2>เลือกหัวข้อทางซ้ายเพื่อเริ่ม</h2>
            <p>Agent จะดึงภาระหน้าที่จากประกาศ ค้น policy ของธนาคารเอง ตัดสินว่ามีช่องว่างตรงไหน แล้วสร้างงานให้หน่วยงานที่รับผิดชอบ ข้อที่ไม่มั่นใจจะส่งให้คนอนุมัติก่อน</p>
            <ol className="flow">{RUN_STEPS.map(s => <li key={s}>{s}</li>)}</ol>
          </div>
        )}

        {topicId && !running && (
          <form className="card" onSubmit={submit}>
            <h2>2. ตรวจรายละเอียดแล้วสั่ง Agent</h2>
            <label className="field"><span>ชื่อประกาศ</span><input value={form.title} onChange={up("title")} placeholder="เช่น ประกาศเรื่องการรายงานธุรกรรม" required /></label>
            <div className="row2">
              <label className="field"><span>รหัสประกาศ</span><input value={form.regId} onChange={up("regId")} required /></label>
              <label className="field"><span>วันมีผลบังคับใช้</span><input type="date" value={form.effectiveDate} onChange={up("effectiveDate")} required /></label>
            </div>
            {topicId === "doc" ? (
              <div className="field">
                <span>เอกสารประกาศ (PDF, DOCX, TXT ไม่เกิน 4 MB)</span>
                <select value={form.docKey} onChange={up("docKey")}>
                  <option value="">— เลือกจากคลังเอกสาร —</option>
                  {regDocs.map(d => <option key={d.key} value={d.key}>{d.name} ({fmtSize(d.size)})</option>)}
                </select>
                <label className="upload">{uploading ? "กำลังอัปโหลด..." : "หรืออัปโหลดไฟล์ใหม่"}<input type="file" accept=".pdf,.docx,.doc,.txt,.md,.html" onChange={quickUpload} disabled={uploading} hidden /></label>
              </div>
            ) : (
              <label className="field"><span>เนื้อหาประกาศ</span><textarea value={form.regText} onChange={up("regText")} placeholder="วางข้อความประกาศทั้งฉบับ" /></label>
            )}
            <button className="btn primary" disabled={uploading}><Icon name="sparkle" size={17} />ให้ Agent วิเคราะห์ประกาศนี้</button>
          </form>
        )}

        {running && (
          <div className="card">
            <h2>Agent กำลังทำงาน</h2>
            <p className="hint">ใช้เวลาไม่กี่วินาที ผลจะเปิดให้อัตโนมัติ</p>
            <ol className="steps">{RUN_STEPS.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>{s}</li>)}</ol>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= ผลวิเคราะห์ ================= */
function Detail({ d, onBack, onReview, busyTask, policies }) {
  const [tab, setTab] = useState("gaps");
  useEffect(() => { setTab("gaps"); }, [d?.regId]);
  const view = useMemo(() => {
    const gapsByOb = {}; (d?.gaps || []).forEach(g => { gapsByOb[g.obligationId] = g; });
    const counts = {}; (d?.gaps || []).forEach(g => { counts[g.status] = (counts[g.status] || 0) + 1; });
    const obligations = [...(d?.obligations || [])].sort((a, b) => String(a.obligationId).localeCompare(String(b.obligationId), undefined, { numeric: true }));
    const tasks = [...(d?.tasks || [])].sort((a, b) => (a.status === "pending_review" ? 0 : 1) - (b.status === "pending_review" ? 0 : 1));
    return { gapsByOb, counts, obligations, tasks, pending: tasks.filter(t => t.status === "pending_review").length };
  }, [d]);
  if (!d) return null;
  if (d.loading) return <div className="card empty">กำลังโหลดผลของ {d.regId}...</div>;
  const reg = d.regulation || {};
  const trace = d.trace || reg.trace || [];
  const summary = d.summary || reg.summary;
  const pName = (id) => policies.find(p => p.policyId === id)?.title;

  return (
    <div className="stack">
      <div className="detail-head">
        <button className="link back" onClick={onBack}><Icon name="back" size={16} />กลับไปประวัติ</button>
        <h2>{reg.title || d.regId}</h2>
        <p className="muted">{d.regId} · มีผล {fmtDate(reg.effectiveDate)} · {SOURCE_TH[reg.source] || "-"}{reg.stage && reg.stage !== "final" ? ` · ${STAGE_TH[reg.stage]}` : ""}{reg.docKey ? " · มีเอกสารแนบ" : ""}</p>
      </div>

      <section className="stats">
        <div className="stat"><b>{view.obligations.length}</b><span>ภาระหน้าที่</span></div>
        <div className="stat bad"><b>{(view.counts.missing || 0) + (view.counts.conflict || 0)}</b><span>ขาด / ขัดแย้ง</span></div>
        <div className="stat warn"><b>{view.counts.partial || 0}</b><span>ครอบคลุมบางส่วน</span></div>
        <div className="stat ok"><b>{view.counts.covered || 0}</b><span>ครอบคลุมแล้ว</span></div>
        <div className="stat focus"><b>{view.pending}</b><span>งานรออนุมัติ</span></div>
      </section>

      {summary && <div className="card summary"><h3 className="ht"><Icon name="sparkle" size={16} />สรุปจาก Agent</h3><p>{summary}</p></div>}

      <div className="tabs">
        <button className={tab === "gaps" ? "on" : ""} onClick={() => setTab("gaps")}>ผลเทียบกับ policy</button>
        <button className={tab === "tasks" ? "on" : ""} onClick={() => setTab("tasks")}>งานที่ต้องทำ {view.pending > 0 && <em>{view.pending}</em>}</button>
        {trace.length > 0 && <button className={tab === "trace" ? "on" : ""} onClick={() => setTab("trace")}>Agent ตัดสินใจอย่างไร ({trace.length})</button>}
      </div>

      {tab === "gaps" && (
        <div className="stack">
          {view.obligations.length === 0 && <div className="card empty">ยังไม่มีภาระหน้าที่ที่บันทึกไว้{reg.status === "running" ? " (Agent ยังทำงานอยู่ ลองรีเฟรชอีกครั้ง)" : ""}</div>}
          {view.obligations.map((ob, i) => {
            const gap = view.gapsByOb[ob.obligationId]; const st = gap?.status || "none";
            return (
              <article key={ob.obligationId} className={`card ob ${st}`}>
                <div className="ob-head">
                  <span className="clause">{clauseLabel(ob, i)}</span>
                  {gap && <span className={`status ${st}`}>{STATUS_TH[st] || st} · มั่นใจ {pct(gap.confidence)}</span>}
                </div>
                <div className="pair">
                  <div>
                    <h4>ประกาศกำหนด</h4>
                    <p><b>{ob.who}</b> ต้อง{ob.what}</p>
                    <dl>
                      {ob.deadline && !["-", "ไม่ระบุ"].includes(ob.deadline) && <><dt>ระยะเวลา</dt><dd>{ob.deadline}</dd></>}
                      {ob.threshold && ob.threshold !== "-" && <><dt>เกณฑ์</dt><dd>{ob.threshold}</dd></>}
                    </dl>
                  </div>
                  <div>
                    <h4>Policy ภายใน</h4>
                    {gap?.policyId && gap.policyId !== "-" ? <p><b>{gap.policyId}</b> {pName(gap.policyId) || ""}</p> : <p className="muted">ไม่พบข้อที่ตรงกัน</p>}
                  </div>
                </div>
                {gap?.reason && <p className="reason">{gap.reason}</p>}
              </article>
            );
          })}
        </div>
      )}

      {tab === "tasks" && (
        <div className="stack">
          {view.tasks.length === 0 && <div className="card empty">ไม่มีงานที่ต้องทำ</div>}
          {view.tasks.map(t => (
            <div key={t.taskId} className={`card task ${t.status}`}>
              <div className="task-main">
                <span className={`badge ${t.status}`}>{TASK_TH[t.status] || t.status}</span>
                <h4>{t.action}</h4>
                <p className="muted">ผู้รับผิดชอบ <b>{t.owner}</b>{t.dueDate ? ` · กำหนดเสร็จ ${fmtDate(t.dueDate)}` : ""}{t.reviewedBy ? ` · ตรวจโดย ${t.reviewedBy} ${fmtTime(t.reviewedAt)}` : ""}</p>
              </div>
              {t.status === "pending_review" && (
                <div className="task-actions">
                  <button className="btn approve" disabled={busyTask === t.taskId} onClick={() => onReview(t.taskId, "approved")}>อนุมัติ</button>
                  <button className="btn reject" disabled={busyTask === t.taskId} onClick={() => onReview(t.taskId, "rejected")}>ไม่อนุมัติ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "trace" && (
        <div className="card">
          <p className="hint">ขั้นตอนที่ Agent ทำกับประกาศฉบับนี้</p>
          <ol className="trace">
            {trace.map((s, i) => (
              <li key={i}>
                <span className="turn">รอบ {s.turn}</span>
                <div>
                  <b>{TOOL_TH[s.tool] || s.tool}</b>
                  <p>{s.input?.query || s.input?.what || s.input?.reason || s.input?.action || ""}</p>
                  {s.tool === "search_internal_policy" && s.result?.top && <span className="muted small">ผู้สมัคร: {s.result.top.join(", ")}</span>}
                  {s.tool === "save_gap" && <span className={`status ${s.input?.status}`}>{STATUS_TH[s.input?.status] || s.input?.status} · {pct(s.input?.confidence)}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ================= ประวัติ ================= */
function History({ regs, onOpen, onRefresh }) {
  const [q, setQ] = useState("");
  const list = (regs || []).filter(r => !q || `${r.title} ${r.regId}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="card">
      <div className="card-head">
        <div><h2 className="ht"><Icon name="history" />ประวัติการวิเคราะห์</h2><p className="hint">เก็บในเบราว์เซอร์นี้เท่านั้น</p></div>
        <div className="row-inline"><input className="search" placeholder="ค้นหาชื่อหรือรหัส" value={q} onChange={e => setQ(e.target.value)} /><button className="btn ghost sm" onClick={onRefresh}><Icon name="refresh" size={15} />รีเฟรช</button></div>
      </div>
      {!regs && <p className="muted">กำลังโหลด...</p>}
      {regs && list.length === 0 && <p className="muted">ยังไม่มีประวัติ</p>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>ประกาศ</th><th>ที่มา</th><th>มีผล</th><th>ขาด/ขัดแย้ง</th><th>บางส่วน</th><th>รออนุมัติ</th><th>วิเคราะห์เมื่อ</th></tr></thead>
          <tbody>
            {list.map(r => {
              const c = r.counts || {};
              return (
                <tr key={r.regId} onClick={() => onOpen(r.regId)}>
                  <td><b>{r.title}</b><small className="muted">{r.regId}{r.status === "running" ? " · กำลังวิเคราะห์" : ""}</small></td>
                  <td><span className={`src ${r.source}`}>{SOURCE_TH[r.source] || r.source}</span></td>
                  <td>{fmtDate(r.effectiveDate)}</td>
                  <td className="num bad-t">{(c.missing || 0) + (c.conflict || 0)}</td>
                  <td className="num warn-t">{c.partial || 0}</td>
                  <td className="num focus-t">{c.pending || 0}</td>
                  <td className="muted">{fmtTime(r.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ================= คลังเอกสาร ================= */
function Docs({ docs, onRefresh, setError, onAnalyze }) {
  const [kind, setKind] = useState("regulation");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingKey, setLoadingKey] = useState("");

  async function upload(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) return setError("ไฟล์ใหญ่เกิน 4 MB");
    setUploading(true);
    try { await post("/documents", { fileName: f.name, contentType: f.type, kind, dataBase64: await fileToBase64(f) }); await onRefresh(); }
    catch (err) { setError(err.message); } finally { setUploading(false); }
  }
  async function open(d) {
    setLoadingKey(d.key);
    try {
      const r = await get(`/documents/file?key=${encodeURIComponent(d.key)}`);
      const bytes = Uint8Array.from(atob(r.dataBase64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: r.contentType || "application/octet-stream" }));
      if (preview?.url) URL.revokeObjectURL(preview.url);
      setPreview({ url, name: r.name, type: r.contentType || "" });
    } catch (err) { setError(err.message); } finally { setLoadingKey(""); }
  }
  const canInline = (t) => /pdf|text|html|image/.test(t);

  return (
    <div className="grid">
      <aside className="col">
        <section className="card">
          <h2 className="ht"><Icon name="upload" />อัปโหลดเอกสาร</h2>
          <p className="hint">เก็บในเบราว์เซอร์ · PDF, DOCX, TXT ไม่เกิน 4 MB</p>
          <div className="seg">
            <button className={kind === "regulation" ? "on" : ""} onClick={() => setKind("regulation")}>ประกาศ ธปท.</button>
            <button className={kind === "policy" ? "on" : ""} onClick={() => setKind("policy")}>Policy ธนาคาร</button>
          </div>
          <label className="upload big"><Icon name="upload" size={24} /><span>{uploading ? "กำลังอัปโหลด..." : "เลือกไฟล์เพื่ออัปโหลด"}</span><input type="file" accept=".pdf,.docx,.doc,.txt,.md,.html,.csv,.xlsx" onChange={upload} disabled={uploading} hidden /></label>
        </section>
        <section className="card">
          <div className="card-head"><h2>เอกสารทั้งหมด ({docs.length})</h2><button className="btn ghost sm" onClick={onRefresh}><Icon name="refresh" size={15} />รีเฟรช</button></div>
          {docs.length === 0 && <p className="muted">ยังไม่มีเอกสาร</p>}
          <ul className="doclist">
            {docs.map(d => (
              <li key={d.key}>
                <span className="dtype"><Icon name="file" size={18} /><small>{d.name.split(".").pop().toUpperCase()}</small></span>
                <div><b>{d.name}</b><small className="muted">{d.kind === "policy" ? "Policy ธนาคาร" : "ประกาศ ธปท."} · {fmtSize(d.size)} · {fmtTime(d.lastModified)}</small></div>
                <div className="doc-actions">
                  <button className="link" onClick={() => open(d)} disabled={loadingKey === d.key}><Icon name="eye" size={15} />{loadingKey === d.key ? "กำลังเปิด" : "เปิดดู"}</button>
                  {d.kind === "regulation" && <button className="link" onClick={() => onAnalyze(d)}><Icon name="sparkle" size={15} />วิเคราะห์</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </aside>
      <main className="col">
        <section className="card viewer">
          {!preview && <div className="viewer-empty"><Icon name="file" size={40} stroke={1.4} /><p className="muted">กด “เปิดดู” ที่เอกสารเพื่อแสดงตรงนี้</p></div>}
          {preview && (
            <>
              <div className="card-head"><h2>{preview.name}</h2><a className="btn ghost sm" href={preview.url} download={preview.name}><Icon name="download" size={15} />ดาวน์โหลด</a></div>
              {canInline(preview.type) ? <iframe src={preview.url} title={preview.name} /> : <p className="muted">ไฟล์ชนิดนี้แสดงในเบราว์เซอร์ไม่ได้ กดดาวน์โหลดเพื่อเปิด</p>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* ================= Policy ================= */
function Policies({ policies }) {
  return (
    <section className="card">
      <h2 className="ht"><Icon name="shield" />Policy ภายในของ Bank A ({policies.length} ข้อ)</h2>
      <p className="hint">Policy ของธนาคารตัวอย่าง · Agent เทียบประกาศกับชุดนี้</p>
      <div className="table-wrap">
        <table className="table static">
          <thead><tr><th>รหัส</th><th>หัวข้อ</th><th>ข้อกำหนด</th><th>หน่วยงาน</th></tr></thead>
          <tbody>{policies.map(p => <tr key={p.policyId}><td><b>{p.policyId}</b></td><td>{p.title}</td><td>{p.text}</td><td className="muted">{p.owner}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

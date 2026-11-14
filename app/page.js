"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { storeApi, resetDemo } from "./store";
import { useLang } from "./i18n";
import { ownerName, policyText } from "../lib/policies";
import { BANKS, getBank } from "../lib/banks";
import { USERS } from "../lib/staff";

const ALERT_ICON = { new: "megaphone", risk: "alert", done: "check", error: "xcircle" };
const NAV = [["dash", "dashboard"], ["analyze", "scan"], ["history", "history"], ["docs", "folder"], ["policies", "shield"]];
const bankName = (b, lang) => (lang === "en" ? b.nameEn : b.name);
const ALL_POLICIES = BANKS.flatMap(b => b.policies);
const TOPIC_EN = { AML: "Suspicious transaction reporting", EKYC: "Digital customer identity verification", MULE: "Mule accounts and unusual transfers", CDD: "Customer risk review", ITRM: "Cloud services and IT risk", CASH: "Cash transaction reporting" };

// ข้อความประกาศด้านล่างเป็นตัวอย่างเพื่อ demo ไม่ใช่ประกาศ ธปท. ฉบับจริง
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
  return storeApi(path, options);
}
const get = (p) => call(p, { method: "GET" });
const post = (p, body) => call(p, { method: "POST", body: JSON.stringify(body || {}) });

const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
const pct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;
const localDate = () => new Date().toLocaleDateString("sv"); // YYYY-MM-DD ตามเวลาเครื่อง
const daysUntil = (s) => Math.ceil((new Date(s) - new Date()) / 86400000);
const fmtSize = (n) => n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
const fileToBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = () => rej(new Error("อ่านไฟล์ไม่สำเร็จ")); r.readAsDataURL(file); });

const titleOf = (r, lang) => (lang === "en" && r?.titleEn) || r?.title;

export default function Home() {
  const { t, lang, setLang, time } = useLang();
  const [tab, setTab] = useState("dash");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [ov, setOv] = useState(null);
  const [feed, setFeed] = useState([]);
  const [docs, setDocs] = useState([]);
  const [detail, setDetail] = useState(null);
  const [running, setRunning] = useState(false);
  const [watching, setWatching] = useState(false);
  const [busyTask, setBusyTask] = useState("");
  const [ai, setAi] = useState(null);
  const [bankId, setBankId] = useState("demo");
  const [me, setMe] = useState(undefined);
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
      await Promise.all([loadAlerts(), loadOverview(), loadFeed(), loadDocs(), get("/status").then(setAi)]);
    })();
    const timer = setInterval(async () => {
      try { const u = await loadAlerts(); if (u > lastUnread.current) { loadOverview(); loadFeed(); } lastUnread.current = u; } catch {}
    }, 20000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { const b = localStorage.getItem("fg-bank"); if (b) setBankId(getBank(b).id); }, []);
  useEffect(() => { fetch("/api/auth").then(r => (r.ok ? r.json() : null)).then(setMe).catch(() => setMe(null)); }, []);
  const logout = async () => { await fetch("/api/auth", { method: "DELETE" }); setMe(null); };
  const [pwOpen, setPwOpen] = useState(false);
  const chooseBank = (id) => { setBankId(id); localStorage.setItem("fg-bank", id); setTab("dash"); };
  const bank = getBank(bankId);

  const openReg = safe(async (regId, extra) => {
    setBellOpen(false); setTab("detail"); setDetail({ loading: true, regId });
    const r = await get(`/results?regId=${encodeURIComponent(regId)}`);
    setDetail({ ...r, ...(extra || {}) });
  });

  const runAnalyze = safe(async (form) => {
    setRunning(true);
    try {
      const r = await post("/run", { ...form, lang, bankId });
      await Promise.all([loadAlerts(), loadOverview()]);
      await openReg(r.regId, { trace: r.trace, summary: r.summary });
    } finally { setRunning(false); }
  });

  const runWatcher = safe(async () => {
    setWatching(true);
    try {
      const r = await post("/watch/run", { lang });
      await Promise.all([loadAlerts(), loadOverview(), loadFeed()]);
      flash(r.found ? t.dash.watchFound(r.regId) : t.dash.watchNone);
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

  if (me === undefined) return <div className="app"><div className="card empty">{t.loading}</div></div>;
  if (!me) return <Login onDone={setMe} />;

  return (
    <div className="app">
      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} onDone={() => { setPwOpen(false); flash(t.auth.changed); }} />}
      <header className="topbar">
        <div className="brand">
          <span className="logo"><Icon name="shield" size={22} stroke={2} /></span>
          <div><h1>FinGuard AI</h1><p>{t.tagline}</p></div>
        </div>
        <div className="top-right">
          <span className="pill">{ai?.ai ? `AI · Groq · ${ai.model}` : t.rulesMode}</span>
          <button className="pill reset" onClick={() => { if (confirm(t.resetConfirm)) { resetDemo(); location.reload(); } }}>{t.reset}</button>
          <select className="pill bank-select" value={bankId} onChange={e => chooseBank(e.target.value)} aria-label={t.bank}>
            {BANKS.map(b => <option key={b.id} value={b.id}>{bankName(b, lang)}</option>)}
          </select>
          <div className="lang" role="group" aria-label="Language">
            {["th", "en"].map(l => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
          </div>
          <button className="pill reset" onClick={() => setPwOpen(true)}>{t.auth.change}</button>
          <button className="pill reset" onClick={logout} title={t.auth.logout}>{lang === "en" ? me.nameEn : me.name} · {t.auth.role[me.role]} · {t.auth.logout}</button>
          <div className="bell-wrap">
            <button className="bell" onClick={() => setBellOpen(o => !o)} aria-label={t.alerts}>
              <Icon name="bell" size={20} />{unread > 0 && <em>{unread}</em>}
            </button>
            {bellOpen && (
              <div className="bell-panel">
                <div className="bell-head"><b>{t.alerts}</b>{unread > 0 && <button className="link" onClick={readAll}>{t.readAll}</button>}</div>
                {alerts.length === 0 && <p className="muted pad">{t.noAlerts}</p>}
                <ul>
                  {alerts.map(a => (
                    <li key={a.alertId} className={a.read ? "" : "unread"}>
                      <button onClick={() => clickAlert(a)}>
                        <span className={`ai ${a.type}`}><Icon name={ALERT_ICON[a.type] || "bell"} size={16} /></span>
                        <AlertText a={a} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {ai && !ai.ai && <div className="demo-banner">{t.noKey}</div>}

      <nav className="nav">
        {NAV.map(([k, icon]) => (
          <button key={k} className={tab === k || (tab === "detail" && k === "history") ? "on" : ""} onClick={() => setTab(k)}><Icon name={icon} size={17} />{k === "dash" && bank.real ? t.brief.nav : t.nav[k]}</button>
        ))}
      </nav>

      {error && <div className="alert">{error} <button className="link" onClick={() => setError("")}>{t.close}</button></div>}
      {toast && <div className="toast">{toast}</div>}

      {tab === "dash" && bank.real && <Brief bank={bank} me={me} setError={setError} />}
      {tab === "dash" && !bank.real && <Dashboard ov={ov} feed={feed} watching={watching} onWatch={runWatcher} onOpen={openReg} onReview={review} busyTask={busyTask} />}
      {tab === "analyze" && <Analyze docs={docs} running={running} onRun={runAnalyze} onUploaded={loadDocs} setError={setError} />}
      {tab === "history" && <History regs={ov?.regulations} onOpen={openReg} onRefresh={safe(loadOverview)} />}
      {tab === "docs" && <Docs docs={docs} onRefresh={safe(loadDocs)} setError={setError} onAnalyze={(d) => { setTab("analyze"); setTimeout(() => window.dispatchEvent(new CustomEvent("fg-doc", { detail: d })), 0); }} />}
      {tab === "policies" && <Policies bank={bank} />}
      {tab === "detail" && <Detail d={detail} onBack={() => setTab("history")} onReview={review} busyTask={busyTask} />}
    </div>
  );
}

function AlertText({ a }) {
  const { t, lang, date, time } = useLang();
  const d = { ...(a.data || {}), regTitle: titleOf(a.data, lang) };
  const [title, msg] = !a.data ? [a.title, a.message]
    : a.type === "new" ? [t.alert.found(d), t.alert.foundMsg(d, date)]
    : [t.alert.done(d), t.alert.doneMsg(d.counts)];
  return <span><b>{title}</b><small>{msg}</small><small className="muted">{time(a.createdAt)}</small></span>;
}

/* ================= ภาพรวม ================= */
function Dashboard({ ov, feed, watching, onWatch, onOpen, onReview, busyTask }) {
  const { t, lang, date } = useLang();
  if (!ov) return <div className="card empty">{t.loading}</div>;
  const regs = ov.regulations || [];
  const pending = (ov.tasks || []).filter(x => x.status === "pending_review");
  const risky = (ov.gaps || []).filter(g => g.status === "missing" || g.status === "conflict").length;
  const upcoming = regs.filter(r => r.effectiveDate && daysUntil(r.effectiveDate) >= 0).sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const soon = upcoming.filter(r => daysUntil(r.effectiveDate) <= 90).length;
  const byOwner = {}; (ov.tasks || []).filter(x => x.status !== "approved" && x.status !== "rejected").forEach(x => { byOwner[x.owner] = (byOwner[x.owner] || 0) + 1; });
  const ownerRows = Object.entries(byOwner).sort((a, b) => b[1] - a[1]);
  const maxOwner = Math.max(1, ...ownerRows.map(r => r[1]));
  const regTitle = (regId) => titleOf(regs.find(r => r.regId === regId), lang) || regId;

  return (
    <div className="dash">
      <section className="stats four">
        <div className="stat"><Icon name="file" className="si" /><b>{regs.length}</b><span>{t.dash.analyzed}</span></div>
        <div className="stat focus"><Icon name="clipboard" className="si" /><b>{pending.length}</b><span>{t.dash.pending}</span></div>
        <div className="stat bad"><Icon name="alert" className="si" /><b>{risky}</b><span>{t.dash.risky}</span></div>
        <div className="stat warn"><Icon name="calendar" className="si" /><b>{soon}</b><span>{t.dash.soon}</span></div>
      </section>

      <div className="dash-grid">
        <section className="card">
          <div className="card-head">
            <div><h2 className="ht"><Icon name="radar" />{t.dash.watcher}</h2><p className="hint">{t.dash.watcherHint}</p></div>
            <button className="btn primary sm" onClick={onWatch} disabled={watching}><Icon name={watching ? "refresh" : "search"} size={16} className={watching ? "spin" : ""} />{watching ? t.dash.watching : t.dash.watchNow}</button>
          </div>
          <ul className="feed">
            {feed.map(f => (
              <li key={f.regId}>
                <span className={`stage ${f.stage}`}>{t.stage[f.stage]}</span>
                <div className="feed-main"><b>{titleOf(f, lang)}</b><small className="muted">{t.dash.published} {date(f.publishedAt)} · {t.dash.effective} {date(f.effectiveDate)}</small></div>
                {f.analyzed ? <button className="link" onClick={() => onOpen(f.regId)}>{t.dash.viewResult}</button> : <span className="muted small">{t.dash.notAnalyzed}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="ht"><Icon name="calendar" />{t.dash.upcoming}</h2>
          {upcoming.length === 0 && <p className="muted">{t.noData}</p>}
          <ul className="timeline">
            {upcoming.slice(0, 6).map(r => {
              const d = daysUntil(r.effectiveDate);
              return (
                <li key={r.regId}>
                  <span className={`days ${d <= 30 ? "hot" : d <= 90 ? "warm" : ""}`}>{t.dash.days(d)}</span>
                  <button className="link" onClick={() => onOpen(r.regId)}>{titleOf(r, lang)}</button>
                  <small className="muted">{date(r.effectiveDate)}</small>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="dash-grid">
        <section className="card">
          <h2 className="ht"><Icon name="clipboard" />{t.dash.pendingTitle(pending.length)}</h2>
          {pending.length === 0 && <p className="muted">{t.noPending}</p>}
          <div className="stack">
            {pending.slice(0, 6).map(x => (
              <div key={x.taskId} className="mini-task">
                <div><b>{x.action}</b><small className="muted">{ownerName(x.owner, lang)} · {t.dash.due} {date(x.dueDate)} · <button className="link" onClick={() => onOpen(x.regId)}>{regTitle(x.regId)}</button></small></div>
                <div className="task-actions">
                  <button className="btn approve sm" disabled={busyTask === x.taskId} onClick={() => onReview(x.taskId, "approved")}>{t.approve}</button>
                  <button className="btn reject sm" disabled={busyTask === x.taskId} onClick={() => onReview(x.taskId, "rejected")}>{t.reject}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="ht"><Icon name="users" />{t.dash.byOwner}</h2>
          {ownerRows.length === 0 && <p className="muted">{t.noPending}</p>}
          <ul className="bars">
            {ownerRows.map(([o, n]) => (
              <li key={o}><span>{ownerName(o, lang)}</span><div className="bar"><i style={{ width: `${(n / maxOwner) * 100}%` }} /></div><b>{n}</b></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ================= วิเคราะห์ประกาศ ================= */
function Analyze({ docs, running, onRun, onUploaded, setError }) {
  const { t, lang } = useLang();
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
    const timer = setInterval(() => setStep(s => Math.min(s + 1, t.steps.length - 1)), 800);
    return () => clearInterval(timer);
  }, [running, t.steps.length]);

  const topicTitle = (x) => lang === "en" ? TOPIC_EN[x.id] : x.title;
  const pick = (x) => { setTopicId(x.id); setForm({ regId: `BOT-${x.id}-${stamp()}`, title: x.title, titleEn: TOPIC_EN[x.id], effectiveDate: x.effectiveDate, regText: x.text, docKey: "" }); };
  const pickCustom = () => { setTopicId("custom"); setForm({ regId: `BOT-CUSTOM-${stamp()}`, title: "", effectiveDate: "", regText: "", docKey: "" }); };
  const pickDoc = () => { setTopicId("doc"); setForm({ regId: `BOT-DOC-${stamp()}`, title: "", effectiveDate: "", regText: "", docKey: regDocs[0]?.key || "" }); };
  const up = (k) => (e) => setForm({ ...form, [k]: e.target.value, ...(k === "title" ? { titleEn: undefined } : {}) });

  async function quickUpload(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) return setError(t.an.tooBig);
    setUploading(true);
    try {
      const r = await post("/documents", { fileName: f.name, contentType: f.type, kind: "regulation", dataBase64: await fileToBase64(f) });
      await onUploaded();
      setForm(fm => ({ ...fm, docKey: r.key, title: fm.title || f.name.replace(/\.[^.]+$/, "") }));
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }

  const submit = (e) => { e.preventDefault(); if (!form.regText.trim() && !form.docKey) return setError(t.an.needText); onRun(form); };

  return (
    <div className="grid">
      <aside className="col">
        <section className="card">
          <h2>{t.an.pickTitle}</h2>
          <p className="hint">{t.an.pickHint}</p>
          <div className="topics">
            {TOPICS.map(x => (
              <button key={x.id} type="button" className={`topic ${topicId === x.id ? "on" : ""}`} onClick={() => pick(x)} disabled={running}>
                <span className="tag">{x.tag}</span><span className="topic-title">{topicTitle(x)}</span>
              </button>
            ))}
            <button type="button" className={`topic ${topicId === "doc" ? "on" : ""}`} onClick={pickDoc} disabled={running}>
              <span className="tag">{t.an.fileTag}</span><span className="topic-title">{t.an.fromDoc}</span>
            </button>
            <button type="button" className={`topic ${topicId === "custom" ? "on" : ""}`} onClick={pickCustom} disabled={running}>
              <span className="tag">{t.an.customTag}</span><span className="topic-title">{t.an.paste}</span>
            </button>
          </div>
        </section>
      </aside>

      <main className="col">
        {!topicId && !running && (
          <div className="card empty">
            <h2>{t.an.startTitle}</h2>
            <p>{t.an.startText}</p>
            <ol className="flow">{t.steps.map(s => <li key={s}>{s}</li>)}</ol>
          </div>
        )}

        {topicId && !running && (
          <form className="card" onSubmit={submit}>
            <h2>{t.an.formTitle}</h2>
            <label className="field"><span>{t.an.name}</span><input value={titleOf(form, lang)} onChange={up("title")} placeholder={t.an.namePh} required /></label>
            <div className="row2">
              <label className="field"><span>{t.an.id}</span><input value={form.regId} onChange={up("regId")} required /></label>
              <label className="field"><span>{t.an.effective}</span><input type="date" value={form.effectiveDate} onChange={up("effectiveDate")} required /></label>
            </div>
            {topicId === "doc" ? (
              <div className="field">
                <span>{t.an.doc}</span>
                <select value={form.docKey} onChange={up("docKey")}>
                  <option value="">{t.an.pickDoc}</option>
                  {regDocs.map(d => <option key={d.key} value={d.key}>{d.name} ({fmtSize(d.size)})</option>)}
                </select>
                <label className="upload">{uploading ? t.an.uploading : t.an.uploadNew}<input type="file" accept=".pdf,.txt,.md,.csv" onChange={quickUpload} disabled={uploading} hidden /></label>
              </div>
            ) : (
              <label className="field"><span>{t.an.body}</span><textarea value={form.regText} onChange={up("regText")} placeholder={t.an.bodyPh} /></label>
            )}
            <button className="btn primary" disabled={uploading}><Icon name="sparkle" size={17} />{t.an.run}</button>
          </form>
        )}

        {running && (
          <div className="card">
            <h2>{t.an.running}</h2>
            <p className="hint">{t.an.runningHint}</p>
            <ol className="steps">{t.steps.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>{s}</li>)}</ol>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= ผลวิเคราะห์ ================= */
function Detail({ d, onBack, onReview, busyTask }) {
  const { t, lang, date, time } = useLang();
  const [tab, setTab] = useState("gaps");
  useEffect(() => { setTab("gaps"); }, [d?.regId]);
  const view = useMemo(() => {
    const gapsByOb = {}; (d?.gaps || []).forEach(g => { gapsByOb[g.obligationId] = g; });
    const counts = {}; (d?.gaps || []).forEach(g => { counts[g.status] = (counts[g.status] || 0) + 1; });
    const obligations = [...(d?.obligations || [])].sort((a, b) => String(a.obligationId).localeCompare(String(b.obligationId), undefined, { numeric: true }));
    const tasks = [...(d?.tasks || [])].sort((a, b) => (a.status === "pending_review" ? 0 : 1) - (b.status === "pending_review" ? 0 : 1));
    return { gapsByOb, counts, obligations, tasks, pending: tasks.filter(x => x.status === "pending_review").length };
  }, [d]);
  if (!d) return null;
  if (d.loading) return <div className="card empty">{t.det.loading(d.regId)}</div>;
  const reg = d.regulation || {};
  const trace = d.trace || reg.trace || [];
  const summary = d.summary || reg.summary || (reg.counts && t.autoSummary(reg.counts));
  const pName = (id) => { const p = ALL_POLICIES.find(x => x.policyId === id); return p && policyText(p, lang).title; };

  return (
    <div className="stack">
      <div className="detail-head">
        <button className="link back" onClick={onBack}><Icon name="back" size={16} />{t.det.back}</button>
        <h2>{titleOf(reg, lang) || d.regId}</h2>
        <p className="muted">{d.regId} · {t.det.effective} {date(reg.effectiveDate)} · {t.source[reg.source] || "-"}{reg.stage && reg.stage !== "final" ? ` · ${t.stage[reg.stage]}` : ""}{reg.docKey ? ` · ${t.det.attached}` : ""}</p>
      </div>

      <section className="stats">
        <div className="stat"><b>{view.obligations.length}</b><span>{t.det.obligations}</span></div>
        <div className="stat bad"><b>{(view.counts.missing || 0) + (view.counts.conflict || 0)}</b><span>{t.det.risky}</span></div>
        <div className="stat warn"><b>{view.counts.partial || 0}</b><span>{t.det.partial}</span></div>
        <div className="stat ok"><b>{view.counts.covered || 0}</b><span>{t.det.covered}</span></div>
        <div className="stat focus"><b>{view.pending}</b><span>{t.det.pending}</span></div>
      </section>

      {summary && <div className="card summary"><h3 className="ht"><Icon name="sparkle" size={16} />{t.det.summary}</h3><p>{summary}</p></div>}

      <div className="tabs">
        <button className={tab === "gaps" ? "on" : ""} onClick={() => setTab("gaps")}>{t.det.tabGaps}</button>
        <button className={tab === "tasks" ? "on" : ""} onClick={() => setTab("tasks")}>{t.det.tabTasks} {view.pending > 0 && <em>{view.pending}</em>}</button>
        {trace.length > 0 && <button className={tab === "trace" ? "on" : ""} onClick={() => setTab("trace")}>{t.det.tabTrace(trace.length)}</button>}
      </div>

      {tab === "gaps" && (
        <div className="stack">
          {view.obligations.length === 0 && <div className="card empty">{t.det.noObligations}</div>}
          {view.obligations.map((ob, i) => {
            const gap = view.gapsByOb[ob.obligationId]; const st = gap?.status || "none";
            return (
              <article key={ob.obligationId} className={`card ob ${st}`}>
                <div className="ob-head">
                  <span className="clause">{ob.sourceClause || t.det.clause(i + 1)}</span>
                  {gap && <span className={`status ${st}`}>{t.status[st] || st} · {t.det.confidence} {pct(gap.confidence)}</span>}
                </div>
                <div className="pair">
                  <div>
                    <h4>{t.det.regSays}</h4>
                    <p><b>{ob.who}</b> {t.det.must}{ob.what}</p>
                    <dl>
                      {ob.deadline && ob.deadline !== "-" && <><dt>{t.det.deadline}</dt><dd>{ob.deadline}</dd></>}
                      {ob.threshold && ob.threshold !== "-" && <><dt>{t.det.threshold}</dt><dd>{ob.threshold}</dd></>}
                    </dl>
                  </div>
                  <div>
                    <h4>{t.det.policy}</h4>
                    {gap?.policyId && gap.policyId !== "-" ? <p><b>{gap.policyId}</b> {pName(gap.policyId) || ""}</p> : <p className="muted">{t.det.noMatch}</p>}
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
          {view.tasks.length === 0 && <div className="card empty">{t.det.noTasks}</div>}
          {view.tasks.map(x => (
            <div key={x.taskId} className={`card task ${x.status}`}>
              <div className="task-main">
                <span className={`badge ${x.status}`}>{t.task[x.status] || x.status}</span>
                <h4>{x.action}</h4>
                <p className="muted">{t.det.owner} <b>{ownerName(x.owner, lang)}</b>{x.dueDate ? ` · ${t.det.dueBy} ${date(x.dueDate)}` : ""}{x.reviewedBy ? ` · ${t.det.reviewedBy} ${x.reviewedBy} ${time(x.reviewedAt)}` : ""}</p>
              </div>
              {x.status === "pending_review" && (
                <div className="task-actions">
                  <button className="btn approve" disabled={busyTask === x.taskId} onClick={() => onReview(x.taskId, "approved")}>{t.approve}</button>
                  <button className="btn reject" disabled={busyTask === x.taskId} onClick={() => onReview(x.taskId, "rejected")}>{t.reject}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "trace" && (
        <div className="card">
          <p className="hint">{t.det.traceHint}</p>
          <ol className="trace">
            {trace.map((s, i) => (
              <li key={i}>
                <span className="turn">{t.det.turn(s.turn)}</span>
                <div>
                  <b>{t.tool[s.tool] || s.tool}</b>
                  <p>{s.input?.query || s.input?.what || s.input?.reason || s.input?.action || ""}</p>
                  {s.tool === "search_internal_policy" && s.result?.top && <span className="muted small">{t.det.candidates}: {s.result.top.join(", ")}</span>}
                  {s.tool === "save_gap" && <span className={`status ${s.input?.status}`}>{t.status[s.input?.status] || s.input?.status} · {pct(s.input?.confidence)}</span>}
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
  const { t, lang, date, time } = useLang();
  const [q, setQ] = useState("");
  const list = (regs || []).filter(r => !q || `${r.title} ${r.titleEn || ""} ${r.regId}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return (
    <section className="card">
      <div className="card-head">
        <div><h2 className="ht"><Icon name="history" />{t.hist.title}</h2><p className="hint">{t.hist.hint}</p></div>
        <div className="row-inline"><input className="search" placeholder={t.hist.search} value={q} onChange={e => setQ(e.target.value)} /><button className="btn ghost sm" onClick={onRefresh}><Icon name="refresh" size={15} />{t.refresh}</button></div>
      </div>
      {!regs && <p className="muted">{t.loading}</p>}
      {regs && list.length === 0 && <p className="muted">{t.hist.empty}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{t.hist.cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {list.map(r => {
              const c = r.counts || {};
              return (
                <tr key={r.regId} onClick={() => onOpen(r.regId)}>
                  <td><b>{titleOf(r, lang)}</b><small className="muted">{r.regId}</small></td>
                  <td><span className={`src ${r.source}`}>{t.source[r.source] || r.source}</span></td>
                  <td>{date(r.effectiveDate)}</td>
                  <td className="num bad-t">{(c.missing || 0) + (c.conflict || 0)}</td>
                  <td className="num warn-t">{c.partial || 0}</td>
                  <td className="num focus-t">{c.pending || 0}</td>
                  <td className="muted">{time(r.createdAt)}</td>
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
  const { t, time } = useLang();
  const [kind, setKind] = useState("regulation");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingKey, setLoadingKey] = useState("");

  async function upload(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) return setError(t.an.tooBig);
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
  const canInline = (type) => /pdf|text|html|image/.test(type);

  return (
    <div className="grid">
      <aside className="col">
        <section className="card">
          <h2 className="ht"><Icon name="upload" />{t.docs.upload}</h2>
          <p className="hint">{t.docs.hint}</p>
          <div className="seg">
            <button className={kind === "regulation" ? "on" : ""} onClick={() => setKind("regulation")}>{t.docs.regulation}</button>
            <button className={kind === "policy" ? "on" : ""} onClick={() => setKind("policy")}>{t.docs.policy}</button>
          </div>
          <label className="upload big"><Icon name="upload" size={24} /><span>{uploading ? t.an.uploading : t.docs.choose}</span><input type="file" accept=".pdf,.docx,.doc,.txt,.md,.html,.csv,.xlsx" onChange={upload} disabled={uploading} hidden /></label>
        </section>
        <section className="card">
          <div className="card-head"><h2>{t.docs.all(docs.length)}</h2><button className="btn ghost sm" onClick={onRefresh}><Icon name="refresh" size={15} />{t.refresh}</button></div>
          {docs.length === 0 && <p className="muted">{t.docs.empty}</p>}
          <ul className="doclist">
            {docs.map(d => (
              <li key={d.key}>
                <span className="dtype"><Icon name="file" size={18} /><small>{d.name.split(".").pop().toUpperCase()}</small></span>
                <div><b>{d.name}</b><small className="muted">{d.kind === "policy" ? t.docs.policy : t.docs.regulation} · {fmtSize(d.size)} · {time(d.lastModified)}</small></div>
                <div className="doc-actions">
                  <button className="link" onClick={() => open(d)} disabled={loadingKey === d.key}><Icon name="eye" size={15} />{loadingKey === d.key ? t.docs.opening : t.docs.open}</button>
                  {d.kind === "regulation" && <button className="link" onClick={() => onAnalyze(d)}><Icon name="sparkle" size={15} />{t.docs.analyze}</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </aside>
      <main className="col">
        <section className="card viewer">
          {!preview && <div className="viewer-empty"><Icon name="file" size={40} stroke={1.4} /><p className="muted">{t.docs.viewerEmpty}</p></div>}
          {preview && (
            <>
              <div className="card-head"><h2>{preview.name}</h2><a className="btn ghost sm" href={preview.url} download={preview.name}><Icon name="download" size={15} />{t.docs.download}</a></div>
              {canInline(preview.type) ? <iframe src={preview.url} title={preview.name} /> : <p className="muted">{t.docs.noInline}</p>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* ================= Policy ================= */
function Policies({ bank }) {
  const { t, lang } = useLang();
  return (
    <section className="card">
      <h2 className="ht"><Icon name="shield" />{bank.real ? `${bankName(bank, lang)} (${bank.policies.length})` : t.pol.title(bank.policies.length)}</h2>
      <p className="hint">{bank.real ? <>{t.brief.publicNote} · {bank.sources.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer">{t.brief.source} {i + 1} </a>)}</> : t.pol.hint}</p>
      <div className="table-wrap">
        <table className="table static">
          <thead><tr>{t.pol.cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{bank.policies.map(p => policyText(p, lang)).map(p => <tr key={p.policyId}><td><b>{p.policyId}</b></td><td>{p.title}</td><td>{p.text}</td><td className="muted">{ownerName(p.owner, lang)}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

/* ================= สรุปประจำวัน (ธนาคารจริง) ================= */
function Brief({ bank, me, setError }) {
  const { t, lang, date, time } = useLang();
  const [data, setData] = useState(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/daily?bank=${bank.id}`).then(res => res.json());
    if (r.error) throw new Error(r.error);
    setData(r);
  }, [bank.id]);
  useEffect(() => { setData(null); load().catch(e => setError(e.message)); }, [load, setError]);

  const runNow = async () => {
    setRunning(true); setError("");
    try { const r = await fetch("/api/daily", { method: "POST" }).then(res => res.json()); if (r.error) throw new Error(r.error); if (r.busy) setError(t.brief.busy); await load(); }
    catch (e) { setError(e.message); } finally { setRunning(false); }
  };
  const saveTask = async (taskId, body) => {
    setBusy(taskId);
    try {
      const r = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId, ...body }) });
      if (!r.ok) throw new Error((await r.json()).error);
      await load();
      return true;
    } catch (e) { setError(e.message); return false; } finally { setBusy(""); }
  };
  const setStatus = (taskId, status) => saveTask(taskId, { status });

  if (!data) return <div className="card empty">{t.loading}</div>;
  const count = (st) => data.tasks.filter(x => x.status === st).length;
  const titleOfNotice = (packId) => data.notices.find(n => n.packId === packId)?.title || packId;
  const staff = (id) => { const s = USERS.find(x => x.id === id); return s ? (lang === "en" ? s.nameEn : s.name) : id; };
  const today = localDate();
  const isOverdue = (x) => ["pending_review", "open"].includes(x.status) && x.dueDate < today;
  const overdue = data.tasks.filter(isOverdue).length;
  const tasks = [...data.tasks].sort((a, b) => ["pending_review", "open", "done", "rejected"].indexOf(a.status) - ["pending_review", "open", "done", "rejected"].indexOf(b.status));

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div><h2 className="ht"><Icon name="radar" />{t.brief.title}</h2><p className="hint">{t.brief.hint}</p></div>
          {me.role === "manager" && <button className="btn primary sm" onClick={runNow} disabled={running}><Icon name={running ? "refresh" : "play"} size={16} className={running ? "spin" : ""} />{running ? t.brief.running : t.brief.run}</button>}
        </div>
        <p className="muted small">{data.lastRun ? t.brief.lastRun(time(data.lastRun.at), data.lastRun) : t.brief.never}</p>
        <p className="hint">{t.brief.publicNote} · {bank.sources.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer">{t.brief.source} {i + 1} </a>)}</p>
      </section>

      <section className="stats">
        <div className="stat bad"><Icon name="alert" className="si" /><b>{overdue}</b><span>{t.brief.overdue}</span></div>
        <div className="stat"><Icon name="file" className="si" /><b>{data.notices.length}</b><span>{t.brief.stats.notices}</span></div>
        <div className="stat focus"><Icon name="clipboard" className="si" /><b>{count("pending_review")}</b><span>{t.brief.stats.pending}</span></div>
        <div className="stat warn"><Icon name="users" className="si" /><b>{count("open")}</b><span>{t.brief.stats.open}</span></div>
        <div className="stat ok"><Icon name="check" className="si" /><b>{count("done")}</b><span>{t.brief.stats.done}</span></div>
      </section>

      <Hearings />

      <Report bank={bank} data={data} staff={staff} isOverdue={isOverdue} />

      <section className="card">
        <h2 className="ht"><Icon name="file" />{t.brief.notices}</h2>
        {data.notices.length === 0 && <p className="muted">{t.brief.noNotices}</p>}
        <div className="stack">
          {data.notices.map(n => {
            const r = n.result; const counts = {}; (r?.gaps || []).forEach(g => { counts[g.status] = (counts[g.status] || 0) + 1; });
            return (
              <details key={n.packId} className="card notice">
                <summary>
                  <b>{n.title}</b>
                  <small className="muted">{date(n.date)} · <a href={n.pdfUrl} target="_blank" rel="noreferrer">{t.brief.pdf}</a></small>
                  <span className="chips">
                    {n.queued && <span className="status">{t.brief.queued}</span>}
                    {r?.gaps && r.gaps.length === 0 && <span className="status covered">{t.brief.notApplicable}</span>}
                    {Object.entries(counts).map(([st, c]) => <span key={st} className={`status ${st}`}>{t.status[st]} {c}</span>)}
                  </span>
                </summary>
                {r?.error && <p className="reason">{r.error}</p>}
                {r?.summary && <p>{r.summary}</p>}
                {(r?.obligations || []).map((ob, i) => {
                  const g = r.gaps[i];
                  return (
                    <div key={ob.obligationId} className={`ob-row ${g.status}`}>
                      <span className="clause">{ob.sourceClause}</span>
                      <div><p><b>{ob.who}</b> {t.det.must}{ob.what}</p><small className="muted">{t.status[g.status]}{g.policyId !== "-" ? ` · ${g.policyId}` : ""} · {g.reason}</small></div>
                    </div>
                  );
                })}
              </details>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="ht"><Icon name="users" />{t.brief.tasks} ({tasks.length})</h2>
        {tasks.length === 0 && <p className="muted">{t.brief.noTasks}</p>}
        <div className="stack">
          {tasks.map(x => (
            <div key={x.taskId} className={`card task ${x.status}`}>
              <div className="task-main">
                <span className={`badge ${x.status}`}>{t.brief.status[x.status]}{isOverdue(x) ? ` · ${t.brief.overdue}` : ""}</span>
                <h4>{x.action}</h4>
                <p className="muted">{t.brief.assignee} <b>{staff(x.assignee)}</b> · {ownerName(x.owner, lang)} · {t.det.dueBy} {date(x.dueDate)}</p>
                <p className="muted small">{t.brief.notice}: {titleOfNotice(x.packId)}</p>
                {x.evidence && <p className="small"><a href={x.evidence} target="_blank" rel="noreferrer">{t.brief.evidence.split(" (")[0]}</a></p>}
                <TaskDetail task={x} staff={staff} busy={busy === x.taskId} onSave={(body) => saveTask(x.taskId, body)} />
              </div>
              <div className="task-actions">
                {x.status === "pending_review" && me.role === "manager" && <>
                  <button className="btn approve sm" disabled={busy === x.taskId} onClick={() => setStatus(x.taskId, "open")}>{t.approve}</button>
                  <button className="btn reject sm" disabled={busy === x.taskId} onClick={() => setStatus(x.taskId, "rejected")}>{t.reject}</button>
                </>}
                {x.status === "open" && <button className="btn approve sm" disabled={busy === x.taskId} onClick={() => setStatus(x.taskId, "done")}>{t.brief.markDone}</button>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================= เข้าสู่ระบบ ================= */
function Login({ onDone }) {
  const { t, lang, setLang } = useLang();
  const [userId, setUserId] = useState(USERS[0].id);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, password }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onDone(data);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <div className="login-head">
          <span className="logo"><Icon name="shield" size={22} stroke={2} /></span>
          <div className="lang dark">{["th", "en"].map(l => <button type="button" key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}</div>
        </div>
        <h2>{t.auth.title}</h2>
        <p className="hint">{t.auth.hint}</p>
        <label className="field"><span>{t.auth.user}</span>
          <select value={userId} onChange={e => setUserId(e.target.value)}>
            {USERS.map(u => <option key={u.id} value={u.id}>{lang === "en" ? u.nameEn : u.name} · {t.auth.role[u.role]}</option>)}
          </select>
        </label>
        <label className="field"><span>{t.auth.password}</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{t.auth.submit}</button>
      </form>
    </div>
  );
}

/* ================= เปลี่ยนรหัสผ่าน ================= */
function ChangePassword({ onClose, onDone }) {
  const { t } = useLang();
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (f.next !== f.confirm) return setError(t.auth.mismatch);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: f.current, next: f.next }) });
      if (!r.ok) throw new Error((await r.json()).error);
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="login overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="card" onSubmit={submit}>
        <h2>{t.auth.change}</h2>
        <label className="field"><span>{t.auth.current}</span><input type="password" value={f.current} onChange={set("current")} autoComplete="current-password" required /></label>
        <label className="field"><span>{t.auth.next}</span><input type="password" value={f.next} onChange={set("next")} autoComplete="new-password" minLength={8} required /></label>
        <label className="field"><span>{t.auth.confirm}</span><input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" minLength={8} required /></label>
        {error && <p className="alert">{error}</p>}
        <div className="row-btns">
          <button type="button" className="btn" onClick={onClose}>{t.auth.cancel}</button>
          <button className="btn primary" disabled={busy}>{t.auth.change}</button>
        </div>
      </form>
    </div>
  );
}

/* ================= รายงาน: กราฟ + ส่งออก CSV + พิมพ์ ================= */
function Report({ bank, data, staff, isOverdue }) {
  const { t, lang } = useLang();
  const open = data.tasks.filter(x => ["pending_review", "open"].includes(x.status));
  const count = (list, key) => Object.entries(list.reduce((m, x) => ({ ...m, [key(x)]: (m[key(x)] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const byDept = count(open, x => ownerName(x.owner, lang));
  const byMonth = count(data.notices, n => n.date.slice(0, 7)).sort((a, b) => a[0].localeCompare(b[0]));
  const bars = (rows) => {
    const max = Math.max(1, ...rows.map(r => r[1]));
    return <ul className="bars">{rows.map(([k, n]) => <li key={k}><span>{k}</span><div className="bar"><i style={{ width: `${(n / max) * 100}%` }} /></div><b>{n}</b></li>)}</ul>;
  };

  const exportCsv = () => {
    const title = (id) => data.notices.find(n => n.packId === id)?.title || id;
    const rows = data.tasks.map(x => [bankName(bank, lang), title(x.packId), x.action, ownerName(x.owner, lang), staff(x.assignee), t.brief.status[x.status] + (isOverdue(x) ? ` (${t.brief.overdue})` : ""), x.dueDate, x.evidence || ""]);
    const csv = [t.brief.csvCols, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); // BOM ให้ Excel อ่านภาษาไทยถูก
    a.download = `finguard-${bank.id}-${localDate()}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="ht"><Icon name="layers" />{t.brief.report}</h2>
        <div className="row-inline no-print">
          <button className="btn ghost sm" onClick={exportCsv}><Icon name="download" size={15} />{t.brief.exportCsv}</button>
          <button className="btn ghost sm" onClick={() => window.print()}><Icon name="file" size={15} />{t.brief.print}</button>
        </div>
      </div>
      <div className="dash-grid">
        <div><h3 className="small muted">{t.brief.byDept}</h3>{byDept.length ? bars(byDept) : <p className="muted">{t.noPending}</p>}</div>
        <div><h3 className="small muted">{t.brief.byMonth}</h3>{byMonth.length ? bars(byMonth) : <p className="muted">{t.noData}</p>}</div>
      </div>
    </section>
  );
}

/* ================= ร่างประกาศที่เปิดรับฟังความเห็น ================= */
function Hearings() {
  const { t, date } = useLang();
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/hearings").then(r => r.json()).then(r => (r.error ? setError(r.error) : setList(r.hearings))).catch(e => setError(e.message));
  }, []);

  return (
    <section className="card">
      <h2 className="ht"><Icon name="megaphone" />{t.brief.hearings}</h2>
      <p className="hint">{t.brief.hearingsHint}</p>
      {error && <p className="muted">{error}</p>}
      {!list && !error && <p className="muted">{t.loading}</p>}
      {list?.length === 0 && <p className="muted">{t.brief.noHearings}</p>}
      <ul className="timeline">
        {(list || []).map(h => (
          <li key={h.url}>
            <span className={`days ${h.daysLeft <= 3 ? "hot" : h.daysLeft <= 14 ? "warm" : ""}`}>{t.brief.daysLeft(h.daysLeft)}</span>
            <a href={h.url} target="_blank" rel="noreferrer">{h.title}</a>
            <small className="muted">{t.brief.closes} {date(h.to)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ================= รายละเอียดงาน: ประวัติ + คอมเมนต์ + ลิงก์หลักฐาน ================= */
function TaskDetail({ task, staff, busy, onSave }) {
  const { t, time } = useLang();
  const [comment, setComment] = useState("");
  const [evidence, setEvidence] = useState("");
  const save = async (e) => {
    e.preventDefault();
    if (await onSave({ comment, evidence })) { setComment(""); setEvidence(""); }
  };

  return (
    <details className="task-detail">
      <summary>{t.brief.details} ({(task.history || []).length})</summary>
      <h4 className="small muted">{t.brief.history}</h4>
      {!(task.history || []).length && <p className="muted small">{t.brief.noHistory}</p>}
      <ul className="history">
        {(task.history || []).map((h, i) => (
          <li key={i}><small className="muted">{time(h.at)}</small> <b>{staff(h.by)}</b> {t.brief.act[h.action] || h.action}{h.text ? `: ${h.text}` : ""}</li>
        ))}
      </ul>
      <form onSubmit={save} className="stack">
        <textarea rows={2} placeholder={t.brief.comment} value={comment} onChange={e => setComment(e.target.value)} />
        <input type="url" placeholder={t.brief.evidence} value={evidence} onChange={e => setEvidence(e.target.value)} />
        <button className="btn ghost sm" disabled={busy || (!comment.trim() && !evidence.trim())}>{t.brief.save}</button>
      </form>
    </details>
  );
}

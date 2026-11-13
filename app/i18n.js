"use client";
import { createContext, useContext, useEffect, useState } from "react";

// คำแปลทั้งหมดของหน้าเว็บ (TH / EN)
const TEXT = {
  th: {
    tagline: "Regulatory Compliance Agent · ประกาศ ธปท. → ภาระหน้าที่ → gap → งาน",
    rulesMode: "โหมดกฎ (ไม่มี AI)",
    reset: "รีเซ็ตข้อมูล", resetConfirm: "ล้างข้อมูลทั้งหมดแล้วเริ่มใหม่?",
    alerts: "การแจ้งเตือน", readAll: "อ่านทั้งหมด", noAlerts: "ยังไม่มีการแจ้งเตือน",
    noKey: "ยังไม่ได้ตั้ง GROQ_API_KEY: ระบบใช้การวิเคราะห์แบบกฎแทน AI",
    close: "ปิด", loading: "กำลังโหลด...", refresh: "รีเฟรช", approve: "อนุมัติ", reject: "ไม่อนุมัติ", noPending: "ไม่มีงานค้าง", noData: "ยังไม่มีข้อมูล",
    nav: { dash: "ภาพรวม", analyze: "วิเคราะห์ประกาศ", history: "ประวัติ", docs: "คลังเอกสาร", policies: "Policy ธนาคาร" },
    status: { covered: "ครอบคลุมแล้ว", partial: "ครอบคลุมบางส่วน", missing: "ยังไม่มีใน policy", conflict: "ขัดกับ policy" },
    task: { pending_review: "รอคนอนุมัติ", open: "เปิดงานแล้ว", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ" },
    tool: { search_internal_policy: "ค้น policy ภายใน", save_obligation: "ดึงภาระหน้าที่", save_gap: "ตัดสินผลเทียบ", create_task: "สร้างงาน" },
    source: { manual: "กรอกเอง", watcher: "Watcher อัตโนมัติ", upload: "จากเอกสาร" },
    stage: { draft: "ร่าง · รับฟังความเห็น", final: "ประกาศใหม่", amendment: "ประกาศแก้ไข" },
    steps: ["อ่านประกาศและแยกเป็นข้อ", "ดึงภาระหน้าที่ (ใคร ทำอะไร เมื่อไหร่)", "ค้น policy ภายในของ Bank A", "ตัดสินว่าครอบคลุม / ขาด / ขัดแย้ง", "สร้างงานและส่งข้อที่ไม่มั่นใจให้คนอนุมัติ"],
    alert: {
      found: (a) => `พบ${TEXT.th.stage[a.stage] || "ประกาศใหม่"}: ${a.regTitle}`,
      foundMsg: (a, d) => `เผยแพร่ ${d(a.publishedAt)} · มีผล ${d(a.effectiveDate)} · Agent เริ่มวิเคราะห์อัตโนมัติ`,
      done: (a) => `วิเคราะห์เสร็จ: ${a.regTitle}`,
      doneMsg: (c) => `พบ ${c.obligations} ภาระหน้าที่ · ขาด/ขัดแย้ง ${c.missing + c.conflict} · รออนุมัติ ${c.pending} งาน`
    },
    autoSummary: (c) => `พบภาระหน้าที่ ${c.obligations} ข้อ ครอบคลุมแล้ว ${c.covered} ข้อ บางส่วน ${c.partial} ข้อ ขาดหรือขัดกับ policy ${c.missing + c.conflict} ข้อ สร้างงาน ${c.tasks} งาน โดย ${c.pending} งานรอคนอนุมัติ`,
    dash: {
      analyzed: "ประกาศที่วิเคราะห์แล้ว", pending: "งานรอคนอนุมัติ", risky: "ข้อที่ขาด / ขัดกับ policy", soon: "ประกาศมีผลภายใน 90 วัน",
      watcher: "Watcher ติดตามประกาศ ธปท.", watcherHint: "แหล่งประกาศตัวอย่าง · กดตรวจหาเพื่อให้ AI วิเคราะห์ฉบับใหม่",
      watching: "กำลังตรวจและวิเคราะห์...", watchNow: "ตรวจหาประกาศใหม่ตอนนี้",
      published: "เผยแพร่", effective: "มีผล", viewResult: "ดูผล", notAnalyzed: "ยังไม่วิเคราะห์",
      upcoming: "ใกล้มีผลบังคับใช้", days: (n) => `${n} วัน`,
      pendingTitle: (n) => `งานรอคนอนุมัติ (${n})`, due: "กำหนด", byOwner: "งานค้างแยกตามหน่วยงาน",
      watchNone: "ไม่พบประกาศใหม่ ทุกฉบับในแหล่งที่ติดตามวิเคราะห์แล้ว (กดรีเซ็ตข้อมูลเพื่อเริ่มใหม่)",
      watchFound: (id) => `Watcher พบประกาศใหม่และวิเคราะห์เสร็จ: ${id}`
    },
    an: {
      pickTitle: "1. เลือกหัวข้อประกาศ ธปท.", pickHint: "ข้อความในหัวข้อเป็นตัวอย่างเพื่อ demo",
      fileTag: "PDF / ไฟล์", fromDoc: "วิเคราะห์จากเอกสาร", customTag: "กรอกเอง", paste: "วางข้อความประกาศ",
      startTitle: "เลือกหัวข้อทางซ้ายเพื่อเริ่ม",
      startText: "Agent จะดึงภาระหน้าที่จากประกาศ เทียบกับ policy ของธนาคาร ตัดสินว่ามีช่องว่างตรงไหน แล้วสร้างงานให้หน่วยงานที่รับผิดชอบ ข้อที่ไม่มั่นใจจะส่งให้คนอนุมัติก่อน",
      formTitle: "2. ตรวจรายละเอียดแล้วสั่ง Agent", name: "ชื่อประกาศ", namePh: "เช่น ประกาศเรื่องการรายงานธุรกรรม",
      id: "รหัสประกาศ", effective: "วันมีผลบังคับใช้", doc: "เอกสารประกาศ (PDF, TXT ไม่เกิน 4 MB)", pickDoc: "— เลือกจากคลังเอกสาร —",
      uploading: "กำลังอัปโหลด...", uploadNew: "หรืออัปโหลดไฟล์ใหม่", body: "เนื้อหาประกาศ", bodyPh: "วางข้อความประกาศทั้งฉบับ",
      run: "ให้ Agent วิเคราะห์ประกาศนี้", running: "Agent กำลังทำงาน", runningHint: "ใช้เวลาไม่กี่วินาที ผลจะเปิดให้อัตโนมัติ",
      needText: "ใส่เนื้อหาประกาศหรือเลือกเอกสารก่อน", tooBig: "ไฟล์ใหญ่เกิน 4 MB"
    },
    det: {
      loading: (id) => `กำลังโหลดผลของ ${id}...`, back: "กลับไปประวัติ", effective: "มีผล", attached: "มีเอกสารแนบ",
      obligations: "ภาระหน้าที่", risky: "ขาด / ขัดแย้ง", partial: "ครอบคลุมบางส่วน", covered: "ครอบคลุมแล้ว", pending: "งานรออนุมัติ",
      summary: "สรุปจาก Agent", tabGaps: "ผลเทียบกับ policy", tabTasks: "งานที่ต้องทำ", tabTrace: (n) => `Agent ตัดสินใจอย่างไร (${n})`,
      noObligations: "ยังไม่มีภาระหน้าที่ที่บันทึกไว้", confidence: "มั่นใจ", clause: (i) => `ข้อที่ ${i}`,
      regSays: "ประกาศกำหนด", must: "ต้อง", deadline: "ระยะเวลา", threshold: "เกณฑ์", policy: "Policy ภายใน", noMatch: "ไม่พบข้อที่ตรงกัน",
      noTasks: "ไม่มีงานที่ต้องทำ", owner: "ผู้รับผิดชอบ", dueBy: "กำหนดเสร็จ", reviewedBy: "ตรวจโดย",
      traceHint: "ขั้นตอนที่ Agent ทำกับประกาศฉบับนี้", turn: (n) => `รอบ ${n}`, candidates: "ผู้สมัคร"
    },
    hist: {
      title: "ประวัติการวิเคราะห์", hint: "เก็บในเบราว์เซอร์นี้เท่านั้น", search: "ค้นหาชื่อหรือรหัส", empty: "ยังไม่มีประวัติ",
      cols: ["ประกาศ", "ที่มา", "มีผล", "ขาด/ขัดแย้ง", "บางส่วน", "รออนุมัติ", "วิเคราะห์เมื่อ"]
    },
    docs: {
      upload: "อัปโหลดเอกสาร", hint: "เก็บในเบราว์เซอร์ · ไม่เกิน 4 MB · PDF และ TXT ส่งให้ AI วิเคราะห์ได้",
      regulation: "ประกาศ ธปท.", policy: "Policy ธนาคาร", choose: "เลือกไฟล์เพื่ออัปโหลด", all: (n) => `เอกสารทั้งหมด (${n})`, empty: "ยังไม่มีเอกสาร",
      opening: "กำลังเปิด", open: "เปิดดู", analyze: "วิเคราะห์", viewerEmpty: "กด “เปิดดู” ที่เอกสารเพื่อแสดงตรงนี้",
      download: "ดาวน์โหลด", noInline: "ไฟล์ชนิดนี้แสดงในเบราว์เซอร์ไม่ได้ กดดาวน์โหลดเพื่อเปิด"
    },
    pol: { title: (n) => `Policy ภายในของ Bank A (${n} ข้อ)`, hint: "Policy ของธนาคารตัวอย่าง · Agent เทียบประกาศกับชุดนี้", cols: ["รหัส", "หัวข้อ", "ข้อกำหนด", "หน่วยงาน"] }
  },
  en: {
    tagline: "Regulatory Compliance Agent · BOT regulation → obligations → gaps → tasks",
    rulesMode: "Rules mode (no AI)",
    reset: "Reset data", resetConfirm: "Clear all data and start over?",
    alerts: "Notifications", readAll: "Mark all read", noAlerts: "No notifications yet",
    noKey: "GROQ_API_KEY is not set: using rule-based analysis instead of AI",
    close: "Close", loading: "Loading...", refresh: "Refresh", approve: "Approve", reject: "Reject", noPending: "Nothing pending", noData: "No data yet",
    nav: { dash: "Overview", analyze: "Analyze", history: "History", docs: "Documents", policies: "Bank policies" },
    status: { covered: "Covered", partial: "Partially covered", missing: "Not in policy", conflict: "Conflicts with policy" },
    task: { pending_review: "Needs approval", open: "Open", approved: "Approved", rejected: "Rejected" },
    tool: { search_internal_policy: "Search internal policy", save_obligation: "Extract obligation", save_gap: "Judge gap", create_task: "Create task" },
    source: { manual: "Manual", watcher: "Auto watcher", upload: "From document" },
    stage: { draft: "Draft · consultation", final: "New regulation", amendment: "Amendment" },
    steps: ["Read the regulation and split it into clauses", "Extract obligations (who, what, when)", "Search Bank A's internal policies", "Decide covered / missing / conflict", "Create tasks and send uncertain ones for approval"],
    alert: {
      found: (a) => `New ${(TEXT.en.stage[a.stage] || "regulation").toLowerCase()}: ${a.regTitle}`,
      foundMsg: (a, d) => `Published ${d(a.publishedAt)} · effective ${d(a.effectiveDate)} · Agent started analyzing`,
      done: (a) => `Analysis done: ${a.regTitle}`,
      doneMsg: (c) => `${c.obligations} obligations · ${c.missing + c.conflict} missing/conflict · ${c.pending} tasks need approval`
    },
    autoSummary: (c) => `Found ${c.obligations} obligations: ${c.covered} covered, ${c.partial} partial, ${c.missing + c.conflict} missing or conflicting. Created ${c.tasks} tasks, ${c.pending} need human approval.`,
    dash: {
      analyzed: "Regulations analyzed", pending: "Tasks need approval", risky: "Missing / conflicting items", soon: "Effective within 90 days",
      watcher: "BOT regulation watcher", watcherHint: "Sample source · check now to let AI analyze new regulations",
      watching: "Checking and analyzing...", watchNow: "Check for new regulations",
      published: "Published", effective: "Effective", viewResult: "View", notAnalyzed: "Not analyzed",
      upcoming: "Coming into effect", days: (n) => `${n} days`,
      pendingTitle: (n) => `Tasks needing approval (${n})`, due: "Due", byOwner: "Open tasks by department",
      watchNone: "No new regulations. Every item in the source is already analyzed (reset data to start over).",
      watchFound: (id) => `Watcher found and analyzed a new regulation: ${id}`
    },
    an: {
      pickTitle: "1. Choose a BOT regulation", pickHint: "Topic texts are samples for the demo",
      fileTag: "PDF / file", fromDoc: "Analyze a document", customTag: "Manual", paste: "Paste regulation text",
      startTitle: "Pick a topic on the left to start",
      startText: "The agent extracts obligations from the regulation, compares them with the bank's policies, finds the gaps and creates tasks for the responsible teams. Uncertain items go to a human for approval first.",
      formTitle: "2. Check the details and run the agent", name: "Regulation title", namePh: "e.g. Transaction reporting regulation",
      id: "Regulation ID", effective: "Effective date", doc: "Regulation document (PDF, TXT up to 4 MB)", pickDoc: "— Choose from documents —",
      uploading: "Uploading...", uploadNew: "or upload a new file", body: "Regulation text", bodyPh: "Paste the full regulation text",
      run: "Analyze with the agent", running: "Agent is working", runningHint: "Takes a few seconds, results open automatically",
      needText: "Enter the regulation text or choose a document first", tooBig: "File is larger than 4 MB"
    },
    det: {
      loading: (id) => `Loading results for ${id}...`, back: "Back to history", effective: "Effective", attached: "Has document",
      obligations: "Obligations", risky: "Missing / conflict", partial: "Partially covered", covered: "Covered", pending: "Need approval",
      summary: "Agent summary", tabGaps: "Policy comparison", tabTasks: "Tasks", tabTrace: (n) => `How the agent decided (${n})`,
      noObligations: "No obligations saved yet", confidence: "confidence", clause: (i) => `Item ${i}`,
      regSays: "Regulation requires", must: "must ", deadline: "Deadline", threshold: "Threshold", policy: "Internal policy", noMatch: "No matching policy",
      noTasks: "No tasks", owner: "Owner", dueBy: "Due", reviewedBy: "Reviewed by",
      traceHint: "Steps the agent took for this regulation", turn: (n) => `Step ${n}`, candidates: "Candidates"
    },
    hist: {
      title: "Analysis history", hint: "Stored in this browser only", search: "Search title or ID", empty: "No history yet",
      cols: ["Regulation", "Source", "Effective", "Missing/conflict", "Partial", "Need approval", "Analyzed"]
    },
    docs: {
      upload: "Upload document", hint: "Stored in the browser · up to 4 MB · PDF and TXT can be analyzed by AI",
      regulation: "BOT regulation", policy: "Bank policy", choose: "Choose a file to upload", all: (n) => `All documents (${n})`, empty: "No documents yet",
      opening: "Opening", open: "Open", analyze: "Analyze", viewerEmpty: "Click “Open” on a document to show it here",
      download: "Download", noInline: "This file type can't be shown in the browser. Download it to open."
    },
    pol: { title: (n) => `Bank A internal policies (${n})`, hint: "Sample bank policies · the agent compares regulations against these", cols: ["ID", "Title", "Requirement", "Department"] }
  }
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState("th");
  useEffect(() => { const saved = localStorage.getItem("fg-lang"); if (saved === "en") setLang("en"); }, []);
  useEffect(() => { localStorage.setItem("fg-lang", lang); document.documentElement.lang = lang; }, [lang]);

  const locale = lang === "en" ? "en-GB" : "th-TH";
  const date = (s) => { if (!s) return "-"; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }); };
  const time = (s) => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };

  return <LangContext.Provider value={{ lang, setLang, t: TEXT[lang], date, time }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

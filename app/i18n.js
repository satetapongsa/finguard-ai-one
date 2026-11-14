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
    nav: { dash: "ภาพรวม", analyze: "วิเคราะห์ประกาศ", history: "ประวัติ", docs: "คลังเอกสาร", policies: "Policy ธนาคาร", users: "ผู้ใช้" },
    users: {
      title: "ผู้ใช้ทั้งหมด", hint: "เพิ่มพนักงาน รีเซ็ตรหัสให้คนที่ลืม หรือปิดบัญชีคนที่ลาออก (งานเดิมยังอยู่ แต่จะไม่ได้รับงานใหม่) · ใส่รหัสผิด 5 ครั้งติด บัญชีจะล็อก 15 นาที รีเซ็ตรหัสเพื่อปลดล็อกได้",
      cols: ["ชื่อ", "บทบาท", "ฝ่าย", "สถานะ", "จัดการ"], active: "ใช้งาน", inactive: "ปิดบัญชี", noAccess: "เฉพาะเจ้าของระบบ",
      reset: "รีเซ็ตรหัส", newPw: "รหัสใหม่ (8 ตัวขึ้นไป)", disable: "ปิดบัญชี", enable: "เปิดบัญชี",
      add: "เพิ่มผู้ใช้", name: "ชื่อ (ไทย)", nameEn: "ชื่อ (อังกฤษ)", firstPw: "รหัสผ่านเริ่มต้น (8 ตัวขึ้นไป)",
      added: (n) => `เพิ่ม ${n} แล้ว`, resetDone: (n) => `รีเซ็ตรหัสของ ${n} แล้ว`, disabled: (n) => `ปิดบัญชี ${n} แล้ว`, enabled: (n) => `เปิดบัญชี ${n} แล้ว`
    },
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
    bank: "ธนาคาร",
    auth: {
      title: "เข้าสู่ระบบ FinGuard AI", hint: "เลือกชื่อของคุณแล้วใส่รหัสผ่าน (ครั้งแรกใช้รหัสของบทบาท หัวหน้า / พนักงาน แล้วเปลี่ยนเป็นรหัสของตัวเองได้)",
      user: "ผู้ใช้", password: "รหัสผ่าน", submit: "เข้าสู่ระบบ", logout: "ออกจากระบบ",
      role: { manager: "หัวหน้า", staff: "พนักงาน" }, owner: "เจ้าของระบบ",
      email: "อีเมลเจ้าของระบบ", useEmail: "เจ้าของระบบ? เข้าด้วยอีเมล", usePick: "เลือกชื่อผู้ใช้แทน",
      change: "เปลี่ยนรหัสผ่าน", current: "รหัสผ่านปัจจุบัน", next: "รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)", confirm: "ยืนยันรหัสผ่านใหม่",
      mismatch: "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน", changed: "เปลี่ยนรหัสผ่านแล้ว ครั้งหน้าใช้รหัสใหม่", cancel: "ยกเลิก"
    },
    brief: {
      nav: "สรุปประจำวัน", title: "สรุปประจำวัน · ประกาศ ธปท. ล่าสุด",
      hint: "ระบบดึงประกาศจาก ธปท. (FIPCS) ทุกวัน 07:30 น. ให้ AI เทียบกับเอกสารนโยบายที่ธนาคารเผยแพร่ แล้วสร้างงานและแบ่งให้พนักงาน",
      lastRun: (d, r) => `รันล่าสุด ${d} · ประกาศใหม่ ${r.newNotices.length} ฉบับ · วิเคราะห์ ${r.analyzed} รายการ · งานใหม่ ${r.tasksCreated} งาน${r.remaining ? ` · เหลือในคิว ${r.remaining}` : ""}`,
      never: "ยังไม่เคยรัน กด “รันตอนนี้” เพื่อดึงประกาศล่าสุด",
      busy: "งานประจำวันกำลังรันอยู่แล้ว รอสักครู่แล้วรีเฟรช", run: "รันตอนนี้", running: "กำลังดึงและวิเคราะห์ (1–4 นาที)...",
      notices: "ประกาศ ธปท. ที่ติดตาม", noNotices: "ยังไม่มีประกาศ", pdf: "เปิด PDF", original: "ต้นฉบับบนเว็บ ธปท.", preview: "ดู PDF ในหน้านี้", hidePreview: "ซ่อน PDF",
      search: "ค้นหางาน ประกาศ หรือชื่อคน", filterStatus: "กรองสถานะ", allStatus: "ทุกสถานะ", allPeople: "ทุกคน", noMatch: "ไม่มีงานที่ตรงกับตัวกรอง",
      emailAll: "ส่งงานทั้งหมดเข้าอีเมล", emailMine: "ส่งงานของฉันเข้าอีเมล", emailing: "กำลังส่งอีเมล...", emailSent: (n, to) => `ส่งรายการงาน ${n} งานไปที่ ${to} แล้ว`, queued: "รอวิเคราะห์", notApplicable: "ไม่มีข้อที่ใช้กับธนาคารพาณิชย์",
      tasks: "งานที่แบ่งให้พนักงาน", noTasks: "ยังไม่มีงาน", assignee: "ผู้รับงาน", notice: "ประกาศ", done: "เสร็จแล้ว", markDone: "ปิดงาน",
      stats: { notices: "ประกาศที่ติดตาม", pending: "รออนุมัติ", open: "กำลังทำ", done: "เสร็จแล้ว" },
      status: { pending_review: "รออนุมัติ", open: "กำลังทำ", done: "เสร็จแล้ว", rejected: "ไม่อนุมัติ" },
      hearings: "ร่างประกาศที่ ธปท. เปิดรับฟังความเห็น", hearingsHint: "เตือนล่วงหน้าก่อนประกาศจริง · ส่งความเห็นได้ถึงวันปิดรับ", daysLeft: (n) => `เหลือ ${n} วัน`, noHearings: "ไม่มีร่างที่เปิดรับฟังอยู่", closes: "ปิดรับ",
      details: "รายละเอียด / คอมเมนต์", history: "ประวัติ", comment: "คอมเมนต์", evidence: "ลิงก์หลักฐาน (https://...)", save: "บันทึก", noHistory: "ยังไม่มีประวัติ",
      act: { open: "อนุมัติ", rejected: "ไม่อนุมัติ", done: "ปิดงาน", comment: "คอมเมนต์", evidence: "แนบหลักฐาน" },
      report: "รายงาน", byDept: "งานค้างแยกตามฝ่าย", byMonth: "ประกาศที่ติดตามรายเดือน", overdue: "เลยกำหนด",
      exportCsv: "ส่งออก Excel (CSV)", print: "พิมพ์ / บันทึก PDF",
      csvCols: ["ธนาคาร", "ประกาศ", "งาน", "ฝ่าย", "ผู้รับงาน", "สถานะ", "กำหนดเสร็จ", "หลักฐาน"],
      publicNote: "เทียบกับเอกสารนโยบายที่ธนาคารเผยแพร่ต่อสาธารณะ ไม่ใช่ policy ภายในจริง งานทุกงานจึงต้องให้คนอนุมัติก่อน", source: "ที่มา"
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
    nav: { dash: "Overview", analyze: "Analyze", history: "History", docs: "Documents", policies: "Bank policies", users: "Users" },
    users: {
      title: "All users", hint: "Add staff, reset a forgotten password, or disable someone who left (their tasks stay, but they get no new ones) · 5 wrong passwords in a row lock the account for 15 minutes; resetting the password unlocks it",
      cols: ["Name", "Role", "Department", "Status", "Actions"], active: "Active", inactive: "Disabled", noAccess: "Owner only",
      reset: "Reset password", newPw: "New password (8+ characters)", disable: "Disable", enable: "Enable",
      add: "Add user", name: "Name (Thai)", nameEn: "Name (English)", firstPw: "Initial password (8+ characters)",
      added: (n) => `Added ${n}`, resetDone: (n) => `Password reset for ${n}`, disabled: (n) => `Disabled ${n}`, enabled: (n) => `Enabled ${n}`
    },
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
    bank: "Bank",
    auth: {
      title: "Sign in to FinGuard AI", hint: "Choose your name and enter your password (first time: your role's password, manager / staff, then change it to your own)",
      user: "User", password: "Password", submit: "Sign in", logout: "Sign out",
      role: { manager: "Manager", staff: "Staff" }, owner: "Owner",
      email: "Owner email", useEmail: "Owner? Sign in with email", usePick: "Pick a user instead",
      change: "Change password", current: "Current password", next: "New password (min. 8 characters)", confirm: "Confirm new password",
      mismatch: "The new passwords do not match", changed: "Password changed. Use the new one next time.", cancel: "Cancel"
    },
    brief: {
      nav: "Daily brief", title: "Daily brief · latest BOT notices",
      hint: "Every day at 07:30 the system pulls BOT notices (FIPCS), lets AI compare them with the bank's published policies, then creates and assigns tasks.",
      lastRun: (d, r) => `Last run ${d} · ${r.newNotices.length} new notices · ${r.analyzed} analyses · ${r.tasksCreated} new tasks${r.remaining ? ` · ${r.remaining} queued` : ""}`,
      never: "Not run yet. Click “Run now” to pull the latest notices.",
      busy: "The daily job is already running. Wait a moment and refresh.", run: "Run now", running: "Fetching and analyzing (1–4 min)...",
      notices: "Tracked BOT notices", noNotices: "No notices yet", pdf: "Open PDF", original: "Original on BOT site", preview: "View PDF here", hidePreview: "Hide PDF",
      search: "Search tasks, notices or people", filterStatus: "Filter status", allStatus: "All statuses", allPeople: "Everyone", noMatch: "No tasks match the filters",
      emailAll: "Email me all tasks", emailMine: "Email me my tasks", emailing: "Sending email...", emailSent: (n, to) => `Sent ${n} tasks to ${to}`, queued: "Queued", notApplicable: "No clauses apply to commercial banks",
      tasks: "Tasks assigned to staff", noTasks: "No tasks yet", assignee: "Assignee", notice: "Notice", done: "Done", markDone: "Mark done",
      stats: { notices: "Tracked notices", pending: "Need approval", open: "In progress", done: "Done" },
      status: { pending_review: "Needs approval", open: "In progress", done: "Done", rejected: "Rejected" },
      hearings: "BOT drafts open for public comment", hearingsHint: "Early warning before rules are final · comments accepted until the closing date", daysLeft: (n) => `${n} days left`, noHearings: "No drafts open for comment", closes: "Closes",
      details: "Details / comments", history: "History", comment: "Comment", evidence: "Evidence link (https://...)", save: "Save", noHistory: "No history yet",
      act: { open: "approved", rejected: "rejected", done: "closed", comment: "commented", evidence: "attached evidence" },
      report: "Report", byDept: "Open tasks by department", byMonth: "Tracked notices by month", overdue: "Overdue",
      exportCsv: "Export Excel (CSV)", print: "Print / save PDF",
      csvCols: ["Bank", "Notice", "Task", "Department", "Assignee", "Status", "Due", "Evidence"],
      publicNote: "Compared with the bank's publicly published policy statements, not its real internal policies, so every task needs human approval.", source: "Source"
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

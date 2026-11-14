// รายชื่อตั้งต้น (ชื่อสมมติ) ระบบจะสร้างเป็นผู้ใช้ในฐานข้อมูลให้ตอนเริ่มใช้งานครั้งแรก
export const STAFF = [
  { id: "cmp-1", name: "สมชาย ใจดี", nameEn: "Somchai J.", dept: "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์" },
  { id: "cmp-2", name: "วรรณา ศรีสุข", nameEn: "Wanna S.", dept: "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์" },
  { id: "ops-1", name: "ประภา มั่นคง", nameEn: "Prapa M.", dept: "ฝ่ายปฏิบัติการ" },
  { id: "ops-2", name: "ธนพล วงศ์ใหญ่", nameEn: "Thanapol W.", dept: "ฝ่ายปฏิบัติการ" },
  { id: "risk-1", name: "กิตติ รุ่งเรือง", nameEn: "Kitti R.", dept: "ฝ่ายบริหารความเสี่ยง" },
  { id: "risk-2", name: "นภัสสร แก้วใส", nameEn: "Napatsorn K.", dept: "ฝ่ายบริหารความเสี่ยง" },
  { id: "it-1", name: "อนุชา พงษ์ไทย", nameEn: "Anucha P.", dept: "ฝ่ายเทคโนโลยีสารสนเทศ" },
  { id: "cyber-1", name: "ศิริพร ทองดี", nameEn: "Siriporn T.", dept: "ฝ่ายความปลอดภัยไซเบอร์" },
  { id: "fraud-1", name: "ณัฐวุฒิ สายบุญ", nameEn: "Nattawut S.", dept: "ฝ่ายป้องกันทุจริต" },
  { id: "digital-1", name: "ปิยะ เจริญผล", nameEn: "Piya C.", dept: "ฝ่ายดิจิทัลแบงกิ้ง" }
];

// ผู้ใช้ที่ล็อกอินได้: หัวหน้า (อนุมัติงาน รันงานประจำวัน) + พนักงานทุกคน (เห็นและปิดงานของตัวเอง)
export const MANAGERS = [
  { id: "mgr-1", name: "หัวหน้าฝ่ายกำกับฯ", nameEn: "Compliance Manager", dept: "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์" }
];
export const USERS = [
  ...MANAGERS.map(u => ({ ...u, role: "manager" })),
  ...STAFF.map(u => ({ ...u, role: "staff" }))
];

// เลือกพนักงานในฝ่ายที่มีงานค้างน้อยที่สุด ถ้าฝ่ายนั้นไม่มีคน ส่งให้ฝ่ายกำกับฯ
export function pickAssignee(dept, tasks, staff = STAFF) {
  const team = staff.filter(s => s.dept === dept);
  const pool = team.length ? team : staff.filter(s => s.dept === "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์");
  const open = (id) => tasks.filter(t => t.assignee === id && t.status !== "done" && t.status !== "rejected").length;
  return pool.reduce((best, s) => (open(s.id) < open(best.id) ? s : best)).id;
}

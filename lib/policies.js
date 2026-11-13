// policy ภายในของธนาคารตัวอย่าง (Bank A) และการค้นแบบ bigram ใช้ร่วมกันทั้งฝั่ง server และเบราว์เซอร์

export const BANK_POLICIES = [
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

const norm = (s) => String(s || "").toLowerCase().replace(/[\s.,:;()"'\-–/]+/g, "");
const grams = (s) => { const t = norm(s); const g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); return g; };
const PG = BANK_POLICIES.map(p => grams(p.title + p.text));
export function searchPolicies(q) {
  const qg = grams(q); if (!qg.size) return [];
  return BANK_POLICIES.map((p, i) => { let h = 0; qg.forEach(g => { if (PG[i].has(g)) h++; }); return { ...p, score: Math.round(h / qg.size * 100) / 100 }; })
    .sort((a, b) => b.score - a.score).slice(0, 3);
}


// คำแปลภาษาอังกฤษสำหรับแสดงผล (AI ใช้ฉบับภาษาไทยด้านบน)
const OWNER_EN = {
  "ฝ่ายกำกับการปฏิบัติตามกฎเกณฑ์": "Compliance",
  "ฝ่ายปฏิบัติการ": "Operations",
  "ฝ่ายดิจิทัลแบงกิ้ง": "Digital Banking",
  "ฝ่ายบริหารความเสี่ยง": "Risk Management",
  "ฝ่ายเทคโนโลยีสารสนเทศ": "Information Technology",
  "ฝ่ายความปลอดภัยไซเบอร์": "Cyber Security",
  "ฝ่ายป้องกันทุจริต": "Fraud Prevention"
};
const POLICY_EN = {
  "POL-001": ["Suspicious transaction reporting", "The bank must report suspicious transactions to the regulator within 7 business days of detection."],
  "POL-002": ["Customer and transaction data retention", "The bank must keep customer transaction data for at least 5 years."],
  "POL-003": ["Customer identity verification at account opening", "Account opening requires verification with a national ID card, checked against the central government database."],
  "POL-004": ["Daily transfer limit", "Individual customers may transfer up to 500,000 baht per day through digital channels. Higher amounts need branch manager approval."],
  "POL-005": ["Customer risk review", "The bank must review the risk level of high-risk customers at least once a year."],
  "POL-006": ["IT and cloud outsourcing", "Before using cloud or external IT providers, the bank must assess the risk and get approval from the Risk Management Committee."],
  "POL-007": ["Business continuity plan (BCP)", "The bank must test the BCP for critical systems at least every 2 years."],
  "POL-008": ["Cyber incident reporting", "Serious cyber incidents must be reported to senior management immediately and to the regulator within 72 hours."],
  "POL-009": ["Suspending suspicious transactions and accounts", "The bank may suspend accounts suspected of fraud for up to 7 days and must notify the owner within 3 business days."],
  "POL-010": ["Compliance officer", "The bank must have a compliance officer reporting directly to the Audit Committee."],
  "POL-011": ["Risk reporting to management", "Customer risk review results must be reported to the Risk Management Committee every quarter."],
  "POL-012": ["IT policy review", "The bank must review its IT risk policy at least once a year."]
};

export const ownerName = (owner, lang) => (lang === "en" && OWNER_EN[owner]) || owner;
export function policyText(p, lang) {
  if (lang !== "en" || !POLICY_EN[p.policyId]) return p;
  const [title, text] = POLICY_EN[p.policyId];
  return { ...p, title, text, owner: ownerName(p.owner, lang) };
}

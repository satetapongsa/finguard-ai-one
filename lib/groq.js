// เรียก Groq (OpenAI-compatible API) จากฝั่ง server เท่านั้น key ไม่ถูกส่งไปที่เบราว์เซอร์
const BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_MODEL = "openai/gpt-oss-120b";

export const groqModel = () => process.env.GROQ_MODEL || DEFAULT_MODEL;
export const groqEnabled = () => Boolean(process.env.GROQ_API_KEY);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function groqChat(body, retries = 2) {
  if (!groqEnabled()) throw Object.assign(new Error("ยังไม่ได้ตั้งค่า GROQ_API_KEY"), { status: 503 });
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: groqModel(), temperature: 0.1, ...(groqModel().startsWith("openai/gpt-oss") && { reasoning_effort: "low" }), ...body })
  });
  // ติด rate limit ของ free tier: รอตามที่ Groq บอกแล้วลองใหม่
  if (res.status === 429 && retries > 0) {
    await sleep(Math.min(30, Number(res.headers.get("retry-after")) || 10) * 1000);
    return groqChat(body, retries - 1);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Groq ตอบกลับ ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status === 429 ? 429 : 502, groq: data?.error });
  }
  return data;
}

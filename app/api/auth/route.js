import { currentUser, login, SESSION_COOKIE } from "../../../lib/auth";

export const dynamic = "force-dynamic";
const pub = (u) => u && { id: u.id, name: u.name, nameEn: u.nameEn, role: u.role, dept: u.dept, owner: !!u.owner };

// ผู้ใช้ที่ล็อกอินอยู่
export async function GET() {
  const user = await currentUser().catch(() => null);
  return user ? Response.json(pub(user)) : Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
}

// เข้าสู่ระบบ
export async function POST(req) {
  try {
    const { userId, password } = await req.json().catch(() => ({}));
    const s = await login(userId, password);
    const res = Response.json(pub(s.user));
    res.headers.set("Set-Cookie", `${s.cookie}=${s.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${s.maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return res;
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

// ออกจากระบบ
export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}

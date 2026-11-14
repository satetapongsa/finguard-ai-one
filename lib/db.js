// เก็บสถานะของงานประจำวันเป็น JSON ก้อนเดียว
// มี DATABASE_URL (Neon Postgres) ใช้ฐานข้อมูล ไม่มีใช้ไฟล์ .data/state.json (ตอนรันในเครื่อง)
import { neon } from "@neondatabase/serverless";
import { mkdir, readFile, writeFile } from "fs/promises";

const FILE = ".data/state.json";
const blank = () => ({ notices: {}, results: {}, tasks: [], runs: [] });
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export async function loadState() {
  if (sql) {
    await sql`create table if not exists app_state (id int primary key, data jsonb not null)`;
    const rows = await sql`select data from app_state where id = 1`;
    return rows[0]?.data || blank();
  }
  try { return JSON.parse(await readFile(FILE, "utf8")); } catch { return blank(); }
}

export async function saveState(state) {
  if (sql) {
    await sql`insert into app_state (id, data) values (1, ${JSON.stringify(state)}::jsonb)
              on conflict (id) do update set data = excluded.data`;
    return;
  }
  await mkdir(".data", { recursive: true });
  await writeFile(FILE, JSON.stringify(state, null, 2));
}

// ให้งานประจำวันรันได้ทีละรอบ (cron กับปุ่ม "รันตอนนี้" ชนกันไม่ได้) lock หมดอายุเองใน 6 นาที
let fileLock = 0;
export async function tryLock() {
  if (sql) {
    await sql`create table if not exists app_lock (id int primary key, at timestamptz not null)`;
    const rows = await sql`insert into app_lock (id, at) values (1, now())
                           on conflict (id) do update set at = now() where app_lock.at < now() - interval '6 minutes'
                           returning id`;
    return rows.length > 0;
  }
  if (Date.now() - fileLock < 360_000) return false;
  fileLock = Date.now();
  return true;
}

export async function unlock() {
  if (sql) await sql`delete from app_lock where id = 1`;
  else fileLock = 0;
}

// ---------- ตารางอื่น: ผู้ใช้ (app_user) และไฟล์ PDF ของประกาศ (notice_pdf) ----------
const ready = {};
const table = (name, ddl) => (ready[name] ||= ddl().catch(e => { delete ready[name]; throw e; }));
const usersTable = () => table("user", async () => {
  await sql`create table if not exists app_user (
    id text primary key, name text not null, name_en text not null, role text not null, dept text not null, hash text not null)`;
  await sql`alter table app_user add column if not exists active boolean not null default true,
    add column if not exists fails int not null default 0, add column if not exists locked_until timestamptz,
    add column if not exists email text`;
});
const pdfTable = () => table("pdf", () => sql`create table if not exists notice_pdf (
  pack_id text primary key, data bytea not null, fetched_at timestamptz not null default now())`);

const USERS_FILE = ".data/users.json";
const readUsersFile = async () => { try { return JSON.parse(await readFile(USERS_FILE, "utf8")); } catch { return []; } };
const writeUsersFile = async (users) => { await mkdir(".data", { recursive: true }); await writeFile(USERS_FILE, JSON.stringify(users, null, 2)); };

export async function loadUsers() {
  if (!sql) return readUsersFile();
  await usersTable();
  return sql`select id, name, name_en as "nameEn", role, dept, email, hash, active, fails, locked_until as "lockedUntil" from app_user order by role, id`;
}

// เพิ่มผู้ใช้ใหม่ (มีอยู่แล้วข้าม ไม่ทับรหัสเดิม)
export async function addUsers(users) {
  users = users.map(u => ({ active: true, fails: 0, lockedUntil: null, ...u }));
  if (!sql) {
    const old = await readUsersFile();
    return writeUsersFile([...old, ...users.filter(u => !old.some(o => o.id === u.id))]);
  }
  await usersTable();
  for (const u of users) {
    await sql`insert into app_user (id, name, name_en, role, dept, email, hash) values (${u.id}, ${u.name}, ${u.nameEn}, ${u.role}, ${u.dept}, ${u.email ?? null}, ${u.hash})
              on conflict (id) do nothing`;
  }
}

// แก้เฉพาะช่องที่ส่งมา: hash, active, fails, lockedUntil
export async function updateUser(id, fields) {
  if (!sql) return writeUsersFile((await readUsersFile()).map(u => (u.id === id ? { ...u, ...fields } : u)));
  await usersTable();
  const has = (k) => k in fields;
  await sql`update app_user set
    hash = case when ${has("hash")} then ${fields.hash ?? null} else hash end,
    active = case when ${has("active")} then ${fields.active ?? null}::boolean else active end,
    fails = case when ${has("fails")} then ${fields.fails ?? null}::int else fails end,
    locked_until = case when ${has("lockedUntil")} then ${fields.lockedUntil ?? null}::timestamptz else locked_until end
    where id = ${id}`;
}

// PDF ส่งผ่าน HTTP เป็น base64 แล้วเก็บเป็น bytea
export async function savePdf(packId, buf) {
  if (!sql) {
    await mkdir(".data/pdf", { recursive: true });
    return writeFile(`.data/pdf/${packId}.pdf`, buf);
  }
  await pdfTable();
  await sql`insert into notice_pdf (pack_id, data) values (${packId}, decode(${buf.toString("base64")}, 'base64')) on conflict (pack_id) do nothing`;
}

export async function loadPdf(packId) {
  if (!sql) { try { return await readFile(`.data/pdf/${packId}.pdf`); } catch { return null; } }
  await pdfTable();
  const rows = await sql`select encode(data, 'base64') as b64 from notice_pdf where pack_id = ${packId}`;
  return rows[0] ? Buffer.from(rows[0].b64, "base64") : null;
}

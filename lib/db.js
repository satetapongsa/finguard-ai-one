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

// รหัสผ่านที่ผู้ใช้ตั้งเอง (เก็บแค่ hash) แยกตารางจาก state จะได้ไม่ชนกับงานประจำวัน
const PW_FILE = ".data/passwords.json";
const readPwFile = async () => { try { return JSON.parse(await readFile(PW_FILE, "utf8")); } catch { return {}; } };

export async function getPasswordHash(userId) {
  if (sql) {
    await sql`create table if not exists app_password (user_id text primary key, hash text not null)`;
    return (await sql`select hash from app_password where user_id = ${userId}`)[0]?.hash || null;
  }
  return (await readPwFile())[userId] || null;
}

export async function setPasswordHash(userId, hash) {
  if (sql) {
    await sql`insert into app_password (user_id, hash) values (${userId}, ${hash})
              on conflict (user_id) do update set hash = excluded.hash`;
    return;
  }
  await mkdir(".data", { recursive: true });
  await writeFile(PW_FILE, JSON.stringify({ ...(await readPwFile()), [userId]: hash }, null, 2));
}

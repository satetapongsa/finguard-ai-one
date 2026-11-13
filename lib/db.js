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

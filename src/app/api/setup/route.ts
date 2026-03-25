import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

let migrationRun = false;

export async function GET() {
  if (migrationRun) {
    return NextResponse.json({ status: "already_run" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const sql = readFileSync(join(process.cwd(), "scripts/setup.sql"), "utf-8");
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await supabase.rpc("exec_sql", { sql: stmt + ";" });
      } catch {
        // Table may already exist — IF NOT EXISTS handles this
      }
    }

    migrationRun = true;
    return NextResponse.json({ status: "ok", statements: statements.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

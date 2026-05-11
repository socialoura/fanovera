import { NextResponse } from "next/server";
import { initDb } from "@/app/lib/db";

export async function GET() {
  try {
    await initDb();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (err) {
    console.error("[init-db]", err);
    return NextResponse.json(
      { error: "Failed to initialize database", detail: String(err) },
      { status: 500 }
    );
  }
}

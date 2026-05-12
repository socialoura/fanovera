import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/app/lib/db";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

import { NextRequest, NextResponse } from "next/server";
import { getPendingSupportCount } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const count = await getPendingSupportCount();
  return NextResponse.json({ count });
}

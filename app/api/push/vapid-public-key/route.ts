import { NextResponse } from "next/server";
import { getPushStatus } from "@/app/lib/push";

export async function GET() {
  const status = getPushStatus();
  if (!status.configured) {
    return NextResponse.json(
      { error: status.reason || "推送功能未启用" },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey: status.publicKey });
}

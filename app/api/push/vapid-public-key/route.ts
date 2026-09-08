import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/app/lib/push";

export async function GET() {
  if (!isPushConfigured) {
    return NextResponse.json(
      { error: "推送功能未启用（缺少 VAPID 配置）" },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

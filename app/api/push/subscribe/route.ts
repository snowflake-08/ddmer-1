import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  isMissingPushTableError,
  PUSH_TABLE_MISSING_HINT,
} from "@/app/lib/push";

interface ParsedSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface SubscriptionLike {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
  subscription?: SubscriptionLike;
}

function parseSubscription(body: unknown): ParsedSubscription | null {
  const candidate = (body ?? {}) as SubscriptionLike;
  const raw = candidate.subscription ?? candidate;
  const endpoint = typeof raw.endpoint === "string" ? raw.endpoint.trim() : "";
  const keys = raw?.keys || {};
  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh.trim() : "";
  const auth = typeof keys.auth === "string" ? keys.auth.trim() : "";

  const valid =
    /^https?:\/\//i.test(endpoint) &&
    endpoint.length <= 2048 &&
    p256dh.length > 0 &&
    p256dh.length <= 1024 &&
    auth.length > 0 &&
    auth.length <= 1024;

  return valid ? { endpoint, p256dh, auth } : null;
}

/** 保存浏览器订阅 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subscription = parseSubscription(body);
    if (!subscription) {
      return NextResponse.json({ error: "订阅数据无效" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        user_agent: userAgent.slice(0, 500),
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        user_agent: userAgent.slice(0, 500),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/push/subscribe error:", err);
    if (isMissingPushTableError(err)) {
      return NextResponse.json(
        { error: PUSH_TABLE_MISSING_HINT },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "保存订阅失败" }, { status: 500 });
  }
}

/** 删除浏览器订阅（用户主动取消） */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const endpoint =
      typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
    if (!endpoint) {
      return NextResponse.json({ error: "缺少 endpoint" }, { status: 400 });
    }
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/push/subscribe error:", err);
    if (isMissingPushTableError(err)) {
      return NextResponse.json(
        { error: PUSH_TABLE_MISSING_HINT },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "取消订阅失败" }, { status: 500 });
  }
}

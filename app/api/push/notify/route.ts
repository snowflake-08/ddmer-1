import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { broadcastPush } from "@/app/lib/push";

/** 管理员手动向所有订阅用户推送一条更新通知 */
export async function POST(req: NextRequest) {
  try {
    const session = (await getCurrentUser(req)) as {
      type?: string;
      username?: string;
    };
    if (session.type !== "user" || !session.username) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    const user = await prisma.user.findUnique({
      where: { username: session.username },
      select: { is_admin: true },
    });
    if (!user?.is_admin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const siteUrl =
      process.env.FRONTEND_ORIGIN || new URL(req.url).origin;
    const url =
      typeof body?.url === "string" && body.url.length <= 500
        ? body.url
        : undefined;

    const result = await broadcastPush(
      {
        title: typeof body?.title === "string" ? body.title : undefined,
        body: typeof body?.body === "string" ? body.body : undefined,
        url,
      },
      siteUrl
    );

    if (!result.configured) {
      return NextResponse.json(
        { error: "推送未启用，请先在服务端配置 VAPID 密钥" },
        { status: 503 }
      );
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "";
    if (errorMessage === "未登录" || errorMessage === "无效的令牌") {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    console.error("POST /api/push/notify error:", err);
    return NextResponse.json({ error: "推送失败" }, { status: 500 });
  }
}

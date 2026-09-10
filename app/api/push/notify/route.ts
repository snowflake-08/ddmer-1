import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/app/lib/admin";
import {
  broadcastPush,
  getPushStatus,
  isMissingPushTableError,
  PUSH_TABLE_MISSING_HINT,
} from "@/app/lib/push";

/** 管理员手动向所有订阅用户推送一条更新通知 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const siteUrl = process.env.FRONTEND_ORIGIN || new URL(req.url).origin;
    const url =
      typeof body?.url === "string" && body.url.length <= 500
        ? body.url
        : undefined;

    // 先检查配置，避免进入发送流程后才因为配置问题报一个看不懂的 500
    const status = getPushStatus();
    if (!status.configured) {
      return NextResponse.json(
        { error: `推送未启用：${status.reason || "缺少 VAPID 配置"}` },
        { status: 503 }
      );
    }

    const result = await broadcastPush(
      {
        title: typeof body?.title === "string" ? body.title : undefined,
        body: typeof body?.body === "string" ? body.body : undefined,
        url,
      },
      siteUrl
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "";
    if (errorMessage === "未登录" || errorMessage === "无效的令牌") {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    // 数据库还没建 push_subscription 表：给出可执行的修复提示
    if (isMissingPushTableError(err)) {
      console.error("POST /api/push/notify missing table:", err);
      return NextResponse.json(
        { error: PUSH_TABLE_MISSING_HINT },
        { status: 503 }
      );
    }
    console.error("POST /api/push/notify error:", err);
    return NextResponse.json(
      { error: `推送失败：${errorMessage || "未知错误"}` },
      { status: 500 }
    );
  }
}

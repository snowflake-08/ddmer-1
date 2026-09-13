import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/app/lib/admin";
import { prisma } from "@/app/lib/prisma";
import {
  getPushStatus,
  isMissingPushTableError,
  PUSH_TABLE_MISSING_HINT,
} from "@/app/lib/push";

/**
 * 后台「更新推送」卡片的状态查询：
 * 是否已启用、未启用时的原因、当前订阅数量。
 * 配置或数据表有问题时也返回 200，方便后台直接把原因展示出来。
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const status = getPushStatus();
    let subscribers: number | null = null;
    let hint: string | null = null;

    if (status.configured) {
      try {
        subscribers = await prisma.pushSubscription.count();
      } catch (err) {
        if (isMissingPushTableError(err)) {
          hint = PUSH_TABLE_MISSING_HINT;
        } else {
          console.error("GET /api/push/status count failed:", err);
          hint = "读取订阅数量失败，请查看服务器日志";
        }
      }
    }

    return NextResponse.json({
      configured: status.configured && hint === null,
      reason: status.reason ?? hint,
      subscribers,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "";
    if (errorMessage === "未登录" || errorMessage === "无效的令牌") {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    console.error("GET /api/push/status error:", err);
    return NextResponse.json({ error: "获取推送状态失败" }, { status: 500 });
  }
}

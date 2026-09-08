import webpush from "web-push";
import { prisma } from "@/app/lib/prisma";

const VAPID_PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || "").trim();
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || "").trim();
const VAPID_SUBJECT = (
  process.env.VAPID_SUBJECT || "mailto:no-reply@example.com"
).trim();

/** 是否已经配置了推送所需的 VAPID 密钥 */
export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isPushConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export interface PushMessage {
  title?: string;
  body?: string;
  /** 点击通知后打开的地址，相对地址基于站点首页解析 */
  url?: string;
}

export interface PushBroadcastResult {
  configured: boolean;
  /** 当前订阅总数 */
  total: number;
  /** 成功送达的数量 */
  sent: number;
  /** 已失效并自动清理的订阅数量 */
  removed: number;
  /** 发送失败的数量 */
  failed: number;
}

function cleanSiteUrl(siteUrl?: string): string {
  if (!siteUrl) return "";
  try {
    const url = new URL(siteUrl);
    return url.origin;
  } catch {
    return siteUrl.replace(/\/+$/, "");
  }
}

function buildPayload(message: PushMessage, siteUrl?: string): string {
  const base = cleanSiteUrl(siteUrl);
  let target = "/";
  if (message.url) {
    if (/^https?:\/\//i.test(message.url)) {
      target = message.url;
    } else if (base) {
      target = `${base}${message.url.startsWith("/") ? "" : "/"}${message.url}`;
    }
  }
  return JSON.stringify({
    title: message.title?.trim() || "站点更新",
    body: message.body?.trim() || "网站有新内容，快来看看吧",
    url: target,
  });
}

/**
 * 向所有已订阅的浏览器发送一条推送。
 * 发送失败且浏览器返回“订阅已失效”（404/410）时自动删除对应记录。
 */
export async function broadcastPush(
  message: PushMessage = {},
  siteUrl?: string
): Promise<PushBroadcastResult> {
  const result: PushBroadcastResult = {
    configured: isPushConfigured,
    total: 0,
    sent: 0,
    removed: 0,
    failed: 0,
  };

  if (!isPushConfigured) return result;

  const subscriptions = await prisma.pushSubscription.findMany({
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  result.total = subscriptions.length;
  if (subscriptions.length === 0) return result;

  const payload = buildPayload(message, siteUrl);

  async function sendOne(sub: {
    id: number;
    endpoint: string;
    p256dh: string;
    auth: string;
  }) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
        { TTL: 60 * 60 * 24 }
      );
      result.sent += 1;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number } | null)?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // 浏览器端已取消订阅或已过期，清理掉这条记录
        await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
        result.removed += 1;
      } else {
        result.failed += 1;
        console.error(
          "push send failed:",
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  // 分批并发发送，避免一次性打满推送服务
  const batchSize = 20;
  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);
    await Promise.all(batch.map(sendOne));
  }

  return result;
}

/** 新文章发布时调用：给订阅用户推送“新文章”通知 */
export async function notifyPostPublished(
  post: { title: string; slug: string; description?: string | null },
  siteUrl?: string
): Promise<PushBroadcastResult> {
  if (!post?.title || !post?.slug) {
    return {
      configured: isPushConfigured,
      total: 0,
      sent: 0,
      removed: 0,
      failed: 0,
    };
  }
  return broadcastPush(
    {
      title: `新文章：${post.title}`,
      body: (post.description || "").slice(0, 80) || "点击查看最新文章",
      url: `/posts/${post.slug}`,
    },
    siteUrl
  );
}

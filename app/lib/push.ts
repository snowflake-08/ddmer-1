import webpush from "web-push";
import { prisma } from "@/app/lib/prisma";

/** VAPID 配置状态（用于后台展示 / 接口提示） */
export interface PushConfigStatus {
  /** 配置是否可用（可用才允许订阅与推送） */
  configured: boolean;
  /** 公钥，仅在可用时返回，供前端订阅使用 */
  publicKey: string;
  /** 不可用时的原因（可直接展示给用户），可用时为 null */
  reason: string | null;
}

const RAW_PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || "").trim();
const RAW_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || "").trim();
const RAW_SUBJECT = (process.env.VAPID_SUBJECT || "").trim();
/** web-push 要求 subject 是 mailto: 或 https:// 地址，为空时兜底一个合法值 */
const VAPID_SUBJECT = RAW_SUBJECT || "mailto:no-reply@example.com";

/** 数据库缺少订阅表时给用户的提示 */
export const PUSH_TABLE_MISSING_HINT =
  "数据库缺少 push_subscription 表：请在服务器执行 `npx prisma db push`（或运行 init.sql 中的建表语句）后重试";

/** 解析 base64 / base64url 字符串，失败返回 null */
function decodeBase64(input: string): Buffer | null {
  if (!input || !/^[A-Za-z0-9_\-+/]+={0,2}$/.test(input)) return null;
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );
    const bytes = Buffer.from(padded, "base64");
    return bytes.length > 0 ? bytes : null;
  } catch {
    return null;
  }
}

function isValidSubject(subject: string): boolean {
  if (/^mailto:.+@.+/i.test(subject)) return true;
  try {
    new URL(subject);
    return true;
  } catch {
    return false;
  }
}

/** 校验密钥/主题，返回原因；一切正常返回 null */
function validateConfig(): string | null {
  if (!RAW_PUBLIC_KEY && !RAW_PRIVATE_KEY) {
    return "未配置 VAPID 密钥（VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY），浏览器订阅通知功能已关闭";
  }
  if (!RAW_PUBLIC_KEY) return "缺少 VAPID_PUBLIC_KEY";
  if (!RAW_PRIVATE_KEY) return "缺少 VAPID_PRIVATE_KEY";

  // 常见误操作：直接复制 .env.example，占位值没替换
  if (/^your[_-]/i.test(RAW_PUBLIC_KEY) || /^your[_-]/i.test(RAW_PRIVATE_KEY)) {
    return "VAPID 密钥还是 .env.example 里的示例占位值，请执行 `pnpm vapid:keys` 生成真实密钥后再填写";
  }

  const publicBytes = decodeBase64(RAW_PUBLIC_KEY);
  if (!publicBytes || publicBytes.length !== 65) {
    return "VAPID_PUBLIC_KEY 格式不正确（应为 65 字节的 base64url 字符串），请用 `pnpm vapid:keys` 重新生成";
  }
  const privateBytes = decodeBase64(RAW_PRIVATE_KEY);
  if (!privateBytes || privateBytes.length !== 32) {
    return "VAPID_PRIVATE_KEY 格式不正确（应为 32 字节的 base64url 字符串），请用 `pnpm vapid:keys` 重新生成";
  }
  if (RAW_SUBJECT && !isValidSubject(RAW_SUBJECT)) {
    return `VAPID_SUBJECT 格式不正确（当前值：${RAW_SUBJECT}），请填写 mailto:you@example.com 或 https://你的域名`;
  }
  return null;
}

/** null = 还未初始化过 web-push */
let vapidReady: boolean | null = null;
let vapidReason: string | null = null;

/**
 * 初始化 web-push 的 VAPID 信息。
 * 注意：这里绝不向外抛错——配置有问题只返回 false，
 * 避免一个可选的推送功能把文章发布等其它接口一起拖垮。
 */
function ensureVapid(): boolean {
  if (vapidReady === true) return true;
  if (vapidReady === false) return false;

  const invalid = validateConfig();
  if (invalid) {
    vapidReady = false;
    vapidReason = invalid;
    return false;
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, RAW_PUBLIC_KEY, RAW_PRIVATE_KEY);
    vapidReady = true;
    vapidReason = null;
    return true;
  } catch (err) {
    vapidReady = false;
    vapidReason = `VAPID 配置无效：${
      err instanceof Error ? err.message : String(err)
    }`;
    console.error("[push] setVapidDetails failed:", err);
    return false;
  }
}

/** 获取当前推送配置状态（不会抛错） */
export function getPushStatus(): PushConfigStatus {
  const configured = ensureVapid();
  return {
    configured,
    publicKey: configured ? RAW_PUBLIC_KEY : "",
    reason: configured ? null : vapidReason,
  };
}

export function getVapidPublicKey(): string {
  return getPushStatus().publicKey;
}

/** 判断错误是否为「订阅表不存在」 */
export function isMissingPushTableError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === "P2021" || code === "P2022") return true;
  const message = err instanceof Error ? err.message : String(err ?? "");
  return (
    /push_subscription/i.test(message) &&
    /(does not exist|不存在|Unknown table)/i.test(message)
  );
}

export interface PushMessage {
  title?: string;
  body?: string;
  /** 点击通知后打开的地址，相对地址基于站点首页解析 */
  url?: string;
}

export interface PushBroadcastResult {
  configured: boolean;
  /** 未启用时的原因，可直接展示 */
  reason: string | null;
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
  const status = getPushStatus();
  const result: PushBroadcastResult = {
    configured: status.configured,
    reason: status.reason,
    total: 0,
    sent: 0,
    removed: 0,
    failed: 0,
  };

  if (!status.configured) return result;

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
        // 浏览器端已取消订阅或已过期，清理掉这条记录（清理失败不影响其它订阅）
        try {
          await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
          result.removed += 1;
        } catch (cleanupErr) {
          result.failed += 1;
          console.error("push subscription cleanup failed:", cleanupErr);
        }
      } else {
        result.failed += 1;
        console.error(
          "push send failed:",
          statusCode ? `[${statusCode}]` : "",
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
    const status = getPushStatus();
    return {
      configured: status.configured,
      reason: status.reason,
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

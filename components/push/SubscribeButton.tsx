"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing } from "lucide-react";

type ButtonState = "idle" | "busy" | "done" | "error";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const cleaned = base64.replace(/=+$/, "");
  const raw = atob(cleaned.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

/** 读取服务端公钥；未开启推送时返回 null 与原因 */
async function fetchVapidKey(): Promise<
  { ok: true; publicKey: string } | { ok: false; reason: string }
> {
  try {
    const resp = await fetch("/api/push/vapid-public-key", {
      cache: "no-store",
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return {
        ok: false,
        reason:
          (typeof data?.error === "string" && data.error) ||
          "站点暂未开启浏览器通知",
      };
    }
    const publicKey =
      typeof data?.publicKey === "string" ? data.publicKey.trim() : "";
    if (!publicKey) return { ok: false, reason: "站点暂未开启浏览器通知" };
    return { ok: true, publicKey };
  } catch {
    return { ok: false, reason: "网络异常，暂时无法开启通知" };
  }
}

/**
 * 极简订阅按钮：打开网站几秒后，若浏览器支持、服务端已开启推送且尚未订阅，
 * 在右下角低调出现，点击即可开启网站更新的浏览器通知。
 * 服务端没有配置 VAPID 时不会出现，避免用户点了必然失败。
 */
export default function SubscribeButton() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<ButtonState>("idle");
  const [errorText, setErrorText] = useState("");
  const aliveRef = useRef(true);
  const vapidKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported) return;

    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    aliveRef.current = true;

    (async () => {
      // 先确认服务端已开启推送，未开启就完全不打扰访客
      const key = await fetchVapidKey();
      if (cancelled) return;
      if (!key.ok) {
        console.info(`[push] 未显示订阅按钮：${key.reason}`);
        return;
      }
      vapidKeyRef.current = key.publicKey;

      try {
        // 提前注册，让后面真正订阅时能立即使用
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // 非 HTTPS 或浏览器不支持时静默关闭
      }
      if (cancelled) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription =
          await registration.pushManager.getSubscription();
        if (cancelled) return;
        // 已订阅或已被用户屏蔽时不再打扰
        if (subscription || Notification.permission === "denied") return;

        if (Notification.permission === "granted") {
          setVisible(true);
        } else {
          delayTimer = setTimeout(() => {
            if (!cancelled && Notification.permission === "default") {
              setVisible(true);
            }
          }, 3500);
        }
      } catch {
        // 获取订阅状态失败（例如环境不支持），静默关闭
      }
    })();

    return () => {
      cancelled = true;
      aliveRef.current = false;
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (state === "busy") return;
    setState("busy");
    setErrorText("");
    try {
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setState("idle");
            setVisible(false);
            return;
          }
        }

        let publicKey = vapidKeyRef.current;
        if (!publicKey) {
          const key = await fetchVapidKey();
          if (!key.ok) throw new Error(key.reason);
          publicKey = key.publicKey;
          vapidKeyRef.current = publicKey;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const subscriptionJson = subscription.toJSON();
      const saveResp = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscriptionJson.keys || {},
        }),
      });
      if (!saveResp.ok) {
        const data = await saveResp.json().catch(() => null);
        throw new Error(
          (typeof data?.error === "string" && data.error) || "保存订阅失败"
        );
      }

      setState("done");
      setTimeout(() => {
        if (aliveRef.current) setVisible(false);
      }, 1600);
    } catch (err) {
      console.error("订阅失败:", err);
      setErrorText(err instanceof Error ? err.message : "开启失败");
      setState("error");
      setTimeout(() => {
        if (aliveRef.current) {
          setState((prev) => (prev === "error" ? "idle" : prev));
        }
      }, 4000);
    }
  }, [state]);

  const shortError =
    errorText.length > 22 ? `${errorText.slice(0, 22)}…` : errorText;

  const label =
    state === "busy"
      ? "正在开启…"
      : state === "done"
        ? "已开启更新提醒"
        : state === "error"
          ? shortError || "开启失败，点击重试"
          : "开启更新提醒";

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.3 }}
          onClick={handleSubscribe}
          title={
            state === "error" && errorText
              ? errorText
              : "网站有更新时通过浏览器通知提醒我"
          }
          aria-label="开启更新提醒"
          className="fixed bottom-6 right-4 z-[70] inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/50 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/90 md:right-6"
        >
          {state === "busy" ? (
            <span className="size-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          ) : state === "done" ? (
            <BellRing className="size-4 text-green-500" />
          ) : (
            <Bell className="size-4" />
          )}
          <span>{label}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

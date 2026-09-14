"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellRing } from "lucide-react";

type ButtonState = "idle" | "busy" | "done" | "error";

function subscriptionHelp(reason: "unsupported" | "denied"): string {
  const ua = navigator.userAgent;
  const appleMobile = /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (appleMobile) {
    return reason === "unsupported"
      ? "iPhone/iPad 需 iOS/iPadOS 16.4 或更新版本。请在 Safari 中添加到主屏幕，再从主屏幕打开网站开启通知。"
      : "通知权限已关闭。请在系统设置 → 通知中找到本站并允许通知，再从主屏幕打开本站重试。";
  }
  const mobile = /Android|HarmonyOS|HUAWEI|HONOR/i.test(ua);
  const mac = /Macintosh|Mac OS X/i.test(ua) || /^Mac/i.test(navigator.platform);
  if (reason === "unsupported") {
    if (mobile) {
      return "当前浏览器不支持订阅。\n1. 在微信、QQ 等应用内，请点右上角菜单，选择“在浏览器中打开”；没有此选项时，复制网址到手机浏览器。\n2. 更新手机浏览器后重试；仍不支持可尝试最新版 Edge 或 Firefox。\n3. 点击“开启更新提醒”，选择“允许”。支持情况因手机系统和浏览器而异；仍不可用时可在电脑上订阅。";
    }
    return mac
      ? "当前浏览器不支持订阅。\n1. 在 Mac 上更新 Safari，或使用最新版 Chrome、Edge、Firefox 打开本站。\n2. 使用普通窗口（不要使用无痕窗口）。\n3. 点击“开启更新提醒”，在提示中选择“允许”。无需换用手机。"
      : "当前浏览器不支持订阅。\n1. Windows 用户请复制本站网址，用最新版 Microsoft Edge 打开；也可使用 Chrome 或 Firefox。\n2. 使用普通窗口（不要使用无痕窗口）。\n3. 点击“开启更新提醒”，在提示中选择“允许”。无需换用手机。";
  }
  if (mobile) {
    return "通知权限已关闭。\n1. 在浏览器的本站设置中，将“通知”改为“允许”。\n2. 华为、小米等手机：打开系统设置，搜索“通知”，找到当前浏览器并开启“允许通知”（名称可能因系统版本不同）。\n3. 返回本站刷新，再点“开启更新提醒”。";
  }
  if (mac) {
    const safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua);
    return `通知权限已关闭。\n1. ${safari ? "打开 Safari → 设置 → 网站 → 通知，找到本站并选择“允许”。" : "点击地址栏左侧的网站设置图标，将本站“通知”改为“允许”。"}\n2. 打开 Mac 系统设置 → 通知，允许当前浏览器或本站发送通知。\n3. 返回本站刷新，再点“开启更新提醒”。`;
  }
  return "通知权限已关闭。\n1. 点击地址栏左侧的网站设置图标，将本站“通知”改为“允许”。\n2. Windows 设置 → 系统 → 通知中，开启通知并允许当前浏览器发送通知。\n3. 返回本站刷新，再点“开启更新提醒”。";
}

async function waitForWorker(): Promise<ServiceWorkerRegistration> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("通知服务启动超时，请刷新后重试")), 15000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

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
 * 保留通知入口，权限或兼容性问题在点击时提示。
 */
export default function SubscribeButton() {
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

    let cancelled = false;
    aliveRef.current = true;

    (async () => {
      // Preload the public key without requesting notification permission.
      const key = await fetchVapidKey();
      if (cancelled) return;
      if (!key.ok) {
        return;
      }
      vapidKeyRef.current = key.publicKey;

      try {
        // 提前注册，让后面真正订阅时能立即使用
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        return;
      }
      if (cancelled) return;

      try {
        const registration = await waitForWorker();
        const subscription =
          await registration.pushManager.getSubscription();
        if (cancelled) return;
        // Retain the entry so a failed subscription save can be retried.
        if (subscription) setState("done");
        if (Notification.permission === "denied") {
          setErrorText(subscriptionHelp("denied"));
        }
      } catch {
        // 获取订阅状态失败（例如环境不支持），静默关闭
      }
    })();

    return () => {
      cancelled = true;
      aliveRef.current = false;
    };
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (state === "busy") return;
    setState("busy");
    setErrorText("");
    try {
      if (!window.isSecureContext) throw new Error("请通过 HTTPS 访问网站后开启通知");
      if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
        throw new Error(subscriptionHelp("unsupported"));
      }
      // Safari requires requesting permission directly from the click gesture.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error(permission === "denied"
          ? subscriptionHelp("denied")
          : "尚未允许通知，请再次点击开启更新提醒，并在浏览器的授权提示中选择允许。");
      }
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
      }
      registration = await waitForWorker();

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
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
    } catch (err) {
      console.error("订阅失败:", err);
      setErrorText(err instanceof Error && err.name === "NotSupportedError"
        ? subscriptionHelp("unsupported")
        : err instanceof Error ? err.message : "开启失败");
      setState("error");
      setTimeout(() => {
        if (aliveRef.current) {
          setState((prev) => (prev === "error" ? "idle" : prev));
        }
      }, 4000);
    }
  }, [state]);

  const label =
    state === "busy"
      ? "正在开启…"
      : state === "done"
        ? "已开启更新提醒"
        : state === "error"
          ? "开启失败，点击重试"
          : "开启更新提醒";

  return (
        <div className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[70] max-w-[calc(100vw-2rem)] md:right-6">
        {errorText && <p role="status" className="mb-2 max-h-[50dvh] w-80 max-w-full overflow-y-auto whitespace-pre-line break-words rounded-lg bg-white p-3 text-sm leading-6 text-gray-800 shadow-lg dark:bg-gray-900 dark:text-gray-100">{errorText}</p>}
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
          aria-label={state === "done" ? "已开启更新提醒" : "开启更新提醒"}
          disabled={state === "busy"}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/50 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/90"
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
        </div>
  );
}

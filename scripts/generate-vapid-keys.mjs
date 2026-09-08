/**
 * 生成 Web Push（VAPID）密钥对。
 * 用法：pnpm vapid:keys
 * 输出后请把三行配置复制到 .env
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("请将以下内容复制到 .env：");
console.log("");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_SUBJECT=mailto:you@example.com");

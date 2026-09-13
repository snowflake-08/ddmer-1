import { readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import webpush from "web-push";

// Preserve existing keys: rotating them invalidates existing browser subscriptions.
const file = resolve(process.argv[2] || ".env");
let source = "";
try {
  source = readFileSync(file, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const env = parseEnv(source);
const publicKey = env.VAPID_PUBLIC_KEY?.trim();
const privateKey = env.VAPID_PRIVATE_KEY?.trim();
if (publicKey || privateKey) {
  if (!publicKey || !privateKey) {
    throw new Error("Incomplete VAPID key pair. Restore the matching key before continuing.");
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT || "mailto:no-reply@example.com", publicKey, privateKey);
  console.log("Existing VAPID configuration preserved. No keys changed.");
} else {
  const keys = webpush.generateVAPIDKeys();
  const subject = env.VAPID_SUBJECT || "mailto:no-reply@example.com";
  webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
  appendFileSync(file, `\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_SUBJECT=${subject}\n`, { mode: 0o600 });
  console.log(`VAPID configuration written to ${file}. Private key is not printed.`);
}
console.log("Apply the push_subscription table and restart/redeploy the application to activate push.");

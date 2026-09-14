import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to initialize the push subscription table.");
}

const prisma = new PrismaClient();
try {
  // Add only the optional push table; never synchronize unrelated production tables.
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "push_subscription" (
      "id" SERIAL PRIMARY KEY,
      "endpoint" TEXT NOT NULL UNIQUE,
      "p256dh" TEXT NOT NULL,
      "auth" TEXT NOT NULL,
      "user_agent" TEXT NOT NULL DEFAULT '',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await prisma.pushSubscription.findFirst({
    select: { id: true, endpoint: true, p256dh: true, auth: true, user_agent: true, created_at: true, updated_at: true },
  });
  console.log("Push subscription table is ready.");
} catch (error) {
  console.error("Push table initialization failed. Check database connectivity and CREATE TABLE permission.");
  console.error("Database error code:", error?.code || "unknown");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

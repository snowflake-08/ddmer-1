import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

/**
 * 判断请求者是否是已登录的管理员。
 * 未登录 / 令牌无效时会抛出「未登录」「无效的令牌」，由调用方按 401 处理。
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const session = (await getCurrentUser(request)) as {
    type?: string;
    username?: string;
  };
  if (session.type !== "user" || !session.username) return false;
  const user = await prisma.user.findUnique({
    where: { username: session.username },
    select: { is_admin: true },
  });
  return Boolean(user?.is_admin);
}

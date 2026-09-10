import { http } from "@/utils/http";

export type DashboardStats = {
  counts: {
    posts: number;
    drafts: number;
    categories: number;
    tags: number;
    comments: number;
    messages: number;
    visitors: number;
    totalVisits?: number;
    chatters: number;
    music: number;
    friendLinks: number;
    photos: number;
  };
  post_trend: Array<{ date: string; count: number }>;
  visitor_trend: Array<{ date: string; count: number }>;
  category_distribution: Array<{ name: string; value: number }>;
  browser_distribution: Array<{ name: string; value: number }>;
};

export type WelcomeChartItem = {
  name: string;
  value: number;
  data: number[];
};

export type WelcomeLatestItem = {
  date: string;
  requiredNumber: number;
  resolveNumber: number;
  type: "post" | "chatter";
  title: string;
};

export type WelcomeStats = {
  chartData: WelcomeChartItem[];
  barChartData: Array<{
    requireData: number[];
    questionData: number[];
  }>;
  latestNewsData: WelcomeLatestItem[];
};

/** 获取仪表盘统计数据 */
export const getDashboardStats = () => {
  return http.request<DashboardStats>("get", "/api/dashboard/stats");
};

/** 获取后台首页 / 欢迎页统计 */
export const getWelcomeStats = () => {
  return http.request<WelcomeStats>("get", "/api/dashboard/welcome");
};

export type PushBroadcastResult = {
  configured: boolean;
  reason: string | null;
  total: number;
  sent: number;
  removed: number;
  failed: number;
};

export type PushStatus = {
  configured: boolean;
  reason: string | null;
  subscribers: number | null;
};

/** 手动向所有浏览器订阅用户推送一条更新通知 */
export const sendUpdatePush = (data: { title?: string; body?: string }) => {
  return http.request<PushBroadcastResult>("post", "/api/push/notify", { data });
};

/** 查询浏览器订阅推送的启用状态与订阅人数 */
export const getPushStatus = () => {
  return http.request<PushStatus>("get", "/api/push/status");
};

/** 从请求异常里取出后端返回的可读错误信息（避免只显示“Request failed with status code 503”） */
export function readApiError(err: any, fallback: string): string {
  const data = err?.response?.data;
  const serverMessage =
    (typeof data?.error === "string" && data.error) ||
    (typeof data?.message === "string" && data.message) ||
    "";
  if (serverMessage) return serverMessage;

  const status = err?.response?.status;
  if (status === 401) return "登录状态已失效，请重新登录后再试";
  if (status === 403) return "当前账号没有推送权限（需要使用管理员账号登录）";
  if (status === 404) return "接口不存在：服务器上的程序版本可能还没更新，请重新部署后再试";
  if (status) return `请求失败（HTTP ${status}）`;
  return err?.message || fallback;
}

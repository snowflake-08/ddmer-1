# Ddmer の小站

基于 [Starhiro](https://github.com/Xinghongia) 开源博客项目进行二次开发与个性化修改的个人博客。

## 技术栈

- **前端框架：** Next.js 15 + React 19
- **样式方案：** Tailwind CSS 3
- **UI 组件：** shadcn/ui + Framer Motion
- **设计语言：** Glassmorphism（玻璃拟态）
- **后端集成：** Next.js API Routes + Prisma ORM
- **数据库：** SQLite
- **认证方案：** GitHub OAuth + 匿名用户（JWT）
- **管理后台：** Vue 3 + Element Plus
- **特效系统：** 点击特效、鼠标轨迹、季节特效、星星迸发
- **其他功能：** Live2D 看板娘、网易云音乐播放器、图片懒加载
- **开发语言：** TypeScript

## 功能特性

- 文章发布与管理（Markdown 编辑器）
- 说说/动态发布
- 照片墙与相册管理
- 留言板（支持 GitHub 登录 + 匿名留言）
- 文章评论系统
- 友链管理
- 项目展示
- 收藏夹管理
- 站点配置后台管理
- 音乐播放器
- Live2D 看板娘交互
- 个性化背景与主题
- 浏览器订阅更新通知（Web Push）

## 浏览器订阅通知（可选）

开启后，访客打开网站会在右下角看到一个极简的「开启更新提醒」按钮，
点击即可直接在浏览器订阅；网站发布新文章或你在后台手动推送时，
订阅用户会收到系统通知。

启用步骤：

1. 在数据库中执行建表语句（见 `init.sql` 中的 `push_subscription` 表，
   或对已有数据库执行 `npx prisma db push`）。
2. 运行 `pnpm install` 后执行 `pnpm vapid:keys` 生成密钥。
3. 把生成的 `VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY` 与
   `VAPID_SUBJECT`（形如 `mailto:you@example.com`）填入 `.env`。
4. Vercel 部署需把三个变量添加到项目的 Production 环境，然后重新部署；本地 `.env` 不会自动同步到 Vercel。
   本地或服务器可以执行 `pnpm push:setup` 将新密钥写入 `.env`，已有密钥不会被覆盖。
5. 通知需要 HTTPS（localhost 除外）。iPhone/iPad 需要 iOS 16.4+，在 Safari 中添加到主屏幕后，从主屏幕打开并开启通知。

订阅用户可以在浏览器「网站设置 → 通知」里随时关闭；后台「首页」也有
一个「更新推送」入口，可手动给所有订阅用户发送通知。

### 后台「更新推送」报错怎么办

后台首页的「更新推送」卡片会显示当前状态（已启用 / 未启用 + 原因）和订阅数量，
报错文案直接来自服务端，常见情况：

| 提示 | 原因 | 处理 |
| --- | --- | --- |
| 未配置 VAPID 密钥 / 密钥还是示例占位值 | `.env` 没填，或直接复制了 `.env.example` | 执行 `pnpm vapid:keys` 生成后填入 `.env`，重新部署 |
| 数据库缺少 push_subscription 表 | 数据库没有建表 | 服务器执行 `npx prisma db push`（或运行 `init.sql`） |
| VAPID_SUBJECT 格式不正确 | 只写了邮箱、少了 `mailto:` | 改成 `mailto:you@example.com` |
| 无权限 | 当前登录的不是管理员 | 用管理员账号登录后台 |

通知入口在电脑和手机端保持可见；配置、权限或兼容性问题会给出提示，文章发布等其它功能不受影响。

## 开发

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署

- **Vercel 部署（推荐）：** 参考 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **服务器自建部署：** 参考 [docs/SERVER_DEPLOY.md](./docs/SERVER_DEPLOY.md)（支持 Docker / PM2 两种方式）
- **部署踩坑记录：** [DEPLOY_NOTES.md](./DEPLOY_NOTES.md)

## 相关链接

- **原项目作者 GitHub：** [github.com/Xinghongia](https://github.com/Xinghongia)
- **原项目主页：** [Starhiro の小站](https://hiromu.top)

> 基于开源，致敬原创。

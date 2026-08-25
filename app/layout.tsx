import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/vs2015.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { BackgroundProvider } from "@/components/providers/BackgroundProvider";
import { MusicProvider } from "@/components/providers/MusicProvider";
import { EffectProvider } from "@/components/providers/EffectProvider";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import BackgroundRenderer from "@/components/layout/BackgroundRenderer";
import Navbar from "@/components/layout/Navbar";
import ClientWidgets from "@/components/layout/ClientWidgets";
import ClickEffect from "@/components/ui/ClickEffect";
import RadialMenu from "@/components/ui/RadialMenu";
import MouseTrail from "@/components/ui/MouseTrail";
import SeasonalEffect from "@/components/ui/SeasonalEffect";
import KiraSparkle from "@/components/ui/KiraSparkle";
import WelcomeScreen from "@/components/layout/WelcomeScreen";
import VisitorTracker from "@/components/layout/VisitorTracker";
import { getDbSiteConfig } from "@/app/lib/site-config-db";
import { siteConfig } from "@/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const dbConfig = await getDbSiteConfig();
    return {
      title: dbConfig.title || siteConfig.title,
      description: dbConfig.bio || siteConfig.bio,
      alternates: {
        types: {
          "application/rss+xml": "/feed",
        },
      },
    };
  } catch {
    return {
      title: siteConfig.title,
      description: siteConfig.bio,
      alternates: {
        types: {
          "application/rss+xml": "/feed",
        },
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let dbConfig: Record<string, string> = {};
  try {
    dbConfig = await getDbSiteConfig();
  } catch {
    // fallback to empty, Provider will use siteConfig fallback
  }

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifSC.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <SiteConfigProvider initialConfig={dbConfig}>
          <ThemeProvider>
            <EffectProvider>
              <WelcomeScreen />
              <BackgroundProvider>
                <MusicProvider>
                  <ToastProvider>
                    <BackgroundRenderer />
                    <VisitorTracker />
                    <ClickEffect />
                    <RadialMenu />
                    <MouseTrail />
                    <SeasonalEffect />
                    <KiraSparkle />
                    <Navbar />
                    <main className="flex-1 pt-16">
                      {children}
                    </main>
                    <ClientWidgets />
                  </ToastProvider>
                </MusicProvider>
              </BackgroundProvider>
            </EffectProvider>
          </ThemeProvider>
        </SiteConfigProvider>
        <a href="https://icp.gov.moe/?keyword=20260356" target="_blank">萌ICP备20260356号</a>
       <div id="global-follow-btn" style={{
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: 9999,
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(14px)',
  borderRadius: '20px',
  padding: '14px 20px',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease'
}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
    <span style={{fontSize: '22px'}}>🔔</span>
    <span style={{fontSize: '14px', color: '#2c3e50', fontWeight: 500}}>关注此网站以后续收到更新推送通知</span>
  </div>
</div>

<script dangerouslySetInnerHTML={{
  __html: `
document.addEventListener('DOMContentLoaded', function(){
  // 先把原来点不动的原生提示条直接隐藏掉
  const oldTip = document.querySelector('div:has(> span:contains("关注此网站以后续收到更新推送通知"))')
  if(oldTip) oldTip.style.display = 'none'

  // 自己创建全新的可点击铃铛按钮
  const bellBtn = document.createElement('div')
  bellBtn.style.cssText = "position: fixed; bottom: 24px; right: 24px; z-index: 99999; padding: 12px 20px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; gap: 8px;"
  bellBtn.innerHTML = "🔔"
  document.body.appendChild(bellBtn)
  
  const panel = document.createElement('div')
  panel.style.cssText = "position: fixed; bottom: 90px; right: 24px; z-index: 100000; padding: 24px; background: white; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); display: none; flex-direction: column; gap: 16px; width: 280px;"
  
  const notifyBtn = document.createElement('button')
  notifyBtn.style.cssText = "padding: 14px; background: #12B7F5; color: white; border-radius: 12px; text-align: center; border: none; cursor: pointer; font-size: 16px;"
  notifyBtn.innerText = '🔔 开启浏览器更新通知'
  notifyBtn.onclick = async function(){
    if (!('Notification' in window)) {
      alert('你的浏览器不支持原生通知功能，可以换用Chrome/Edge等主流浏览器打开')
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification('订阅成功🎉', {
        body: '之后博客更新你会第一时间收到浏览器推送通知，不用手动刷新网站',
        icon: 'https://snowflake-06.cn/favicon.ico'
      })
      alert('✅ 浏览器更新通知已成功开启！之后有新文章会直接推送到你的桌面')
    } else {
      alert('你拒绝了通知权限，可以在浏览器设置里手动开启本站通知权限')
    }
  }

  const copyBtn = document.createElement('button')
  copyBtn.innerText = '📋 复制RSS订阅链接'
  copyBtn.style.cssText = "padding: 14px; background: #6366F1; color: white; border-radius: 12px; border: none; cursor: pointer; font-size: 16px;"
  copyBtn.onclick = function() {
    navigator.clipboard.writeText("https://snowflake-06.cn/feed")
    alert("订阅链接已经复制到剪贴板，你可以粘贴到任意RSS阅读器里完成订阅")
  }

  panel.appendChild(notifyBtn)
  panel.appendChild(copyBtn)
  document.body.appendChild(panel)

  let isPanelOpen = false
  bellBtn.addEventListener('click', function (e) {
    e.stopPropagation()
    isPanelOpen = !isPanelOpen
    panel.style.display = isPanelOpen ? 'flex' : 'none'
  })
  bellBtn.addEventListener('touchstart', function (e) {
    e.preventDefault()
    e.stopPropagation()
    isPanelOpen = !isPanelOpen
    panel.style.display = isPanelOpen ? 'flex' : 'none'
  })

  document.addEventListener('click', function () {
    isPanelOpen = false
    panel.style.display = 'none'
  })

  panel.addEventListener('click', function (e) {
    e.stopPropagation()
  })
})
`
}} />


      </body>
    </html>
  );
}

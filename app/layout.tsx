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
       <div 
  id="global-follow-btn"
  style={{
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 99999,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(14px)',
    borderRadius: '20px',
    padding: '14px 20px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }}
>
  <span style={{fontSize: '22px'}}>🔔</span>
  <span style={{fontSize: '14px', color: '#2c3e50', fontWeight: 500}}></span>
</div>

<div 
  id="bell-subscribe-panel"
  style={{
    position: 'fixed',
    bottom: '90px',
    right: '24px',
    zIndex: 100000,
    padding: '24px',
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    display: 'none',
    flexDirection: 'column',
    gap: '16px',
    width: '280px'
  }}
>
  <button
    id="notify-btn"
    style={{
      padding: '14px',
      background: '#12B7F5',
      color: 'white',
      borderRadius: '12px',
      textAlign: 'center',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px'
    }}
  >
    🔔 开启浏览器更新通知
  </button>

  <button
    id="rss-copy-btn"
    style={{
      padding: '14px',
      background: '#6366F1',
      color: 'white',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px'
    }}
  >
    📋 复制RSS订阅链接
  </button>
</div>

<script dangerouslySetInnerHTML={{
  __html: `
(function initBell() {
  // 先把页面上所有右下角的铃铛元素全部删掉，避免冲突
  document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
    if(el.innerHTML.includes('🔔') || el.innerHTML.includes('铃铛')) el.remove()
  })

  // 直接生成绝对不会被遮挡的铃铛
  const bellBtn = document.createElement('div')
  bellBtn.style.cssText = "position: fixed; bottom: 24px; right: 24px; z-index: 9999999; width: 60px; height: 60px; background: white; border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.15); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 28px;"
  bellBtn.innerText = "🔔"
  document.body.appendChild(bellBtn)

  // 生成订阅面板
  const panel = document.createElement('div')
  panel.style.cssText = "position: fixed; bottom: 100px; right: 24px; z-index: 9999999; padding: 24px; background: white; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); display: none; flex-direction: column; gap: 16px; width: 280px;"
  
  const notifyBtn = document.createElement('button')
  notifyBtn.style.cssText = "padding: 14px; background: #12B7F5; color: white; border-radius: 12px; border: none; cursor: pointer; font-size: 16px;"
  notifyBtn.innerText = '开启浏览器更新通知'
  notifyBtn.onclick = async function(e){
    e.stopPropagation()
    if (!('Notification' in window)) {
      alert('你的浏览器不支持原生通知功能')
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification('订阅成功', {body: '之后博客更新会第一时间推送给你'})
      alert('订阅成功')
    }
  }

  const copyBtn = document.createElement('button')
  copyBtn.style.cssText = "padding: 14px; background: #6366F1; color: white; border-radius: 12px; border: none; cursor: pointer; font-size: 16px;"
  copyBtn.innerText = '复制RSS订阅链接'
  copyBtn.onclick = function(e) {
    e.stopPropagation()
    navigator.clipboard.writeText("https://snowflake-06.cn/feed")
    alert("链接已复制")
  }

  panel.appendChild(notifyBtn)
  panel.appendChild(copyBtn)
  document.body.appendChild(panel)

  // 直接绑定点击事件，没有任何延迟
  bellBtn.onclick = function(e) {
    e.stopPropagation()
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none'
  }

  document.addEventListener('click', function() {
    panel.style.display = 'none'
  })
  panel.onclick = function(e) {e.stopPropagation()}
})()
`
}} />

      </body>
    </html>
  );
}

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
          {/* 密码验证层 密码0615 完全隐藏后台网站内容 */}
  <div 
    className="password-overlay" 
    id="passwordOverlay" 
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      // 改成100%不透明纯白色，完全挡住后面所有网站内容
      background: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999
    }}
  >
    <div 
      className="password-box" 
      style={{
        background: '#ffffff',
        padding: '40px 50px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        minWidth: '320px'
      }}
    >
      <h2 style={{ color: '#333', marginBottom: '25px', fontWeight: 500 }}>请输入密码</h2>
      <input 
        id="pwdInput" 
        type="password" 
        maxLength={4} 
        placeholder="四位生日"
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '18px',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          textAlign: 'center',
          // 强制密码字符显示为圆点，完全隐藏输入的数字
          WebkitTextSecurity: 'disc',
          letterSpacing: '8px',
          outline: 'none'
        }}
      />
      <button 
        id="confirmBtn"
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '12px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        确认进入
      </button>
      <div 
        id="errorTip" 
        style={{
          marginTop: '15px',
          color: '#ef4444',
          fontSize: '14px',
          display: 'none'
        }}
      >
        密码错误，请重新输入
      </div>
    </div>
  </div>
  <script 
    dangerouslySetInnerHTML={{
      __html: `
        const CORRECT_PWD = "0615";
        const overlay = document.getElementById('passwordOverlay');
        const pwdInput = document.getElementById('pwdInput');
        const confirmBtn = document.getElementById('confirmBtn');
        const errorTip = document.getElementById('errorTip');

        confirmBtn.addEventListener('click', checkPassword);
        pwdInput.addEventListener('keydown', (e) => {
          if(e.key === 'Enter') checkPassword();
        })

        function checkPassword() {
          if(pwdInput.value === CORRECT_PWD) {
            overlay.style.display = 'none';
            localStorage.setItem('siteAuth', 'passed');
          } else {
            errorTip.style.display = 'block';
            pwdInput.value = '';
            pwdInput.focus();
          }
        }

        if(localStorage.getItem('siteAuth') === 'passed') {
          overlay.style.display = 'none';
        }
      `
    }}
  />
  {/* 密码验证代码结束 */}

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
      </body>
    </html>
  );
}

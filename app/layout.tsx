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
        <div className="w-full text-center">
  <a
  href="https://beian.miit.gov.cn/"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block px-3 py-1 rounded-lg text-xs no-underline transition-all duration-300 backdrop-blur-md bg-white/5 text-gray-300 dark:text-gray-300"
>
  萌ICP备20260356号
</a>
<span className="mx-2 text-gray-400 dark:text-gray-400">|</span>
<a
  href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=2026010415"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block px-3 py-1 rounded-lg text-xs no-underline transition-all duration-300 backdrop-blur-md bg-white/5 text-gray-300 dark:text-gray-300"
>
  黑ICP备2026010415号-1
</a>


</div>

      </body>
    </html>
  );
}

'use client'
export default function SubscribePage() {
  const rssUrl = encodeURIComponent("https://snowflake-06.cn/feed")
  const siteTitle = encodeURIComponent("第三片雪花の小站")

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      background: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(14px)"
    }}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        background: "white",
        borderRadius: "24px",
        padding: "40px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)"
      }}>
        <h1 style={{fontSize: "28px", marginBottom: "12px", textAlign: "center"}}>🔔 一键订阅本站更新</h1>
        <p style={{fontSize: "16px", color: "#666", marginBottom: "32px", textAlign: "center"}}>
          点一下对应按钮，就能自动在你常用的工具里完成订阅
        </p>

        <div style={{display: "grid", gap: "16px", marginBottom: "32px"}}>
          <a 
            href={`https://sspai.com/feed/add?feed=${rssUrl}`}
            target="_blank"
            style={{
              display: "block",
              padding: "16px",
              background: "#2563eb",
              color: "white",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 500
            }}
          >
            📱 用 少数派 直接订阅
          </a>

          <a 
            href={`https://www.inoreader.com/?add_feed=${rssUrl}`}
            target="_blank"
            style={{
              display: "block",
              padding: "16px",
              background: "#f97316",
              color: "white",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 500
            }}
          >
            📚 用 Inoreader 直接订阅
          </a>

          <a 
            href={`https://feedly.com/i/subscription/feed/${rssUrl}`}
            target="_blank"
            style={{
              display: "block",
              padding: "16px",
              background: "#22c55e",
              color: "white",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 500
            }}
          >
            📰 用 Feedly 直接订阅
          </a>

          <a 
            href={`https://weread.qq.com/web/search/subscribe?url=${rssUrl}&title=${siteTitle}`}
            target="_blank"
            style={{
              display: "block",
              padding: "16px",
              background: "#07c160",
              color: "white",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 500
            }}
          >
            📖 用 微信读书 直接订阅
          </a>

          <button 
            onClick={() => {
              navigator.clipboard.writeText("https://snowflake-06.cn/feed")
              alert("订阅链接已经复制到剪贴板，你可以粘贴到任意RSS阅读器里完成订阅")
            }}
            style={{
              padding: "16px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 500
            }}
          >
            📋 手动复制订阅链接
          </button>
        </div>

        <div style={{textAlign: "center"}}>
          <a 
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 32px",
              background: "#f3f4f6",
              color: "#374151",
              borderRadius: "12px",
              textDecoration: "none"
            }}
          >
            返回网站首页
          </a>
        </div>
      </div>
    </div>
  )
}

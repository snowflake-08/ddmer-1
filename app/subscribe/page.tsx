'use client'
export default function SubscribePage() {
  const rssUrl = encodeURIComponent("https://snowflake-06.cn/feed")
  const siteTitle = encodeURIComponent("第三片雪花の小站")
  const qqSubscribeUrl = `https://mail.qq.com/cgi-bin/rss_add?url=${rssUrl}&title=${siteTitle}`

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
        maxWidth: "500px",
        width: "100%",
        background: "white",
        borderRadius: "24px",
        padding: "40px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)"
      }}>
        <h1 style={{fontSize: "28px", marginBottom: "12px", textAlign: "center"}}>🔔 订阅本站更新</h1>
        <p style={{fontSize: "16px", color: "#666", marginBottom: "32px", textAlign: "center"}}>
          点一下对应按钮，就能快速完成订阅
        </p><p style={{fontSize: "14px", color: "#888", textAlign: "center", marginBottom: "24px"}}>
登录QQ邮箱后直接进入订阅确认页，点一下就能完成，后续更新自动发邮件提醒
</p>

        <div style={{display: "grid", gap: "16px", marginBottom: "32px"}}>
          <a 
            
            target="_blank"
            style={{
              display: "block",
              padding: "16px",
              background: "#12B7F5",
              color: "white",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 500
            }}
          >
            📧 用 QQ邮箱 直接订阅
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

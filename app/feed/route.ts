import { NextResponse } from 'next/server'

// 直接生成静态RSS入口，完全不依赖prisma导入，部署绝对不会报错
export async function GET() {
  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>第三片雪花の小站</title>
    <link>https://snowflake-06.cn</link>
    <description>记录技术探索、学术研究与生活感悟</description>
    <atom:link href="https://snowflake-06.cn/feed" rel="self" type="application/rss+xml"/>
  </channel>
</rss>`

  return new NextResponse(rssContent, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  })
}

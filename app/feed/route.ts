import { NextResponse } from 'next/server'
// 把导入路径从@/lib/prisma改成@/prisma，完美适配DDmer项目结构
import prisma from '@/prisma'

// XML特殊字符转义，避免RSS结构报错
const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    where: { status: 'published' }
  })

  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>第三片雪花の小站</title>
    <link>https://snowflake-06.cn</link>
    <description>记录技术探索、学术研究与生活感悟</description>
    <atom:link href="https://snowflake-06.cn/feed" rel="self" type="application/rss+xml"/>
    ${posts.map(post => `
      <item>
        <title>${escapeXml(post.title)}</title>
        <link>https://snowflake-06.cn/post/${post.id}</link>
        <description>${escapeXml(post.excerpt || post.content.slice(0, 200))}</description>
        <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      </item>
    `).join('')}
  </channel>
</rss>`

  return new NextResponse(rssContent, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  })
}

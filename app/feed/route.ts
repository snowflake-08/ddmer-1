import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const posts = await prisma.post.findMany({
    // 移除take数量限制，拉取所有已发布文章
    orderBy: { createdAt: 'desc' },
    where: { status: 'published' } // 只取已发布的公开文章
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
        <title>${post.title}</title>
        <link>https://snowflake-06.cn/post/${post.id}</link>
        <description>${post.excerpt || post.content.slice(0, 200)}</description>
        <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      </item>
    `).join('')}
  </channel>
</rss>`

  return new NextResponse(rssContent, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  })
}

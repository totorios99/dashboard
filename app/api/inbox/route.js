import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db.js'

export async function GET() {
  const items = await prisma.inboxItem.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(req) {
  const { text, tag = 'general' } = await req.json()
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 })
  }
  const item = await prisma.inboxItem.create({ data: { text: text.trim(), tag } })
  return NextResponse.json(item)
}

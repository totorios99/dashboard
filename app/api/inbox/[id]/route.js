import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db.js'

export async function PATCH(req, { params }) {
  const { id } = await params
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 })
  const item = await prisma.inboxItem.update({
    where: { id: Number(id) },
    data:  { text: text.trim() },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req, { params }) {
  const { id } = await params
  try {
    await prisma.inboxItem.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

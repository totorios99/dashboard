import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db.js'
import { currentWeekKey } from '@/lib/vault.js'

export async function PATCH(req, { params }) {
  const { index } = await params
  const body    = await req.json()
  const weekKey = currentWeekKey()

  const items = await prisma.weeklyItem.findMany({
    where:   { weekKey },
    orderBy: { pos: 'asc' },
  })
  const item = items[Number(index)]
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const data = {}
  if (body.status !== undefined) data.status = body.status
  if (body.label  !== undefined) data.label  = body.label.trim()

  await prisma.weeklyItem.update({ where: { id: item.id }, data })
  return NextResponse.json({ ok: true })
}

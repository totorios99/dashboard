import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db.js'
import { currentWeekKey, defaultWeeklyItems } from '@/lib/vault.js'

async function getOrCreateWeek() {
  const weekKey = currentWeekKey()
  const existing = await prisma.weeklyItem.findMany({
    where:   { weekKey },
    orderBy: { pos: 'asc' },
  })
  if (existing.length > 0) return { weekKey, items: existing }

  const defaults = defaultWeeklyItems()
  await prisma.weeklyItem.createMany({
    data: defaults.map((item, i) => ({ weekKey, label: item.label, status: item.status, pos: i })),
  })
  const created = await prisma.weeklyItem.findMany({ where: { weekKey }, orderBy: { pos: 'asc' } })
  return { weekKey, items: created }
}

export async function GET() {
  const data = await getOrCreateWeek()
  return NextResponse.json(data)
}

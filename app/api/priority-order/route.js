import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db.js'
import { config } from '@/vault.config.js'

const SETTING_KEY = 'priority_order'

export async function GET() {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } })
  const order = row ? JSON.parse(row.value) : config.vaults.map(v => v.id)
  return NextResponse.json({ order })
}

export async function PATCH(req) {
  const { order } = await req.json()
  await prisma.setting.upsert({
    where:  { key: SETTING_KEY },
    update: { value: JSON.stringify(order) },
    create: { key: SETTING_KEY, value: JSON.stringify(order) },
  })
  return NextResponse.json({ ok: true })
}

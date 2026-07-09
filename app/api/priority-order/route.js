import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db.js'
import { config } from '@/vault.config.js'
import fs from 'fs'
import path from 'path'

const SETTING_KEY = 'priority_order'

async function getOrder() {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } })
  if (row) return JSON.parse(row.value)

  // One-time migration from cockpit.config.json
  const legacyPath = path.join(process.cwd(), 'cockpit.config.json')
  if (fs.existsSync(legacyPath)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))
      if (Array.isArray(legacy.order)) return legacy.order
    } catch { /* fall through */ }
  }

  return config.vaults.map(v => v.id)
}

export async function GET() {
  const order = await getOrder()
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

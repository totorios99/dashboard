import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db.js'
import fs from 'fs'
import path from 'path'
import { config } from '@/vault.config.js'

// One-time migration: import inbox.json into DB if DB is empty
async function maybeImportLegacy() {
  const count = await prisma.inboxItem.count()
  if (count > 0) return
  const legacyPath = path.join(config.centralVault, '00-COCKPIT', 'Inbox', 'inbox.json')
  if (!fs.existsSync(legacyPath)) return
  try {
    const items = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))
    if (!Array.isArray(items) || items.length === 0) return
    await prisma.inboxItem.createMany({
      data: items.map(i => ({
        text:      i.text || '',
        tag:       i.tag || 'general',
        createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
      })),
    })
  } catch { /* non-fatal */ }
}

export async function GET() {
  await maybeImportLegacy()
  const items = await prisma.inboxItem.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(req) {
  const { text, tag = 'general' } = await req.json()
  const item = await prisma.inboxItem.create({ data: { text, tag } })
  return NextResponse.json(item)
}

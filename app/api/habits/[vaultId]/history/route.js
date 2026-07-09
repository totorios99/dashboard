import { NextResponse } from 'next/server'
import { config } from '@/vault.config.js'
import { prisma } from '@/lib/db.js'
import { readJson, habitHistoryPath } from '@/lib/vault.js'
import fs from 'fs'

async function maybeImportLegacy(vaultId, vault) {
  const count = await prisma.habitHistory.count({ where: { vaultId } })
  if (count > 0) return
  const histPath = habitHistoryPath(vault)
  if (!fs.existsSync(histPath)) return
  try {
    const history = readJson(histPath, {})
    const rows = []
    for (const [date, habits] of Object.entries(history)) {
      for (const [habitKey, value] of Object.entries(habits)) {
        rows.push({ vaultId, date, habitKey, value: Boolean(value) })
      }
    }
    if (rows.length > 0) await prisma.habitHistory.createMany({ data: rows, skipDuplicates: true })
  } catch { /* non-fatal */ }
}

export async function GET(_req, { params }) {
  const { vaultId } = await params
  const vault = config.vaults.find(v => v.id === vaultId)
  if (!vault) return NextResponse.json({ error: 'Vault not found' }, { status: 404 })

  await maybeImportLegacy(vaultId, vault)

  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const rows = await prisma.habitHistory.findMany({
    where: { vaultId, date: { in: days } },
  })

  const allKeys = new Set(rows.map(r => r.habitKey))
  const result = {}
  for (const key of allKeys) {
    result[key] = days.map(day => {
      const row = rows.find(r => r.date === day && r.habitKey === key)
      return row ? row.value : false
    })
  }

  return NextResponse.json(result)
}

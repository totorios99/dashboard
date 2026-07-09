import { NextResponse } from 'next/server'
import { config } from '@/vault.config.js'
import { readStatus, todayKey } from '@/lib/vault.js'
import { prisma } from '@/lib/db.js'

async function statusWithHabits(vault) {
  const data = readStatus(vault)
  if (!data._found || !data.habits) return data

  const rows = await prisma.habitHistory.findMany({
    where: { vaultId: vault.id, date: todayKey() },
  })

  if (rows.length > 0) {
    const fromDb = Object.fromEntries(rows.map(r => [r.habitKey, r.value]))
    data.habits = { ...data.habits, ...fromDb }
  } else {
    // No SQLite record yet today — reset all to false
    data.habits = Object.fromEntries(Object.keys(data.habits).map(k => [k, false]))
  }

  return data
}

export async function GET() {
  const statuses = await Promise.all(config.vaults.map(statusWithHabits))
  return NextResponse.json(statuses)
}

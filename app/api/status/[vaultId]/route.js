import { NextResponse } from 'next/server'
import { config } from '@/vault.config.js'
import { readStatus, writeStatusField, todayKey } from '@/lib/vault.js'
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
    data.habits = Object.fromEntries(Object.keys(data.habits).map(k => [k, false]))
  }

  return data
}

export async function GET(_req, { params }) {
  const { vaultId } = await params
  const vault = config.vaults.find(v => v.id === vaultId)
  if (!vault) return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  return NextResponse.json(await statusWithHabits(vault))
}

export async function PATCH(req, { params }) {
  const { vaultId } = await params
  const vault = config.vaults.find(v => v.id === vaultId)
  if (!vault) return NextResponse.json({ error: 'Vault not found' }, { status: 404 })

  try {
    const body = await req.json()

    // Write non-habit fields to STATUS.md; habits are SQLite-only
    const nonHabit = Object.fromEntries(Object.entries(body).filter(([k]) => !k.startsWith('habits.')))
    if (Object.keys(nonHabit).length > 0) writeStatusField(vault, nonHabit)

    // Habit toggles → SQLite
    const today = todayKey()
    for (const [key, val] of Object.entries(body)) {
      if (!key.startsWith('habits.')) continue
      const habitKey = key.slice(7)
      await prisma.habitHistory.upsert({
        where:  { vaultId_date_habitKey: { vaultId, date: today, habitKey } },
        update: { value: Boolean(val) },
        create: { vaultId, date: today, habitKey, value: Boolean(val) },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

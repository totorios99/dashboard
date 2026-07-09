import { NextResponse } from 'next/server'
import { config } from '@/vault.config.js'

export async function GET() {
  return NextResponse.json({ ok: true, vaults: config.vaults.map(v => v.id) })
}

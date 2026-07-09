import { NextResponse } from 'next/server'
import { execFile } from 'child_process'

export async function POST(req) {
  const { vault } = await req.json()
  if (!vault || typeof vault !== 'string' || !/^[\w\-. ]+$/.test(vault) || vault.length > 100) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  execFile('xdg-open', [`obsidian://open?vault=${encodeURIComponent(vault)}`])
  return NextResponse.json({ ok: true })
}

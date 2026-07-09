import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { config } from '../vault.config.js'

const app = express()
app.use(cors())
app.use(express.json())

// ── HELPERS ───────────────────────────────────────────────────────────────────

function statusPath(vault) {
  return path.join(vault.path, 'STATUS.md')
}

function readStatus(vault) {
  const filePath = statusPath(vault)
  if (!fs.existsSync(filePath)) {
    return { error: `STATUS.md not found at ${filePath}`, vault_id: vault.id }
  }
  try {
    const raw    = fs.readFileSync(filePath, 'utf8')
    const parsed = matter(raw)
    let   data   = { ...parsed.data }

    // Auto-reset habits if it's a new day
    const today = todayKey()
    if (data.habits && typeof data.habits === 'object' && data.habits_date !== today) {
      const reset = Object.fromEntries(Object.keys(data.habits).map(k => [k, false]))
      data.habits      = reset
      data.habits_date = today
      // Write the reset back to STATUS.md so it persists
      const newContent = matter.stringify(parsed.content || '', data)
      fs.writeFileSync(filePath, newContent, 'utf8')
    }

    return {
      ...data,
      vault_id:    vault.id,
      vault_label: vault.label,
      vault_color: vault.color,
      _found:      true,
    }
  } catch (e) {
    return { error: e.message, vault_id: vault.id }
  }
}

function setNestedValue(obj, dotPath, value) {
  const keys = dotPath.split('.')
  if (keys.length === 1) {
    obj[dotPath] = value
    return obj
  }
  const [head, ...tail] = keys
  if (!obj[head] || typeof obj[head] !== 'object') obj[head] = {}
  obj[head] = setNestedValue({ ...obj[head] }, tail.join('.'), value)
  return obj
}

function writeStatusField(vault, updates) {
  const filePath = statusPath(vault)
  if (!fs.existsSync(filePath)) {
    throw new Error(`STATUS.md not found at ${filePath}`)
  }
  const raw     = fs.readFileSync(filePath, 'utf8')
  const parsed  = matter(raw)
  let   data    = { ...parsed.data }

  // Support dot-notation keys e.g. 'habits.study'
  for (const [key, val] of Object.entries(updates)) {
    data = setNestedValue(data, key, val)
  }

  const newContent = matter.stringify(parsed.content || '', data)
  fs.writeFileSync(filePath, newContent, 'utf8')
}

function readJson(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) return defaultValue
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return defaultValue
  }
}

function writeJson(filePath, data) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function habitHistoryPath(vault) {
  return path.join(vault.path, 'habit-history.json')
}

// ── ROUTES ────────────────────────────────────────────────────────────────────

// GET /api/health — confirm server is alive
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, vaults: config.vaults.map(v => v.id) })
})

// GET /api/status — read all STATUS.md files
app.get('/api/status', (_req, res) => {
  const statuses = config.vaults.map(readStatus)
  res.json(statuses)
})

// GET /api/status/:vaultId — read one STATUS.md
app.get('/api/status/:vaultId', (req, res) => {
  const vault = config.vaults.find(v => v.id === req.params.vaultId)
  if (!vault) return res.status(404).json({ error: 'Vault not found' })
  res.json(readStatus(vault))
})

// PATCH /api/status/:vaultId — update fields in one STATUS.md
app.patch('/api/status/:vaultId', (req, res) => {
  const vault = config.vaults.find(v => v.id === req.params.vaultId)
  if (!vault) return res.status(404).json({ error: 'Vault not found' })
  try {
    writeStatusField(vault, req.body)

    // If any habits.X keys were updated, write to habit-history.json too
    const today      = todayKey()
    const histPath   = habitHistoryPath(vault)
    const history    = readJson(histPath, {})
    if (!history[today]) history[today] = {}
    let wroteHistory = false
    for (const [key, val] of Object.entries(req.body)) {
      if (key.startsWith('habits.')) {
        const habitKey          = key.slice(7)   // strip 'habits.'
        history[today][habitKey] = val
        wroteHistory             = true
      }
    }
    if (wroteHistory) writeJson(histPath, history)

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/habits/:vaultId/history — last 7 days per habit key
// Returns { habitKey: [bool×7] } where index 0=6 days ago, index 6=today
app.get('/api/habits/:vaultId/history', (req, res) => {
  const vault = config.vaults.find(v => v.id === req.params.vaultId)
  if (!vault) return res.status(404).json({ error: 'Vault not found' })

  const history = readJson(habitHistoryPath(vault), {})

  // Build the last 7 date keys
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  }

  // Collect all known habit keys across all days
  const allKeys = new Set()
  Object.values(history).forEach(day => Object.keys(day).forEach(k => allKeys.add(k)))

  const result = {}
  for (const key of allKeys) {
    result[key] = days.map(day => !!(history[day] && history[day][key]))
  }

  res.json(result)
})

// GET /api/inbox — read inbox items
app.get('/api/inbox', (_req, res) => {
  const filePath = path.join(config.centralVault, '00-COCKPIT', 'Inbox', 'inbox.json')
  res.json(readJson(filePath, []))
})

// POST /api/inbox — add inbox item
app.post('/api/inbox', (req, res) => {
  const filePath = path.join(config.centralVault, '00-COCKPIT', 'Inbox', 'inbox.json')
  const items    = readJson(filePath, [])
  const newItem  = {
    id:        Date.now(),
    text:      req.body.text,
    tag:       req.body.tag || 'general',
    createdAt: new Date().toISOString(),
  }
  items.unshift(newItem)
  writeJson(filePath, items)
  res.json(newItem)
})

// DELETE /api/inbox/:id — remove inbox item
app.delete('/api/inbox/:id', (req, res) => {
  const filePath = path.join(config.centralVault, '00-COCKPIT', 'Inbox', 'inbox.json')
  const items    = readJson(filePath, [])
  const filtered = items.filter(i => String(i.id) !== req.params.id)
  writeJson(filePath, filtered)
  res.json({ ok: true })
})

// GET /api/weekly — read weekly checklist state
app.get('/api/weekly', (_req, res) => {
  const filePath = path.join(config.centralVault, '00-COCKPIT', 'weekly.json')
  const data     = readJson(filePath, {})
  const today    = new Date()
  const weekKey  = `${today.getFullYear()}-W${String(getWeekNumber(today)).padStart(2, '0')}`
  if (data.weekKey !== weekKey) {
    const reset = { weekKey, items: defaultWeeklyItems() }
    writeJson(filePath, reset)
    return res.json(reset)
  }
  res.json(data)
})

// PATCH /api/weekly/:index — update one checklist item status
app.patch('/api/weekly/:index', (req, res) => {
  const filePath = path.join(config.centralVault, '00-COCKPIT', 'weekly.json')
  const data     = readJson(filePath, { items: defaultWeeklyItems() })
  const idx      = parseInt(req.params.index)
  if (!data.items[idx]) return res.status(404).json({ error: 'Item not found' })
  data.items[idx].status = req.body.status
  writeJson(filePath, data)
  res.json({ ok: true })
})

// GET /api/photos — list available photos
app.get('/api/photos', (_req, res) => {
  if (!config.photosDir || !fs.existsSync(config.photosDir)) {
    console.log('[photos] Dir not found:', config.photosDir)
    return res.json({ photos: [], captions: {}, _debug: { dirExists: false, path: config.photosDir } })
  }
  const exts  = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']
  const all   = fs.readdirSync(config.photosDir)
  const files = all
    .filter(f => !f.startsWith('.') && exts.includes(path.extname(f).toLowerCase()))
    .map(f => `/api/photos/${encodeURIComponent(f)}`)

  console.log('[photos] Dir:', config.photosDir)
  console.log('[photos] All files:', all)
  console.log('[photos] Matched:', files)

  const captionsPath = path.join(config.photosDir, 'captions.json')
  const captions     = readJson(captionsPath, {})
  res.json({ photos: files, captions })
})

// GET /api/photos/:filename — serve a photo file
app.get('/api/photos/:filename', (req, res) => {
  if (!config.photosDir) return res.status(404).send('Photos not configured')
  const filename = decodeURIComponent(req.params.filename)
  const filePath = path.join(config.photosDir, filename)
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found')
  res.sendFile(filePath)
})

// GET /api/priority-order — read saved pillar order
app.get('/api/priority-order', (_req, res) => {
  const filePath = path.join(process.cwd(), 'cockpit.config.json')
  const data     = readJson(filePath, { order: config.vaults.map(v => v.id) })
  res.json(data)
})

// PATCH /api/priority-order — save pillar order
app.patch('/api/priority-order', (req, res) => {
  const filePath = path.join(process.cwd(), 'cockpit.config.json')
  writeJson(filePath, { order: req.body.order })
  res.json({ ok: true })
})

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getWeekNumber(date) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function defaultWeeklyItems() {
  return [
    { label: 'Pillar reviews (3×)',             status: 'pending' },
    { label: 'next_move updated per pillar',     status: 'pending' },
    { label: 'Inbox cleared',                    status: 'pending' },
    { label: 'Journal entries processed',        status: 'pending' },
    { label: 'Active project % honest?',         status: 'pending' },
    { label: 'Branch time-box done',             status: 'pending' },
  ]
}

// ── START ─────────────────────────────────────────────────────────────────────

app.listen(config.serverPort, '0.0.0.0', () => {
  console.log(`\n  Second Brain server running`)
  console.log(`  http://localhost:${config.serverPort}\n`)
  console.log(`  Vaults loaded:`)
  config.vaults.forEach(v => {
    const exists = fs.existsSync(statusPath(v))
    console.log(`  ${exists ? '✓' : '✗'} ${v.label.padEnd(16)} ${statusPath(v)}`)
  })
  console.log('')
})

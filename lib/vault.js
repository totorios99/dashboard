import fs   from 'fs'
import path from 'path'
import matter from 'gray-matter'

export function statusPath(vault) {
  return path.join(vault.path, 'STATUS.md')
}

export function readStatus(vault) {
  const filePath = statusPath(vault)
  if (!fs.existsSync(filePath)) {
    return { error: `STATUS.md not found at ${filePath}`, vault_id: vault.id }
  }
  try {
    const raw    = fs.readFileSync(filePath, 'utf8')
    const parsed = matter(raw)
    let   data   = { ...parsed.data }

    return {
      ...data,
      vault_id:    vault.id,
      vault_label: vault.label,
      vault_color: vault.color,
      vault_name:  path.basename(vault.path),
      _found:      true,
    }
  } catch (e) {
    return { error: e.message, vault_id: vault.id }
  }
}

export function setNestedValue(obj, dotPath, value) {
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

export function writeStatusField(vault, updates) {
  const filePath = statusPath(vault)
  if (!fs.existsSync(filePath)) throw new Error(`STATUS.md not found at ${filePath}`)
  const raw    = fs.readFileSync(filePath, 'utf8')
  const parsed = matter(raw)
  let   data   = { ...parsed.data }
  for (const [key, val] of Object.entries(updates)) {
    data = setNestedValue(data, key, val)
  }
  const newContent = matter.stringify(parsed.content || '', data)
  fs.writeFileSync(filePath, newContent, 'utf8')
}

export function readJson(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) return defaultValue
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return defaultValue
  }
}

export function writeJson(filePath, data) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function habitHistoryPath(vault) {
  return path.join(vault.path, 'habit-history.json')
}

export function getWeekNumber(date) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function defaultWeeklyItems() {
  return [
    { label: 'Pillar reviews (3×)',             status: 'pending' },
    { label: 'next_move updated per pillar',     status: 'pending' },
    { label: 'Inbox cleared',                    status: 'pending' },
    { label: 'Journal entries processed',        status: 'pending' },
    { label: 'Active project % honest?',         status: 'pending' },
    { label: 'Branch time-box done',             status: 'pending' },
  ]
}

export function currentWeekKey() {
  const today   = new Date()
  const weekNum = getWeekNumber(today)
  return `${today.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// Pure helpers shared by client components and server lib — no fs, no 'use client'.

export function getWeekNumber(date) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// immutable deep-set via dot path: setNested(obj, 'habits.reading', true)
export function setNested(obj, dotPath, value) {
  const keys = dotPath.split('.')
  if (keys.length === 1) return { ...obj, [dotPath]: value }
  const [head, ...tail] = keys
  return {
    ...obj,
    [head]: setNested(obj[head] && typeof obj[head] === 'object' ? obj[head] : {}, tail.join('.'), value),
  }
}

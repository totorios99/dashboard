import { HabitPanel } from 'second-brain-cockpit'

const HISTORY_PARTIAL = [false, true, true, false, true, true, false]
const HISTORY_STREAK  = [true, true, true, true, true, true, false]
const HISTORY_EMPTY   = Array(7).fill(false)

const STATUSES_MULTI = [
  {
    vault_id: 'cyber',
    vault_label: 'Cybersecurity',
    vault_color: '#c61a09',
    habits: { study: true, ctf_practice: false, review_notes: true },
    habits_date: '2026-06-16',
  },
  {
    vault_id: 'fitness',
    vault_label: 'Fitness',
    vault_color: '#1D9E75',
    habits: { workout: true, steps: false },
    habits_date: '2026-06-16',
  },
  {
    vault_id: 'spirituality',
    vault_label: 'Spirituality',
    vault_color: '#9F7AEA',
    habits: { meditation: true },
    habits_date: '2026-06-16',
  },
]

const STATUSES_SINGLE = [
  {
    vault_id: 'homelab',
    vault_label: 'Homelab',
    vault_color: '#378ADD',
    habits: { lab_time: true, read_docs: true, experiment: false },
    habits_date: '2026-06-16',
  },
]

export function MultipleVaults() {
  return (
    <div style={{ width: 360, background: 'var(--bg)', padding: 16 }}>
      <HabitPanel statuses={STATUSES_MULTI} onUpdate={() => {}} />
    </div>
  )
}

export function SingleVault() {
  return (
    <div style={{ width: 360, background: 'var(--bg)', padding: 16 }}>
      <HabitPanel statuses={STATUSES_SINGLE} onUpdate={() => {}} />
    </div>
  )
}

export function NoHabits() {
  return (
    <div style={{ width: 360, background: 'var(--bg)', padding: 16 }}>
      <HabitPanel statuses={[{ vault_id: 'cyber', vault_label: 'Cybersecurity', vault_color: '#c61a09' }]} onUpdate={() => {}} />
    </div>
  )
}

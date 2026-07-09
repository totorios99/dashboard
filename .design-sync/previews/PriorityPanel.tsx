import { PriorityPanel } from 'second-brain-cockpit'

const STATUSES = [
  {
    vault_id: 'cyber',
    vault_label: 'Cybersecurity',
    vault_color: '#c61a09',
    quote: 'The quieter you become, the more you can hear.',
    habits: { study: true, ctf_practice: false },
    habits_date: '2026-06-16',
    project_name: 'CTF Prep',
    project_status: 'active',
    project_pct: 65,
    project_next_move: 'Complete web challenge',
    project_milestones: [],
    pillars: ['cyber'],
    project_started: '2026-05-01',
  },
  {
    vault_id: 'fitness',
    vault_label: 'Fitness',
    vault_color: '#1D9E75',
    quote: 'Movement is medicine.',
    habits: { workout: true, steps: true },
    habits_date: '2026-06-16',
    project_name: '5K Training',
    project_status: 'active',
    project_pct: 40,
    project_next_move: 'Long run Sunday',
    project_milestones: [],
    pillars: ['fitness'],
    project_started: '2026-06-01',
  },
  {
    vault_id: 'homelab',
    vault_label: 'Homelab',
    vault_color: '#378ADD',
    quote: 'Build things that matter.',
    habits: { lab_time: false },
    habits_date: '2026-06-16',
    project_name: 'K8s Cluster',
    project_status: 'active',
    project_pct: 30,
    project_next_move: 'Set up Ingress controller',
    project_milestones: [],
    pillars: ['homelab'],
    project_started: '2026-06-10',
  },
]

const ORDER = ['cyber', 'fitness', 'homelab']

export function Default() {
  return (
    <div style={{ width: 360, background: 'var(--bg)', padding: 16 }}>
      <PriorityPanel
        statuses={STATUSES}
        onUpdate={() => {}}
        order={ORDER}
        onReorder={() => {}}
      />
    </div>
  )
}

export function SingleVault() {
  return (
    <div style={{ width: 360, background: 'var(--bg)', padding: 16 }}>
      <PriorityPanel
        statuses={[STATUSES[0]]}
        onUpdate={() => {}}
        order={['cyber']}
        onReorder={() => {}}
      />
    </div>
  )
}

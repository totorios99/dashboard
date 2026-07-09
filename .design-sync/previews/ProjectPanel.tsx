import { ProjectPanel } from 'second-brain-cockpit'

const STATUSES_MILESTONES = [
  {
    vault_id: 'cyber',
    vault_label: 'Cybersecurity',
    vault_color: '#c61a09',
    project_name: 'CTF Prep',
    project_status: 'active',
    project_next_move: 'Complete web exploitation module',
    project_milestones: [
      { label: 'Recon tooling setup', done: true },
      { label: 'Web exploitation module', done: true },
      { label: 'Crypto challenges', done: false },
      { label: 'Reverse engineering basics', done: false },
    ],
    pillars: ['cyber'],
    project_started: '2026-05-01',
  },
  {
    vault_id: 'fitness',
    vault_label: 'Fitness',
    vault_color: '#1D9E75',
    project_name: '5K Training Plan',
    project_status: 'active',
    project_next_move: 'Long run Sunday — 6km at easy pace',
    project_milestones: [
      { label: 'Week 1-2 base mileage', done: true },
      { label: 'Week 3-4 tempo runs', done: false },
      { label: 'Week 5 taper', done: false },
      { label: 'Race day', done: false },
    ],
    pillars: ['fitness'],
    project_started: '2026-06-01',
  },
]

const STATUSES_PERCENT = [
  {
    vault_id: 'homelab',
    vault_label: 'Homelab',
    vault_color: '#378ADD',
    project_name: 'K8s Cluster',
    project_status: 'active',
    project_pct: 30,
    project_next_move: 'Set up Ingress controller and cert-manager',
    project_milestones: [],
    pillars: ['homelab'],
    project_started: '2026-06-10',
  },
  {
    vault_id: 'spirituality',
    vault_label: 'Spirituality',
    vault_color: '#9F7AEA',
    project_name: 'Stoic Reading',
    project_status: 'active',
    project_pct: 60,
    project_next_move: 'Finish Meditations Book IV',
    project_milestones: [],
    pillars: ['spirituality'],
    project_started: '2026-05-15',
  },
]

export function WithMilestones() {
  return (
    <div style={{ width: 360, background: 'var(--bg)', padding: 16 }}>
      <ProjectPanel statuses={STATUSES_MILESTONES} onUpdate={() => {}} />
    </div>
  )
}

export function WithPercent() {
  return (
    <div style={{ width: 360, background: 'var(--bg)', padding: 16 }}>
      <ProjectPanel statuses={STATUSES_PERCENT} onUpdate={() => {}} />
    </div>
  )
}

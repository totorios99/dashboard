// ─────────────────────────────────────────────────────────────────────────────
// vault.config.js — THE ONLY FILE YOU NEED TO CONFIGURE
//
// Set your vault paths and photo folder here.
// Every other file in this project reads from this config.
// When you add a new vault: add one entry to the vaults array. Done.
//
// Docker: set VAULT_ROOT env var to override vault base directory.
// ─────────────────────────────────────────────────────────────────────────────

import { homedir } from 'os'
import { join } from 'path'

const HOME       = homedir()
const VAULT_ROOT = process.env.VAULT_ROOT || join(HOME, 'Documents', 'The Alchemist\'s Atrium')

export const config = {

  // ── SATELLITE VAULTS ───────────────────────────────────────────────────────
  // Each vault must have a STATUS.md at its root.
  // id:    slug used internally — must match STATUS.md vault_id field
  // label: display name in the dashboard
  // path:  absolute path to the vault root folder
  // color: hex color used in the UI for this pillar

  vaults: [
    {
      id:    'cyber',
      label: 'Cybersecurity',
      path:  join(VAULT_ROOT, 'cyber-brain'),
      color: '#c61a09',
    },
    {
      id:    'fitness',
      label: 'Fitness',
      path:  join(VAULT_ROOT, 'fitness-brain'),
      color: '#1D9E75',
    },
    {
      id:    'spirituality',
      label: 'Spirituality',
      path:  join(VAULT_ROOT, 'spirituality-brain'),
      color: '#9F7AEA',
    },
    {
      id:    'homelab',
      label: 'Homelab',
      path:  join(VAULT_ROOT, 'homelab-brain'),
      color: '#378ADD',
    },
  ],

  // ── CENTRAL VAULT ──────────────────────────────────────────────────────────
  centralVault: join(VAULT_ROOT, 'central-brain'),

}

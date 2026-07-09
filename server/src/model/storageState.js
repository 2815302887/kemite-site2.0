import { isDatabaseConfigured, query } from '../db.js'

export async function checkDatabase() {
  if (!isDatabaseConfigured) return { ok: false, reason: 'not_configured' }
  try {
    await query('SELECT 1 AS ok')
    return { ok: true, reason: 'connected' }
  } catch (error) {
    return { ok: false, reason: error.code || 'connection_failed' }
  }
}

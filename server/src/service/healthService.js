import { checkDatabase } from '../model/storageState.js'

export async function getHealth() {
  const database = await checkDatabase()
  return {
    status: 'ok',
    database: database.ok ? 'connected' : database.reason,
    storage: database.ok ? 'mysql' : 'local-json-fallback',
  }
}

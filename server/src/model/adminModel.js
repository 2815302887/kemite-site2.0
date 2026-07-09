import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { query } from '../db.js'
import { checkDatabase } from './storageState.js'

export async function findAdminUser(username, password) {
  const database = await checkDatabase()
  if (database.ok) {
    const users = await query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1',
      [username],
    )
    const dbUser = Array.isArray(users) ? users[0] : null
    if (dbUser && await bcrypt.compare(password, dbUser.password_hash)) {
      return { id: dbUser.id, username: dbUser.username, storage: 'mysql' }
    }
  }

  if (username === env.localAdminUsername && password === env.localAdminPassword) {
    return { id: 1, username: env.localAdminUsername, storage: 'local' }
  }
  return null
}

import mysql from 'mysql2/promise'
import 'dotenv/config'

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME,
  DB_CONNECTION_LIMIT = '10',
} = process.env

export const isDatabaseConfigured = Boolean(DB_NAME)

export const pool = isDatabaseConfigured
  ? mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(DB_CONNECTION_LIMIT),
      queueLimit: 0,
    })
  : null

export async function query(sql, params = []) {
  if (!pool) {
    const error = new Error('Database is not configured')
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }

  const [rows] = await pool.execute(sql, params)
  return rows
}

export async function closePool() {
  await pool?.end()
}

export default pool

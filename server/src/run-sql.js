import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const sqlFilePath = resolve(__dirname, '../sql/init.sql')

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME,
} = process.env

if (!DB_NAME) {
  throw new Error('Missing required environment variable: DB_NAME')
}

function splitSqlStatements(sql) {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}

async function runSqlFile() {
  let connection

  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
    })

    await connection.query(
      'CREATE DATABASE IF NOT EXISTS ?? DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      [DB_NAME],
    )
    await connection.query('USE ??', [DB_NAME])

    const sql = await readFile(sqlFilePath, 'utf8')
    const statements = splitSqlStatements(sql)

    for (const statement of statements) {
      await connection.query(statement)
    }

    console.log(`Database initialized successfully. Executed ${statements.length} statements.`)
  } catch (error) {
    console.error('Failed to initialize database:')
    console.error(error)
    process.exitCode = 1
  } finally {
    await connection?.end()
  }
}

await runSqlFile()

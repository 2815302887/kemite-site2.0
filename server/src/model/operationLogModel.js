import { operationLogsPath } from '../config/paths.js'
import { query } from '../db.js'
import { readJsonFile, writeJsonFile } from '../utils/jsonFile.js'
import { checkDatabase } from './storageState.js'

export async function createOperationLog(log) {
  const record = {
    id: Date.now(),
    admin_id: log.adminId || null,
    admin_username: log.adminUsername || '',
    action: log.action,
    target_type: log.targetType,
    target_id: log.targetId || '',
    detail: log.detail || '',
    created_at: new Date().toISOString(),
  }

  const database = await checkDatabase()
  if (database.ok) {
    try {
      await query(
        `INSERT INTO operation_logs (admin_id, admin_username, action, target_type, target_id, detail)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [record.admin_id, record.admin_username, record.action, record.target_type, record.target_id, record.detail],
      )
      return
    } catch (error) {
      if (error.code !== 'ER_NO_SUCH_TABLE') throw error
    }
  }

  const logs = await readJsonFile(operationLogsPath, [])
  logs.unshift(record)
  await writeJsonFile(operationLogsPath, logs.slice(0, 1000))
}

import path from 'node:path'
import { datasheetsDir } from '../config/paths.js'
import { listDatasheets } from '../model/fileModel.js'

export function getDatasheets() {
  return listDatasheets()
}

export function resolveDatasheet(filename) {
  const safeName = path.basename(String(filename || ''))
  if (!/\.pdf$/i.test(safeName)) return null

  const filepath = path.resolve(path.join(datasheetsDir, safeName))
  if (!filepath.startsWith(path.resolve(datasheetsDir) + path.sep)) return null
  return { filepath, filename: safeName }
}

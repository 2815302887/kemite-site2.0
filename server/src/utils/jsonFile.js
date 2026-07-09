import fs from 'node:fs/promises'
import path from 'node:path'

export async function readJsonFile(filepath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filepath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

export async function writeJsonFile(filepath, value) {
  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await fs.writeFile(filepath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

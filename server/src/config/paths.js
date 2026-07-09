import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const productsPath = path.join(rootDir, 'products.json')
export const productsDataPath = path.join(rootDir, 'public/products-data.js')
export const productImagesDir = path.join(rootDir, 'public/products')
export const datasheetsDir = path.join(rootDir, 'public/datasheets')
export const contactsPath = path.join(rootDir, 'data/contacts.json')
export const operationLogsPath = path.join(rootDir, 'data/operation-logs.json')
export const productsBackupDir = path.join(rootDir, 'backups/products')

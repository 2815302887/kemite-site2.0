import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envArg = process.argv.find((arg) => arg.startsWith('--env='))
const envPath = envArg ? envArg.slice('--env='.length) : '.env.development'

dotenv.config({ path: path.resolve(rootDir, envPath) })

async function readJsonProducts() {
  const raw = await fs.readFile(path.join(rootDir, 'products.json'), 'utf8')
  const products = JSON.parse(raw)
  if (!Array.isArray(products)) throw new Error('products.json must be an array')
  return products
}

function dbConfig() {
  const { DB_HOST = 'localhost', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '', DB_NAME } = process.env
  if (!DB_NAME) throw new Error('DB_NAME is required for comparison')
  return {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  }
}

async function readSqlProducts() {
  const connection = await mysql.createConnection(dbConfig())
  try {
    const [rows] = await connection.execute(`
      SELECT
        p.id,
        p.name,
        p.application,
        p.alloy,
        p.keywords,
        p.summary,
        p.description,
        p.cover_image,
        p.datasheet,
        p.meta,
        p.status,
        GROUP_CONCAT(c.slug ORDER BY pcm.sort_order SEPARATOR ',') AS category_slugs
      FROM products p
      LEFT JOIN product_category_map pcm ON pcm.product_id = p.id
      LEFT JOIN product_categories c ON c.id = pcm.category_id
      WHERE p.status = 1
      GROUP BY p.id
      ORDER BY p.sort_order ASC, p.id ASC
    `)
    const [inactiveRows] = await connection.execute('SELECT COUNT(*) AS count FROM products WHERE status <> 1')
    const products = rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category_slugs ? row.category_slugs.split(',') : [],
      application: row.application || '',
      alloy: row.alloy || '',
      image: row.cover_image || '',
      keywords: row.keywords || '',
      summary: row.summary || '',
      detail: row.description || '',
      meta: typeof row.meta === 'string' ? JSON.parse(row.meta || '[]') : (row.meta || []),
      datasheet: row.datasheet || '',
    }))
    products.inactiveSqlCount = Number(inactiveRows[0].count) || 0
    return products
  } finally {
    await connection.end()
  }
}

function normalizeProduct(product) {
  return {
    id: product.id || '',
    name: product.name || '',
    category: Array.isArray(product.category) ? product.category : [],
    application: product.application || '',
    alloy: product.alloy || '',
    image: product.image || '',
    keywords: product.keywords || '',
    summary: product.summary || '',
    detail: product.detail || '',
    meta: Array.isArray(product.meta) ? product.meta : [],
    datasheet: product.datasheet || '',
  }
}

function compareProducts(jsonProducts, sqlProducts) {
  const jsonMap = new Map(jsonProducts.map((product) => [product.id, normalizeProduct(product)]))
  const sqlMap = new Map(sqlProducts.map((product) => [product.id, normalizeProduct(product)]))
  const missingInSql = []
  const extraInSql = []
  const mismatches = []

  for (const [id, jsonProduct] of jsonMap) {
    const sqlProduct = sqlMap.get(id)
    if (!sqlProduct) {
      missingInSql.push(id)
      continue
    }

    const fields = ['name', 'application', 'alloy', 'image', 'keywords', 'summary', 'detail', 'datasheet']
    const fieldDiffs = fields
      .filter((field) => jsonProduct[field] !== sqlProduct[field])
      .map((field) => ({ field, json: jsonProduct[field], sql: sqlProduct[field] }))

    if (JSON.stringify(jsonProduct.category) !== JSON.stringify(sqlProduct.category)) {
      fieldDiffs.push({ field: 'category', json: jsonProduct.category, sql: sqlProduct.category })
    }
    if (JSON.stringify(jsonProduct.meta) !== JSON.stringify(sqlProduct.meta)) {
      fieldDiffs.push({ field: 'meta', json: jsonProduct.meta, sql: sqlProduct.meta })
    }

    if (fieldDiffs.length > 0) {
      mismatches.push({ id, fields: fieldDiffs })
    }
  }

  for (const id of sqlMap.keys()) {
    if (!jsonMap.has(id)) extraInSql.push(id)
  }

  return {
    jsonCount: jsonProducts.length,
    sqlCount: sqlProducts.length,
    inactiveSqlCount: sqlProducts.inactiveSqlCount || 0,
    missingInSql,
    extraInSql,
    mismatches,
    matched: missingInSql.length === 0 && extraInSql.length === 0 && mismatches.length === 0,
  }
}

async function main() {
  const jsonProducts = await readJsonProducts()
  const sqlProducts = await readSqlProducts()
  const result = compareProducts(jsonProducts, sqlProducts)
  console.log(JSON.stringify(result, null, 2))
  if (!result.matched) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

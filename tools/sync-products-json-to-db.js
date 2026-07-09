import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const execute = args.has('--execute')
const envArg = process.argv.find((arg) => arg.startsWith('--env='))
const envPath = envArg ? envArg.slice('--env='.length) : '.env.development'
const separator = '\u001f'

dotenv.config({ path: path.resolve(rootDir, envPath) })

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function displayNameFromSlug(slug) {
  const known = {
    high: 'High temperature',
    leadfree: 'Lead-free',
    leaded: 'Leaded',
    medium: 'Medium temperature',
    redglue: 'SMT red glue',
    solderpaste: 'Solder paste',
  }
  return known[slug] || String(slug || '').replaceAll('-', ' ')
}

function filenameFromPath(filePath) {
  return path.basename(String(filePath || ''))
}

function dbConfig() {
  const { DB_HOST = 'localhost', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '', DB_NAME } = process.env
  if (!DB_NAME) throw new Error('DB_NAME is required')
  return {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  }
}

async function readJsonProducts() {
  const raw = await fs.readFile(path.join(rootDir, 'products.json'), 'utf8')
  const products = JSON.parse(raw)
  if (!Array.isArray(products)) throw new Error('products.json must be an array')
  return products
}

function normalizeJsonProduct(product, sortOrder) {
  const category = Array.isArray(product.category)
    ? product.category.map((item) => slugify(item)).filter(Boolean)
    : String(product.category || '').split(',').map((item) => slugify(item)).filter(Boolean)

  return {
    id: String(product.id || '').trim(),
    name: product.name || product.id,
    slug: slugify(product.id || product.name),
    category,
    application: product.application || '',
    alloy: product.alloy || '',
    image: product.image || '',
    keywords: product.keywords || '',
    summary: product.summary || '',
    detail: product.detail || '',
    datasheet: product.datasheet || '',
    meta: Array.isArray(product.meta) ? product.meta : [],
    sortOrder,
  }
}

function normalizeSqlProduct(row) {
  return {
    id: row.id || '',
    name: row.name || '',
    category: row.category_slugs ? String(row.category_slugs).split(separator).filter(Boolean) : [],
    application: row.application || '',
    alloy: row.alloy || '',
    image: row.cover_image || '',
    keywords: row.keywords || '',
    summary: row.summary || '',
    detail: row.description || '',
    datasheet: row.datasheet || '',
    meta: typeof row.meta === 'string' ? JSON.parse(row.meta || '[]') : (row.meta || []),
    sortOrder: Number(row.sort_order) || 0,
    status: Number(row.status) || 0,
  }
}

function isSameProduct(jsonProduct, sqlProduct) {
  if (!sqlProduct || sqlProduct.status !== 1) return false
  const scalarFields = ['name', 'application', 'alloy', 'image', 'keywords', 'summary', 'detail', 'datasheet', 'sortOrder']
  if (scalarFields.some((field) => String(jsonProduct[field] || '') !== String(sqlProduct[field] || ''))) return false
  if (JSON.stringify(jsonProduct.category) !== JSON.stringify(sqlProduct.category)) return false
  if (JSON.stringify(jsonProduct.meta) !== JSON.stringify(sqlProduct.meta)) return false
  return true
}

async function readSqlState(connection) {
  const [productRows] = await connection.execute(`
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
      p.sort_order,
      GROUP_CONCAT(c.slug ORDER BY pcm.sort_order, c.id SEPARATOR '${separator}') AS category_slugs
    FROM products p
    LEFT JOIN product_category_map pcm ON pcm.product_id = p.id
    LEFT JOIN product_categories c ON c.id = pcm.category_id
    GROUP BY p.id
  `)
  const [categoryRows] = await connection.execute('SELECT COUNT(*) AS count FROM product_categories')
  const [imageRows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM product_images pi
     INNER JOIN products p ON p.id = pi.product_id
     WHERE p.status = 1`,
  )
  const [documentRows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM product_documents pd
     INNER JOIN products p ON p.id = pd.product_id
     WHERE p.status = 1`,
  )

  return {
    products: productRows.map(normalizeSqlProduct),
    categoryCount: Number(categoryRows[0].count) || 0,
    imageCount: Number(imageRows[0].count) || 0,
    documentCount: Number(documentRows[0].count) || 0,
  }
}

function buildPlan(jsonProducts, sqlState) {
  const normalizedJson = jsonProducts.map((product, index) => normalizeJsonProduct(product, index))
  const jsonIds = new Set(normalizedJson.map((product) => product.id))
  const sqlMap = new Map(sqlState.products.map((product) => [product.id, product]))
  const categories = new Map()
  const images = normalizedJson.filter((product) => product.image)
  const documents = normalizedJson.filter((product) => product.datasheet)

  for (const product of normalizedJson) {
    product.category.forEach((slug, index) => {
      if (!categories.has(slug)) {
        categories.set(slug, {
          slug,
          name: displayNameFromSlug(slug),
          sortOrder: categories.size + index,
        })
      }
    })
  }

  const newProducts = normalizedJson.filter((product) => !sqlMap.has(product.id))
  const updatedProducts = normalizedJson.filter((product) => sqlMap.has(product.id) && !isSameProduct(product, sqlMap.get(product.id)))
  const markInactive = sqlState.products.filter((product) => product.status === 1 && !jsonIds.has(product.id))

  return {
    products: normalizedJson,
    categories: Array.from(categories.values()),
    images,
    documents,
    newProducts,
    updatedProducts,
    markInactive,
  }
}

async function ensureCategory(connection, category) {
  await connection.execute(
    `INSERT INTO product_categories (name, slug, sort_order)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)`,
    [category.name, category.slug, category.sortOrder],
  )
  const [rows] = await connection.execute('SELECT id FROM product_categories WHERE slug = ? LIMIT 1', [category.slug])
  return rows[0]?.id || null
}

async function executeSync(connection, plan) {
  const categoryIds = new Map()

  await connection.beginTransaction()
  try {
    for (const category of plan.categories) {
      const categoryId = await ensureCategory(connection, category)
      if (categoryId) categoryIds.set(category.slug, categoryId)
    }

    for (const product of plan.products) {
      const primaryCategoryId = categoryIds.get(product.category[0]) || null
      await connection.execute(
        `INSERT INTO products
          (id, category_id, name, slug, summary, description, application, alloy, keywords, cover_image, datasheet, meta, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
          category_id = VALUES(category_id),
          name = VALUES(name),
          slug = VALUES(slug),
          summary = VALUES(summary),
          description = VALUES(description),
          application = VALUES(application),
          alloy = VALUES(alloy),
          keywords = VALUES(keywords),
          cover_image = VALUES(cover_image),
          datasheet = VALUES(datasheet),
          meta = VALUES(meta),
          status = 1,
          sort_order = VALUES(sort_order)`,
        [
          product.id,
          primaryCategoryId,
          product.name,
          product.slug,
          product.summary || null,
          product.detail || null,
          product.application || null,
          product.alloy || null,
          product.keywords || null,
          product.image || null,
          product.datasheet || null,
          JSON.stringify(product.meta),
          product.sortOrder,
        ],
      )

      await connection.execute('DELETE FROM product_category_map WHERE product_id = ?', [product.id])
      for (const [index, slug] of product.category.entries()) {
        const categoryId = categoryIds.get(slug)
        if (!categoryId) continue
        await connection.execute(
          `INSERT INTO product_category_map (product_id, category_id, sort_order)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
          [product.id, categoryId, index],
        )
      }

      await connection.execute('DELETE FROM product_images WHERE product_id = ?', [product.id])
      if (product.image) {
        await connection.execute(
          `INSERT INTO product_images (product_id, image_path, alt, sort_order, is_cover)
           VALUES (?, ?, ?, 0, 1)
           ON DUPLICATE KEY UPDATE alt = VALUES(alt), sort_order = VALUES(sort_order), is_cover = VALUES(is_cover)`,
          [product.id, product.image, product.name],
        )
      }

      await connection.execute('DELETE FROM product_documents WHERE product_id = ?', [product.id])
      if (product.datasheet) {
        await connection.execute(
          `INSERT INTO product_documents (product_id, file_path, file_name, file_type, version, sort_order)
           VALUES (?, ?, ?, 'datasheet', NULL, 0)
           ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_type = VALUES(file_type), version = VALUES(version), sort_order = VALUES(sort_order)`,
          [product.id, product.datasheet, filenameFromPath(product.datasheet)],
        )
      }
    }

    for (const product of plan.markInactive) {
      await connection.execute('UPDATE products SET status = 0 WHERE id = ?', [product.id])
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  }
}

function buildReport({ jsonProducts, before, after, plan }) {
  return {
    mode: execute ? 'execute' : 'dry-run',
    jsonProductCount: jsonProducts.length,
    mysqlActiveProductCountBefore: before.products.filter((product) => product.status === 1).length,
    mysqlActiveProductCountAfter: after.products.filter((product) => product.status === 1).length,
    newCount: plan.newProducts.length,
    updateCount: plan.updatedProducts.length,
    markInactiveCount: plan.markInactive.length,
    categoryCount: execute ? after.categoryCount : plan.categories.length,
    imageCount: execute ? after.imageCount : plan.images.length,
    pdfCount: execute ? after.documentCount : plan.documents.length,
    newProductIds: plan.newProducts.map((product) => product.id),
    updatedProductIds: plan.updatedProducts.map((product) => product.id),
    markInactiveProductIds: plan.markInactive.map((product) => product.id),
  }
}

async function main() {
  const jsonProducts = await readJsonProducts()
  const connection = await mysql.createConnection(dbConfig())

  try {
    const before = await readSqlState(connection)
    const plan = buildPlan(jsonProducts, before)

    if (!execute) {
      const report = buildReport({ jsonProducts, before, after: before, plan })
      console.log('[dry-run] No database writes will be performed. Pass --execute to sync MySQL.')
      console.log(JSON.stringify(report, null, 2))
      return
    }

    await executeSync(connection, plan)
    const after = await readSqlState(connection)
    console.log('[execute] products.json has been synchronized to MySQL.')
    console.log(JSON.stringify(buildReport({ jsonProducts, before, after, plan }), null, 2))
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

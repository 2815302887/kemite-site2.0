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
    high: '高温',
    leadfree: '无铅',
    leaded: '有铅',
    medium: '中温',
    redglue: 'SMT 红胶',
    solderpaste: '锡膏',
  }
  return known[slug] || String(slug || '').replaceAll('-', ' ')
}

function filenameFromPath(filePath) {
  return path.basename(String(filePath || ''))
}

function normalizeProducts(products) {
  const categoryMap = new Map()
  const normalizedProducts = []
  const categoryLinks = []
  const images = []
  const documents = []

  products.forEach((product, index) => {
    const categories = Array.isArray(product.category) ? product.category.filter(Boolean) : []
    categories.forEach((categorySlug, categoryIndex) => {
      const slug = slugify(categorySlug)
      if (!slug) return
      if (!categoryMap.has(slug)) {
        categoryMap.set(slug, {
          id: categoryMap.size + 1,
          slug,
          name: displayNameFromSlug(slug),
          sort_order: categoryMap.size,
        })
      }
      categoryLinks.push({
        product_id: product.id,
        category_slug: slug,
        sort_order: categoryIndex,
      })
    })

    const primaryCategory = categories.length > 0 ? categoryMap.get(slugify(categories[0])) : null
    const productSlug = slugify(product.id || product.name)
    normalizedProducts.push({
      id: product.id,
      category_slug: primaryCategory?.slug || null,
      name: product.name || product.id,
      slug: productSlug,
      summary: product.summary || null,
      description: product.detail || null,
      application: product.application || null,
      alloy: product.alloy || null,
      keywords: product.keywords || null,
      cover_image: product.image || null,
      datasheet: product.datasheet || null,
      meta: Array.isArray(product.meta) ? product.meta : null,
      status: 1,
      sort_order: index,
    })

    if (product.image) {
      images.push({
        product_id: product.id,
        image_path: product.image,
        alt: product.name || product.id,
        sort_order: 0,
        is_cover: 1,
      })
    }

    if (product.datasheet) {
      documents.push({
        product_id: product.id,
        file_path: product.datasheet,
        file_name: filenameFromPath(product.datasheet),
        file_type: 'datasheet',
        version: null,
        sort_order: 0,
      })
    }
  })

  return {
    categories: Array.from(categoryMap.values()),
    products: normalizedProducts,
    categoryLinks,
    images,
    documents,
  }
}

async function readProducts() {
  const raw = await fs.readFile(path.join(rootDir, 'products.json'), 'utf8')
  const products = JSON.parse(raw)
  if (!Array.isArray(products)) throw new Error('products.json must be an array')
  return products
}

function printDryRun(plan) {
  console.log('[dry-run] No database writes will be performed. Pass --execute to write data.')
  console.log(JSON.stringify({
    productCount: plan.products.length,
    categoryCount: plan.categories.length,
    imageCount: plan.images.length,
    pdfCount: plan.documents.length,
    categories: plan.categories.map((category) => category.slug),
    products: plan.products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category_slug,
      image: product.cover_image,
      datasheet: product.datasheet,
    })),
  }, null, 2))
}

function dbConfig() {
  const { DB_HOST = 'localhost', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '', DB_NAME } = process.env
  if (!DB_NAME) throw new Error('DB_NAME is required when using --execute')
  return {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: false,
  }
}

async function executeMigration(plan) {
  const connection = await mysql.createConnection(dbConfig())
  const categoryIds = new Map()

  try {
    await connection.beginTransaction()

    for (const category of plan.categories) {
      await connection.execute(
        `INSERT INTO product_categories (name, slug, sort_order)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)`,
        [category.name, category.slug, category.sort_order],
      )
      const [rows] = await connection.execute('SELECT id FROM product_categories WHERE slug = ?', [category.slug])
      categoryIds.set(category.slug, rows[0].id)
    }

    for (const product of plan.products) {
      await connection.execute(
        `INSERT INTO products
          (id, category_id, name, slug, summary, description, application, alloy, keywords, cover_image, datasheet, meta, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          status = VALUES(status),
          sort_order = VALUES(sort_order)`,
        [
          product.id,
          product.category_slug ? categoryIds.get(product.category_slug) : null,
          product.name,
          product.slug,
          product.summary,
          product.description,
          product.application,
          product.alloy,
          product.keywords,
          product.cover_image,
          product.datasheet,
          JSON.stringify(product.meta || []),
          product.status,
          product.sort_order,
        ],
      )
    }

    for (const link of plan.categoryLinks) {
      const categoryId = categoryIds.get(link.category_slug)
      if (!categoryId) continue
      await connection.execute(
        `INSERT INTO product_category_map (product_id, category_id, sort_order)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
        [link.product_id, categoryId, link.sort_order],
      )
    }

    for (const image of plan.images) {
      await connection.execute(
        `INSERT INTO product_images (product_id, image_path, alt, sort_order, is_cover)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE alt = VALUES(alt), sort_order = VALUES(sort_order), is_cover = VALUES(is_cover)`,
        [image.product_id, image.image_path, image.alt, image.sort_order, image.is_cover],
      )
    }

    for (const document of plan.documents) {
      await connection.execute(
        `INSERT INTO product_documents (product_id, file_path, file_name, file_type, version, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_type = VALUES(file_type), version = VALUES(version), sort_order = VALUES(sort_order)`,
        [document.product_id, document.file_path, document.file_name, document.file_type, document.version, document.sort_order],
      )
    }

    await connection.commit()
    console.log('[execute] Product migration finished.')
    console.log(JSON.stringify({
      productCount: plan.products.length,
      categoryCount: plan.categories.length,
      imageCount: plan.images.length,
      pdfCount: plan.documents.length,
    }, null, 2))
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    await connection.end()
  }
}

async function main() {
  const products = await readProducts()
  const plan = normalizeProducts(products)

  if (!execute) {
    printDryRun(plan)
    return
  }

  await executeMigration(plan)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

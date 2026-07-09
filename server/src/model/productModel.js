import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'
import { productsBackupDir, productsDataPath, productsPath } from '../config/paths.js'
import { isDatabaseConfigured, query } from '../db.js'
import { readJsonFile, writeJsonFile } from '../utils/jsonFile.js'

export async function listProducts() {
  return readJsonFile(productsPath, [])
}

function parseMeta(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function splitGrouped(value) {
  return String(value || '').split('\u001f').filter(Boolean)
}

function normalizeProductStatus(value) {
  return Number(value) === 1 ? 'active' : 'inactive'
}

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

async function ensureProductCategory(categorySlug, sortOrder = 0) {
  const slug = slugify(categorySlug)
  if (!slug) return null

  await query(
    `INSERT INTO product_categories (name, slug, sort_order)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)`,
    [displayNameFromSlug(slug), slug, sortOrder],
  )
  const rows = await query('SELECT id FROM product_categories WHERE slug = ? LIMIT 1', [slug])
  return rows[0]?.id || null
}

export async function listProductsFromDatabaseOnly() {
  if (!isDatabaseConfigured) {
    const error = new Error('Database is not configured')
    error.status = 503
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }

  const rows = await query(
    `SELECT
       p.id,
       p.name,
       p.summary,
       p.description,
       p.application,
       p.alloy,
       p.keywords,
       p.cover_image,
       p.datasheet,
       p.meta,
       p.status,
       p.sort_order,
       c.slug AS primary_category,
       GROUP_CONCAT(DISTINCT cmc.slug ORDER BY pcm.sort_order, cmc.id SEPARATOR '\u001f') AS category_slugs,
       GROUP_CONCAT(DISTINCT pi.image_path ORDER BY pi.is_cover DESC, pi.sort_order, pi.id SEPARATOR '\u001f') AS image_paths,
       GROUP_CONCAT(DISTINCT pd.file_path ORDER BY pd.sort_order, pd.id SEPARATOR '\u001f') AS document_paths
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     LEFT JOIN product_category_map pcm ON pcm.product_id = p.id
     LEFT JOIN product_categories cmc ON cmc.id = pcm.category_id
     LEFT JOIN product_images pi ON pi.product_id = p.id
     LEFT JOIN product_documents pd ON pd.product_id = p.id
     WHERE p.status = 1
     GROUP BY p.id
     ORDER BY p.sort_order ASC, p.id ASC`,
  )

  return rows.map((row) => {
    const category = splitGrouped(row.category_slugs)
    const images = splitGrouped(row.image_paths)
    const documents = splitGrouped(row.document_paths)
    const datasheet = row.datasheet || documents[0] || ''

    return {
      id: row.id,
      name: row.name,
      category: category.length ? category : [row.primary_category].filter(Boolean),
      primaryCategory: row.primary_category || category[0] || '',
      application: row.application || '',
      alloy: row.alloy || '',
      image: row.cover_image || images[0] || '',
      images,
      keywords: row.keywords || '',
      summary: row.summary || '',
      detail: row.description || '',
      description: row.description || '',
      datasheet,
      documents: documents.map((filePath) => ({ file_path: filePath, path: filePath })),
      meta: parseMeta(row.meta),
      sort_order: Number(row.sort_order) || 0,
      status: normalizeProductStatus(row.status),
    }
  })
}

export async function syncProductToDatabase(product, sortOrder = 0) {
  if (!isDatabaseConfigured) {
    const error = new Error('Database is not configured')
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }

  const categories = Array.isArray(product.category)
    ? product.category.map((item) => slugify(item)).filter(Boolean)
    : String(product.category || '').split(',').map((item) => slugify(item)).filter(Boolean)
  const categoryIds = []

  for (const [index, category] of categories.entries()) {
    const categoryId = await ensureProductCategory(category, index)
    if (categoryId) categoryIds.push({ id: categoryId, sortOrder: index })
  }

  await query(
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
      categoryIds[0]?.id || null,
      product.name || product.id,
      slugify(product.id || product.name),
      product.summary || null,
      product.detail || null,
      product.application || null,
      product.alloy || null,
      product.keywords || null,
      product.image || null,
      product.datasheet || null,
      JSON.stringify(Array.isArray(product.meta) ? product.meta : []),
      sortOrder,
    ],
  )

  await query('DELETE FROM product_category_map WHERE product_id = ?', [product.id])
  for (const category of categoryIds) {
    await query(
      `INSERT INTO product_category_map (product_id, category_id, sort_order)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
      [product.id, category.id, category.sortOrder],
    )
  }

  await query('DELETE FROM product_images WHERE product_id = ?', [product.id])
  if (product.image) {
    await query(
      `INSERT INTO product_images (product_id, image_path, alt, sort_order, is_cover)
       VALUES (?, ?, ?, 0, 1)
       ON DUPLICATE KEY UPDATE alt = VALUES(alt), sort_order = VALUES(sort_order), is_cover = VALUES(is_cover)`,
      [product.id, product.image, product.name || product.id],
    )
  }

  await query('DELETE FROM product_documents WHERE product_id = ?', [product.id])
  if (product.datasheet) {
    await query(
      `INSERT INTO product_documents (product_id, file_path, file_name, file_type, version, sort_order)
       VALUES (?, ?, ?, 'datasheet', NULL, 0)
       ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_type = VALUES(file_type), version = VALUES(version), sort_order = VALUES(sort_order)`,
      [product.id, product.datasheet, filenameFromPath(product.datasheet)],
    )
  }
}

export async function markProductDeletedInDatabase(productId) {
  if (!isDatabaseConfigured) {
    const error = new Error('Database is not configured')
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }
  await query('UPDATE products SET status = 0 WHERE id = ?', [productId])
}

export async function syncProductSortOrdersToDatabase(products) {
  if (!isDatabaseConfigured) {
    const error = new Error('Database is not configured')
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }

  for (const [index, product] of products.entries()) {
    await query('UPDATE products SET sort_order = ? WHERE id = ?', [index, product.id])
  }
}

async function writeProductsData(products) {
  await fs.mkdir(path.dirname(productsDataPath), { recursive: true })
  await fs.writeFile(
    productsDataPath,
    `window.KEMITE_PRODUCTS = ${JSON.stringify(products, null, 2)}\n`,
    'utf8',
  )
}

async function trimProductBackups() {
  if (!Number.isInteger(env.backupRetention) || env.backupRetention <= 0) return

  const files = await fs.readdir(productsBackupDir, { withFileTypes: true }).catch(() => [])
  const backups = await Promise.all(files
    .filter((file) => file.isFile())
    .map(async (file) => {
      const filepath = path.join(productsBackupDir, file.name)
      const stat = await fs.stat(filepath)
      return { filepath, mtimeMs: stat.mtimeMs }
    }))
  const expired = backups.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(env.backupRetention)
  await Promise.all(expired.map((file) => fs.rm(file.filepath, { force: true })))
}

async function backupProductsFiles() {
  await fs.mkdir(productsBackupDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const files = [
    [productsPath, `products-${stamp}.json`],
    [productsDataPath, `products-data-${stamp}.js`],
  ]

  for (const [source, filename] of files) {
    try {
      await fs.copyFile(source, path.join(productsBackupDir, filename))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  await trimProductBackups()
}

export async function writeProducts(products) {
  await backupProductsFiles()
  await writeJsonFile(productsPath, products)
  await writeProductsData(products)
}

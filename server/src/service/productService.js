import {
  listProducts,
  listProductsFromDatabaseOnly,
  markProductDeletedInDatabase,
  syncProductSortOrdersToDatabase,
  syncProductToDatabase,
  writeProducts,
} from '../model/productModel.js'
import { toPositiveInt } from '../utils/validators.js'

function buildProductId(products) {
  const maxNumber = products.reduce((max, product) => {
    const match = String(product.id || '').match(/^KMT-(\d+)$/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `KMT-${String(maxNumber + 1).padStart(3, '0')}`
}

function buildDefaultProduct(products) {
  return {
    id: buildProductId(products),
    name: '新产品',
    category: ['leadfree'],
    application: '待补充',
    alloy: '待补充',
    image: 'public/products/nc5280rl1-jar.png',
    datasheet: '',
    keywords: '新产品',
    summary: '请在后台补充产品简介。',
    detail: '请在后台补充产品详细介绍。',
    meta: [
      ['产品类型', '待补充'],
      ['典型应用', '待补充'],
    ],
  }
}

export function normalizeProduct(input, existingProduct = {}) {
  const category = Array.isArray(input.category)
    ? input.category.map((item) => String(item).trim()).filter(Boolean)
    : String(input.category || '').split(',').map((item) => item.trim()).filter(Boolean)

  const meta = Array.isArray(input.meta)
    ? input.meta
        .filter((item) => Array.isArray(item) && item.length >= 2)
        .map(([label, value]) => [String(label).trim(), String(value).trim()])
        .filter(([label, value]) => label && value)
    : existingProduct.meta

  return {
    ...existingProduct,
    name: String(input.name || '').trim(),
    category,
    application: String(input.application || '').trim(),
    alloy: String(input.alloy || '').trim(),
    image: String(input.image || '').trim(),
    keywords: String(input.keywords || '').trim(),
    summary: String(input.summary || '').trim(),
    detail: String(input.detail || '').trim(),
    datasheet: String(input.datasheet || '').trim(),
    meta,
  }
}

export function validateProduct(product) {
  if (!product.name || !product.application || !product.alloy || !product.image || !product.summary || !product.detail) {
    return 'name, application, alloy, image, summary and detail are required'
  }
  if (!Array.isArray(product.category) || product.category.length === 0) {
    return 'at least one category is required'
  }
  if (!product.image.startsWith('public/products/')) return 'image must use public/products/'
  if (product.datasheet && !product.datasheet.startsWith('public/datasheets/')) return 'datasheet must use public/datasheets/'
  return null
}

function matchesProduct(product, query) {
  if (!query) return true
  const text = `${product.id} ${product.name} ${product.keywords} ${product.summary} ${product.detail} ${product.application} ${product.alloy}`.toLowerCase()
  return text.includes(query.toLowerCase())
}

async function runProductDatabaseSync(action, syncTask) {
  try {
    await syncTask()
  } catch (error) {
    console.warn(
      `[products] MySQL sync failed during ${action}: ${error.code || error.name || 'UNKNOWN_ERROR'}`,
    )
  }
}

export async function getProducts(options = {}) {
  const products = await listProducts()
  const query = String(options.query || '').trim()
  const pageSize = toPositiveInt(options.pageSize, products.length || 1)
  const page = toPositiveInt(options.page, 1)
  const filtered = products.filter((product) => matchesProduct(product, query))
  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * pageSize
  return {
    products: filtered.slice(start, start + pageSize),
    allProducts: products,
    pagination: { page: safePage, pageSize, total, pageCount },
  }
}

export async function getProductsFromDatabaseOnly() {
  return listProductsFromDatabaseOnly()
}

export async function getPublicProducts() {
  try {
    return await getProductsFromDatabaseOnly()
  } catch (error) {
    console.warn(
      `[products] MySQL read failed, falling back to products.json: ${error.code || error.name || 'UNKNOWN_ERROR'}`,
    )
    const result = await getProducts()
    return result.allProducts
  }
}

export async function createProduct() {
  const products = await listProducts()
  const product = buildDefaultProduct(products)
  products.push(product)
  await writeProducts(products)
  await runProductDatabaseSync('create', () => syncProductToDatabase(product, products.length - 1))
  return { product, products }
}

export async function updateProduct(id, input) {
  const products = await listProducts()
  const index = products.findIndex((product) => product.id === id)
  if (index === -1) return { error: 'Product not found', status: 404 }

  const product = normalizeProduct(input, products[index])
  const validationError = validateProduct(product)
  if (validationError) return { error: validationError, status: 400 }

  products[index] = product
  await writeProducts(products)
  await runProductDatabaseSync('update', () => syncProductToDatabase(product, index))
  return { product, products }
}

export async function deleteProduct(id) {
  const products = await listProducts()
  const nextProducts = products.filter((product) => product.id !== id)
  if (nextProducts.length === products.length) return { error: 'Product not found', status: 404 }
  await writeProducts(nextProducts)
  await runProductDatabaseSync('delete', async () => {
    await markProductDeletedInDatabase(id)
    await syncProductSortOrdersToDatabase(nextProducts)
  })
  return { products: nextProducts }
}

export async function moveProduct(id, direction) {
  const products = await listProducts()
  const index = products.findIndex((product) => product.id === id)
  if (index === -1) return { error: 'Product not found', status: 404 }

  const targetIndex = direction === 'up' ? index - 1 : direction === 'down' ? index + 1 : -1
  if (targetIndex < 0 || targetIndex >= products.length) return { products }

  const [product] = products.splice(index, 1)
  products.splice(targetIndex, 0, product)
  await writeProducts(products)
  await runProductDatabaseSync('move', () => syncProductSortOrdersToDatabase(products))
  return { products }
}

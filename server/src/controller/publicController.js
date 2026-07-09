import { getDatasheets, resolveDatasheet } from '../service/datasheetService.js'
import { getHealth } from '../service/healthService.js'
import { getProductsFromDatabaseOnly, getPublicProducts } from '../service/productService.js'
import { ok } from '../utils/response.js'

export async function health(_req, res, next) {
  try {
    res.json(await getHealth())
  } catch (error) {
    next(error)
  }
}

export async function products(_req, res, next) {
  try {
    res.json(await getPublicProducts())
  } catch (error) {
    next(error)
  }
}

export async function productsDb(_req, res, next) {
  try {
    ok(res, await getProductsFromDatabaseOnly(), 'success')
  } catch (error) {
    next(error)
  }
}

export async function datasheets(_req, res, next) {
  try {
    res.json(await getDatasheets())
  } catch (error) {
    next(error)
  }
}

export function downloadDatasheet(req, res) {
  const file = resolveDatasheet(req.params.filename)
  if (!file) {
    res.status(404).end()
    return
  }
  res.download(file.filepath, file.filename)
}

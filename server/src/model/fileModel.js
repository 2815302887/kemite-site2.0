import fs from 'node:fs/promises'
import path from 'node:path'
import { datasheetsDir, productImagesDir } from '../config/paths.js'
import { listProducts } from './productModel.js'

export async function listProductImages() {
  const [files, products] = await Promise.all([
    fs.readdir(productImagesDir, { withFileTypes: true }).catch(() => []),
    listProducts(),
  ])
  const usedImages = new Set(products.map((product) => product.image).filter(Boolean))
  const images = await Promise.all(files
    .filter((file) => file.isFile() && /\.(png|jpe?g|webp)$/i.test(file.name))
    .map(async (file) => {
      const publicPath = `public/products/${file.name}`
      const stat = await fs.stat(path.join(productImagesDir, file.name))
      return {
        name: file.name,
        path: publicPath,
        size: stat.size,
        used: usedImages.has(publicPath),
      }
    }))
  return images.sort((a, b) => Number(b.used) - Number(a.used) || a.name.localeCompare(b.name))
}

export async function listDatasheets() {
  const files = await fs.readdir(datasheetsDir, { withFileTypes: true }).catch(() => [])
  const datasheets = await Promise.all(files
    .filter((file) => file.isFile() && /\.pdf$/i.test(file.name))
    .map(async (file) => {
      const publicPath = `public/datasheets/${file.name}`
      const stat = await fs.stat(path.join(datasheetsDir, file.name))
      return {
        name: file.name.replace(/\.pdf$/i, ''),
        path: publicPath,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      }
    }))
  return datasheets.sort((a, b) => a.name.localeCompare(b.name))
}

export async function deleteProductImage(imagePath) {
  const filename = path.basename(imagePath)
  const resolvedPath = path.resolve(path.join(productImagesDir, filename))
  if (!resolvedPath.startsWith(path.resolve(productImagesDir) + path.sep)) {
    return { error: 'Invalid image path' }
  }
  await fs.rm(resolvedPath, { force: true })
  return {}
}

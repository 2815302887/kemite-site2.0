import { deleteProductImage, listProductImages } from '../model/fileModel.js'
import { listProducts } from '../model/productModel.js'

export async function getImages() {
  return listProductImages()
}

export async function removeImage(imagePath) {
  if (!String(imagePath || '').startsWith('public/products/')) return { error: 'Invalid image path', status: 400 }

  const products = await listProducts()
  if (products.some((product) => product.image === imagePath)) {
    return { error: 'Image is used by a product', status: 400 }
  }

  const result = await deleteProductImage(imagePath)
  if (result.error) return { error: result.error, status: 400 }
  return { images: await listProductImages() }
}

export async function removeImages(paths) {
  const deleted = []
  const failed = []
  for (const imagePath of paths) {
    const result = await removeImage(imagePath)
    if (result.error) failed.push({ path: imagePath, error: result.error })
    else deleted.push(imagePath)
  }
  return { deleted, failed, images: await listProductImages() }
}

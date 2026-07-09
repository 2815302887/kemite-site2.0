import { createOperationLog } from '../model/operationLogModel.js'
import { createProduct, deleteProduct, getProducts, moveProduct, updateProduct } from '../service/productService.js'
import { fail, ok } from '../utils/response.js'

export async function listAdminProducts(req, res, next) {
  try {
    const hasPagination = req.query.page || req.query.pageSize || req.query.q
    const result = await getProducts({
      page: req.query.page,
      pageSize: req.query.pageSize,
      query: req.query.q,
    })
    const products = hasPagination ? result.products : result.allProducts
    ok(res, { products, pagination: result.pagination }, '操作成功', { products, pagination: result.pagination })
  } catch (error) {
    next(error)
  }
}

export async function createAdminProduct(req, res, next) {
  try {
    const result = await createProduct()
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'create',
      targetType: 'product',
      targetId: result.product.id,
    })
    ok(res, result, '操作成功', result)
  } catch (error) {
    next(error)
  }
}

export async function updateAdminProduct(req, res, next) {
  try {
    const result = await updateProduct(req.params.id, req.body ?? {})
    if (result.error) return fail(res, result.status, result.error)
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'update',
      targetType: 'product',
      targetId: req.params.id,
    })
    ok(res, result, '操作成功', result)
  } catch (error) {
    next(error)
  }
}

export async function deleteAdminProduct(req, res, next) {
  try {
    const result = await deleteProduct(req.params.id)
    if (result.error) return fail(res, result.status, result.error)
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'delete',
      targetType: 'product',
      targetId: req.params.id,
    })
    ok(res, result, '操作成功', result)
  } catch (error) {
    next(error)
  }
}

export async function moveAdminProduct(req, res, next) {
  try {
    const result = await moveProduct(req.params.id, req.body?.direction)
    if (result.error) return fail(res, result.status, result.error)
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'move',
      targetType: 'product',
      targetId: req.params.id,
      detail: req.body?.direction || '',
    })
    ok(res, result, '操作成功', result)
  } catch (error) {
    next(error)
  }
}

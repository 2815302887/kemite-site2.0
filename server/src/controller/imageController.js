import { createOperationLog } from '../model/operationLogModel.js'
import { getImages, removeImage, removeImages } from '../service/imageService.js'
import { fail, ok } from '../utils/response.js'

export async function listImages(_req, res, next) {
  try {
    const images = await getImages()
    ok(res, { images }, '操作成功', { images })
  } catch (error) {
    next(error)
  }
}

export async function deleteImage(req, res, next) {
  try {
    const result = await removeImage(String(req.body?.path || '').trim())
    if (result.error) return fail(res, result.status, result.error)
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'delete',
      targetType: 'image',
      targetId: req.body?.path,
    })
    ok(res, result, '操作成功', result)
  } catch (error) {
    next(error)
  }
}

export async function deleteImages(req, res, next) {
  try {
    const paths = Array.isArray(req.body?.paths) ? req.body.paths.map(String) : []
    const result = await removeImages(paths)
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'batch-delete',
      targetType: 'image',
      detail: `deleted ${result.deleted.length}, failed ${result.failed.length}`,
    })
    ok(res, result, '操作成功', result)
  } catch (error) {
    next(error)
  }
}

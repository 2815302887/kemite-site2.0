import { createOperationLog } from '../model/operationLogModel.js'
import { saveDatasheet, saveProductImage } from '../service/uploadService.js'
import { fail, ok } from '../utils/response.js'

export async function uploadProductImage(req, res, next) {
  try {
    const result = await saveProductImage({ ...(req.body ?? {}), file: req.file })
    if (result.error) return fail(res, 400, result.error)
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'upload',
      targetType: 'product-image',
      targetId: result.path,
    })
    ok(res, result, '上传成功', result)
  } catch (error) {
    next(error)
  }
}

export async function uploadDatasheet(req, res, next) {
  try {
    const result = await saveDatasheet({ ...(req.body ?? {}), file: req.file })
    if (result.error) return fail(res, 400, result.error)
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'upload',
      targetType: 'datasheet',
      targetId: result.path,
    })
    ok(res, result, '上传成功', result)
  } catch (error) {
    next(error)
  }
}

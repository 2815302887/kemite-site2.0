import { submitContact } from '../service/contactService.js'
import { fail, ok } from '../utils/response.js'

export async function createContact(req, res, next) {
  try {
    const result = await submitContact(req.body ?? {})
    if (result.error) return fail(res, result.status, result.error)
    ok(res, null, '留言已提交')
  } catch (error) {
    next(error)
  }
}

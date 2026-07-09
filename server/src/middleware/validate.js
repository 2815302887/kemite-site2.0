import { fail } from '../utils/response.js'

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema(req.body ?? {})
    if (result.error) return fail(res, 400, result.error)
    req.validatedBody = result.value
    next()
  }
}

export function validateIdParam(param = 'id') {
  return (req, res, next) => {
    const id = Number(req.params[param])
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, `Invalid ${param}`)
    req.params[param] = String(id)
    next()
  }
}

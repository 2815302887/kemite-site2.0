export function ok(res, data = null, msg = '操作成功', extra = {}) {
  res.json({ code: 200, msg, data, success: true, ...extra })
}

export function fail(res, status = 400, msg = '操作失败', extra = {}) {
  res.status(status).json({ code: status, msg, error: msg, success: false, ...extra })
}

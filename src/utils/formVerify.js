(function () {
  function required(value, label = '该项') {
    return String(value ?? '').trim() ? '' : `${label}不能为空`
  }

  function email(value, label = '邮箱') {
    const text = String(value ?? '').trim()
    if (!text) return ''
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? '' : `${label}格式不正确`
  }

  function maxLength(value, max, label = '该项') {
    return String(value ?? '').trim().length <= max ? '' : `${label}不能超过 ${max} 个字符`
  }

  function verify(data, rules) {
    const errors = []
    Object.entries(rules || {}).forEach(([field, fieldRules]) => {
      fieldRules.forEach((rule) => {
        const message = rule(data[field], data)
        if (message) errors.push({ field, message })
      })
    })
    return { ok: errors.length === 0, errors, message: errors[0]?.message || '' }
  }

  function contact(payload) {
    return verify(payload, {
      name: [(value) => required(value, '姓名'), (value) => maxLength(value, 40, '姓名')],
      phone: [(value) => maxLength(value, 40, '电话')],
      email: [(value) => required(value, '邮箱'), (value) => email(value, '邮箱'), (value) => maxLength(value, 120, '邮箱')],
      message: [(value) => required(value, '留言内容'), (value) => maxLength(value, 1000, '留言内容')],
    })
  }

  function setStatus(node, type, message) {
    if (!node) return
    node.textContent = message
    node.hidden = false
    node.className = `form-status ${type === 'error' ? 'is-error' : 'is-success'}`
  }

  window.KemiteForm = { required, email, maxLength, verify, contact, setStatus }
})()

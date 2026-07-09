(function () {
  let loadingCount = 0

  function resolveApiBase() {
    const isLocalHost = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
    const isStaticDevServer = window.location.port === '8080'
    if (isLocalHost || isStaticDevServer) {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname
      return `http://${host}:3001`
    }
    return window.location.origin
  }

  function setLoading(visible) {
    loadingCount += visible ? 1 : -1
    loadingCount = Math.max(0, loadingCount)
    document.documentElement.classList.toggle('is-global-loading', loadingCount > 0)
  }

  function getToken() {
    return localStorage.getItem('adminToken') || ''
  }

  function showErrorToast(message) {
    let toast = document.querySelector('[data-global-error-toast]')
    if (!toast) {
      toast = document.createElement('div')
      toast.dataset.globalErrorToast = 'true'
      toast.className = 'global-error-toast'
      document.body.appendChild(toast)
    }
    toast.textContent = message
    toast.classList.add('is-visible')
    window.clearTimeout(showErrorToast.timer)
    showErrorToast.timer = window.setTimeout(() => {
      toast.classList.remove('is-visible')
    }, 3200)
  }

  async function request(path, options = {}) {
    const base = options.baseUrl ?? resolveApiBase()
    const headers = { ...(options.headers || {}) }
    const token = options.token ?? (options.auth ? getToken() : '')
    if (token) headers.Authorization = `Bearer ${token}`
    if (options.json !== false && options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    if (options.loading !== false) setLoading(true)
    try {
      const response = await fetch(`${base}${path}`, { ...options, headers })
      const data = await response.json().catch(() => null)
      if (response.status === 401) {
        const error = new Error(data?.msg || data?.error || '登录已过期，请重新登录')
        error.status = 401
        throw error
      }
      if (!response.ok) {
        const error = new Error(data?.msg || data?.error || '请求失败')
        error.status = response.status
        throw error
      }
      return data
    } catch (error) {
      if (options.silent !== true) {
        window.dispatchEvent(new CustomEvent('kemite:request-error', { detail: error }))
        showErrorToast(error instanceof Error ? error.message : '请求失败')
      }
      throw error
    } finally {
      if (options.loading !== false) setLoading(false)
    }
  }

  window.KemiteRequest = {
    request,
    resolveApiBase,
    getToken,
    showErrorToast,
  }
})()

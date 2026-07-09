(function () {
  function createAdminShared(options = {}) {
    const apiBase = options.apiBase || ''
    const nodes = options.nodes || {}

    function token() {
      return localStorage.getItem('adminToken')
    }

    function setError(message) {
      if (!nodes.loginError) return
      nodes.loginError.textContent = message
      nodes.loginError.style.display = 'block'
    }

    function formatDate(value) {
      return window.KemiteFormat.formatDate(value)
    }

    function escapeHtml(value) {
      return window.KemiteFormat.escapeHtml(value)
    }

    function showDashboard() {
      document.body.classList.remove('admin-page')
      if (nodes.loginView) nodes.loginView.style.display = 'none'
      if (nodes.dashboardView) nodes.dashboardView.style.display = 'block'
    }

    function showLogin() {
      document.body.classList.add('admin-page')
      if (nodes.dashboardView) nodes.dashboardView.style.display = 'none'
      if (nodes.loginView) nodes.loginView.style.display = 'block'
    }

    function expireLogin(message = '登录已过期，请重新登录。') {
      localStorage.removeItem('adminToken')
      showLogin()
      setError(message)
    }

    async function adminRequest(path, requestOptions = {}) {
      return window.KemiteRequest.request(path, {
        ...requestOptions,
        auth: true,
        baseUrl: apiBase,
      })
    }

    function confirmAction(message) {
      return window.confirm(message)
    }

    function alertError(error, fallback = '操作失败') {
      window.alert(error instanceof Error ? error.message : fallback)
    }

    function showStatus(node, type, message) {
      if (!node) return
      node.textContent = message
      node.style.display = 'block'
      node.style.background = type === 'error' ? '#fef2f2' : '#fffbeb'
      node.style.color = type === 'error' ? '#b91c1c' : 'var(--brand)'
    }

    function parseMeta(value) {
      return String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const separator = line.includes('：') ? '：' : ':'
          const index = line.indexOf(separator)
          if (index === -1) return [line, '']
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
        })
        .filter(([label, content]) => label && content)
    }

    function formatMeta(meta) {
      return Array.isArray(meta) ? meta.map(([label, value]) => `${label}：${value}`).join('\n') : ''
    }

    function hasMojibakeRisk(value) {
      return /(\?{2,}|锟|�|閿|闁|閺|娴|缁|鐠|鍟)/.test(String(value || ''))
    }

    function hasProductMojibakeRisk(payload) {
      const text = [
        payload.name,
        payload.application,
        payload.alloy,
        payload.keywords,
        payload.summary,
        payload.detail,
        payload.datasheet,
        ...payload.category,
        ...payload.meta.flat(),
      ].join(' ')
      return hasMojibakeRisk(text)
    }

    function readFileAsDataUrl(file) {
      return window.KemiteFile.readFileAsDataUrl(file)
    }

    return {
      adminRequest,
      alertError,
      apiBase,
      confirmAction,
      escapeHtml,
      expireLogin,
      formatDate,
      formatMeta,
      hasProductMojibakeRisk,
      nodes,
      parseMeta,
      readFileAsDataUrl,
      setError,
      showDashboard,
      showLogin,
      showStatus,
      token,
    }
  }

  window.KemiteAdminShared = { createAdminShared }
})()

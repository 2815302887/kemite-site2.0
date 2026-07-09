(function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  function formatDate(value, locale = 'zh-CN') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  function formatFileSize(bytes) {
    const size = Number(bytes)
    if (!Number.isFinite(size) || size <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
    return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase()
  }

  function filterEmptyParams(params) {
    return Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    )
  }

  window.KemiteFormat = {
    escapeHtml,
    formatDate,
    formatFileSize,
    normalizeText,
    filterEmptyParams,
  }
})()

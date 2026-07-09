(function () {
  function paginate(items, page = 1, pageSize = 12) {
    const total = items.length
    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(1, page), pageCount)
    const start = (safePage - 1) * pageSize
    return {
      page: safePage,
      pageCount,
      pageSize,
      total,
      items: items.slice(start, start + pageSize),
    }
  }

  function renderPagination(state) {
    if (!state || state.pageCount <= 1) return ''
    return `
      <nav class="pagination" aria-label="分页">
        <button class="button" type="button" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>上一页</button>
        <span>${state.page} / ${state.pageCount} · 共 ${state.total} 条</span>
        <button class="button" type="button" data-page="${state.page + 1}" ${state.page >= state.pageCount ? 'disabled' : ''}>下一页</button>
      </nav>
    `
  }

  window.KemiteComponents = {
    ...(window.KemiteComponents || {}),
    paginate,
    renderPagination,
  }
})()

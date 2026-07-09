(function () {
  function escapeHtml(value) {
    return window.KemiteFormat.escapeHtml(value)
  }

  function normalize(value) {
    return window.KemiteFormat?.normalizeText
      ? window.KemiteFormat.normalizeText(value)
      : String(value || '').trim().toLowerCase()
  }

  function fallbackProducts() {
    return Array.isArray(window.KEMITE_PRODUCTS) ? window.KEMITE_PRODUCTS : []
  }

  async function getProducts(options = {}) {
    const fallback = options.fallback || fallbackProducts()
    const apiBase = options.apiBase ?? ''

    try {
      const products = await window.KemiteRequest.request('/api/products', {
        baseUrl: apiBase,
        silent: options.silent !== false,
        loading: options.loading !== false,
      })
      return Array.isArray(products) ? products : fallback
    } catch (_error) {
      return fallback
    }
  }

  function filterProducts(products, filters = {}) {
    const query = normalize(filters.query)
    const category = filters.category || 'all'
    const application = filters.application || 'all'
    const alloy = filters.alloy || 'all'

    return products.filter((product) => {
      const text = normalize(`${product.id} ${product.name} ${product.keywords} ${product.summary} ${product.detail} ${product.application} ${product.alloy}`)
      const matchesQuery = query === '' || text.includes(query)
      const matchesCategory = category === 'all' || (Array.isArray(product.category) && product.category.includes(category))
      const matchesApplication = application === 'all' || normalize(product.application).includes(normalize(application))
      const matchesAlloy = alloy === 'all' || normalize(product.alloy).includes(normalize(alloy))
      return matchesQuery && matchesCategory && matchesApplication && matchesAlloy
    })
  }

  function createProductCard(product, options = {}) {
    if (window.KemiteCards?.productCard) return window.KemiteCards.productCard(product, options)
    if (window.KemiteComponents?.renderProductCard) return window.KemiteComponents.renderProductCard(product, options)
    return ''
  }

  function renderProductMeta(meta) {
    return Array.isArray(meta)
      ? meta.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')
      : ''
  }

  function renderProductActions(product, options = {}) {
    const mode = options.mode || 'modal'
    const actions = []

    if (mode === 'detail') {
      actions.push(`<a class="button" href="products.html?preview=${encodeURIComponent(product.id)}">${escapeHtml(options.backText || '返回产品中心')}</a>`)
      actions.push(`<a class="button primary" href="contact.html">${escapeHtml(options.contactText || '咨询选型')}</a>`)
    }

    if (product.datasheet) {
      actions.push(`<a class="button ${mode === 'modal' ? 'primary' : ''}" href="${escapeHtml(product.datasheet)}" download>${escapeHtml(options.downloadText || '下载资料')}</a>`)
    }

    return actions.join('')
  }

  function renderProductDetail(product, targets = {}, options = {}) {
    if (!product) {
      renderMissingProduct(targets, options)
      return
    }

    if (targets.title) targets.title.textContent = product.name
    if (targets.id) targets.id.textContent = product.id
    if (targets.summary) targets.summary.textContent = product.summary || ''
    if (targets.detail) targets.detail.textContent = product.detail || ''
    if (targets.meta) targets.meta.innerHTML = renderProductMeta(product.meta)
    if (targets.actions) targets.actions.innerHTML = renderProductActions(product, options)
    if (targets.image) {
      targets.image.src = product.image || ''
      targets.image.dataset.fallbackSrc = product.image || ''
      targets.image.alt = product.name || ''
      window.KemiteLazy?.observeImages(targets.root || document)
    }
    if (options.updateTitle !== false && product.name) {
      document.title = `${product.name} - ${options.siteName || '可米特焊接材料'}`
    }
  }

  function renderMissingProduct(targets = {}, options = {}) {
    const title = options.missingTitle || '产品不存在'
    const message = options.missingMessage || '未找到对应产品，请返回产品中心重新选择。'
    if (targets.title) targets.title.textContent = title
    if (targets.id) targets.id.textContent = options.missingIdText || '产品异常'
    if (targets.summary) targets.summary.textContent = message
    if (targets.detail) targets.detail.textContent = ''
    if (targets.meta) targets.meta.innerHTML = ''
    if (targets.actions) {
      targets.actions.innerHTML = '<a class="button primary" href="products.html">返回产品中心</a>'
    }
    if (targets.image) {
      targets.image.removeAttribute('src')
      targets.image.alt = title
    }
  }

  function findProductById(products, id) {
    if (!Array.isArray(products) || products.length === 0) return null
    if (!id) return products[0] || null
    return products.find((product) => product.id === id) || null
  }

  function readFilters(controls) {
    return {
      query: controls.search?.value || '',
      category: controls.category?.value || 'all',
      application: controls.application?.value || 'all',
      alloy: controls.alloy?.value || 'all',
    }
  }

  window.KemiteProductCenter = {
    createProductCard,
    filterProducts,
    findProductById,
    getProducts,
    readFilters,
    renderMissingProduct,
    renderProductActions,
    renderProductDetail,
    renderProductMeta,
  }
})()

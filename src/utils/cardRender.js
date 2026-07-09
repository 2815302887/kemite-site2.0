(function () {
  function escape(value) {
    return window.KemiteFormat?.escapeHtml
      ? window.KemiteFormat.escapeHtml(value)
      : String(value ?? '')
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;')
  }

  function optimizedImage(path) {
    return window.KemiteLazy?.getOptimizedImageSrc ? window.KemiteLazy.getOptimizedImageSrc(path) : path
  }

  function productCard(product, options = {}) {
    return `
      <article class="product-card" data-product-id="${escape(product.id)}">
        <div class="product-media">
          <img src="${escape(optimizedImage(product.image))}" data-fallback-src="${escape(product.image)}" alt="${escape(product.name)}" loading="lazy" />
        </div>
        <div class="product-body">
          <small>${escape(product.id)}</small>
          <h3>${escape(product.name)}</h3>
          <p class="product-summary">${escape(product.summary)}</p>
          <dl class="meta">
            ${(product.meta || []).slice(0, 2).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}
          </dl>
          <div class="product-actions">
            <button class="button primary" type="button" data-action="detail" data-id="${escape(product.id)}">${escape(options.detailText || '查看详情')}</button>
            <a class="button" href="product.html?id=${encodeURIComponent(product.id)}">${escape(options.pageText || '独立页面')}</a>
            ${product.datasheet ? `<a class="button" href="${escape(product.datasheet)}" download>${escape(options.downloadText || '下载资料')}</a>` : ''}
          </div>
        </div>
      </article>
    `
  }

  function pdfCard(file, options = {}) {
    const title = options.titleFormatter ? options.titleFormatter(file.name) : file.name
    const meta = options.metaFormatter ? options.metaFormatter(file) : window.KemiteFormat?.formatFileSize(file.size)
    return `
      <article class="card resource-card">
        <span class="badge">PDF</span>
        <h3>${escape(title)}</h3>
        <p>${escape(options.description || '产品资料、检测文件或资质文件，可用于客户选型、内部归档和资料核对。')}</p>
        <p class="resource-meta">${escape(meta || '')}</p>
        <a class="button" href="${escape(file.path)}" download>${escape(options.downloadText || '下载 PDF')}</a>
      </article>
    `
  }

  window.KemiteCards = { productCard, pdfCard }
  window.KemiteComponents = {
    ...(window.KemiteComponents || {}),
    renderProductCard: productCard,
    renderPdfDownloadCard: pdfCard,
  }
})()

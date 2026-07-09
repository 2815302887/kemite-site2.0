(function () {
  window.KemiteComponents = {
    ...(window.KemiteComponents || {}),
    renderProductCard: (product, options) => window.KemiteCards.productCard(product, options),
    renderPdfDownloadCard: (file, options) => window.KemiteCards.pdfCard(file, options),
  }
})()

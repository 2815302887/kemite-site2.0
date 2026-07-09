(function () {
  const rasterPattern = /\.(png|jpe?g)$/i

  function getOptimizedImageSrc(src) {
    if (!src || /\.webp($|\?)/i.test(src) || !rasterPattern.test(src)) return src
    return src.replace(rasterPattern, '.webp')
  }

  function bindFallback(img) {
    if (!img || img.dataset.lazyFallbackBound === 'true') return
    img.dataset.lazyFallbackBound = 'true'
    img.addEventListener('error', () => {
      const fallback = img.dataset.fallbackSrc
      if (fallback && img.getAttribute('src') !== fallback) {
        img.dataset.webpFailed = 'true'
        img.src = fallback
        img.removeAttribute('data-src')
      }
    })
  }

  function prepareImage(img) {
    if (!img) return
    img.dataset.lazyPrepared = 'true'
    img.loading = img.loading || 'lazy'
    bindFallback(img)

    const currentSrc = img.getAttribute('src')
    if (currentSrc && !img.dataset.fallbackSrc) img.dataset.fallbackSrc = currentSrc

    const optimized = getOptimizedImageSrc(img.dataset.src || currentSrc)
    if (optimized && currentSrc && optimized !== currentSrc && img.dataset.webpFailed !== 'true') {
      img.dataset.src = optimized
      img.removeAttribute('src')
    }
  }

  function observeImages(root = document) {
    const images = Array.from(root.querySelectorAll('img'))
    images.forEach(prepareImage)

    if (!('IntersectionObserver' in window)) {
      images.forEach((img) => {
        if (img.dataset.src) img.src = img.dataset.src
      })
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const img = entry.target
        if (img.dataset.src) img.src = img.dataset.src
        observer.unobserve(img)
      })
    }, { rootMargin: '240px 0px' })

    images.forEach((img) => observer.observe(img))
  }

  window.KemiteLazy = { getOptimizedImageSrc, observeImages, bindFallback }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => observeImages(), { once: true })
  } else {
    observeImages()
  }
})()

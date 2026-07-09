(function () {
  function base64ToFile(dataUrl, filename) {
    const [meta, content] = String(dataUrl || '').split(',')
    const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
    const binary = atob(content || '')
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return new File([bytes], filename || 'upload', { type: mime })
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(reader.result))
      reader.addEventListener('error', () => reject(reader.error))
      reader.readAsDataURL(file)
    })
  }

  function validateImageFile(file, options = {}) {
    const maxSize = options.maxSize || 8 * 1024 * 1024
    const types = options.types || ['image/png', 'image/jpeg', 'image/webp']
    if (!file) return '请选择图片文件'
    if (!types.includes(file.type)) return '仅支持 PNG、JPG、WebP 图片'
    if (file.size > maxSize) return `图片不能超过 ${window.KemiteFormat?.formatFileSize(maxSize) || '8 MB'}`
    return ''
  }

  function downloadPdf(path) {
    const link = document.createElement('a')
    link.href = path
    link.download = ''
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  window.KemiteFile = {
    base64ToFile,
    readFileAsDataUrl,
    validateImageFile,
    downloadPdf,
  }
})()

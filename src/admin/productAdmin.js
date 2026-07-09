(function () {
  function createProductAdmin(shared, nodes, hooks = {}) {
    let adminProducts = []
    let selectedProductId = ''
    let productAdminPagination = { page: 1, pageSize: 10, total: 0, pageCount: 1 }

    function showProductStatus(type, message) {
      shared.showStatus(nodes.productStatus, type, message)
    }

    function currentProductPayload() {
      const formData = new FormData(nodes.productForm)
      return {
        name: String(formData.get('name') || '').trim(),
        category: String(formData.get('category') || '').split(',').map((item) => item.trim()).filter(Boolean),
        application: String(formData.get('application') || '').trim(),
        alloy: String(formData.get('alloy') || '').trim(),
        image: String(formData.get('image') || '').trim(),
        datasheet: String(formData.get('datasheet') || '').trim(),
        keywords: String(formData.get('keywords') || '').trim(),
        summary: String(formData.get('summary') || '').trim(),
        detail: String(formData.get('detail') || '').trim(),
        meta: shared.parseMeta(formData.get('meta')),
      }
    }

    function fillProductForm(product) {
      selectedProductId = product.id
      nodes.productAdminList.querySelectorAll('button').forEach((button) => {
        button.classList.toggle('active', button.dataset.id === product.id)
      })
      nodes.productEditorTitle.textContent = `${product.id} ${product.name}`
      nodes.productForm.elements.id.value = product.id
      nodes.productForm.elements.name.value = product.name || ''
      nodes.productForm.elements.category.value = Array.isArray(product.category) ? product.category.join(', ') : ''
      nodes.productForm.elements.application.value = product.application || ''
      nodes.productForm.elements.alloy.value = product.alloy || ''
      nodes.productForm.elements.image.value = product.image || ''
      nodes.productForm.elements.datasheet.value = product.datasheet || ''
      nodes.productForm.elements.keywords.value = product.keywords || ''
      nodes.productForm.elements.summary.value = product.summary || ''
      nodes.productForm.elements.detail.value = product.detail || ''
      nodes.productForm.elements.meta.value = shared.formatMeta(product.meta)
      nodes.productPreview.src = product.image || ''
      nodes.productStatus.style.display = 'none'
    }

    function selectProduct(productId) {
      const product = adminProducts.find((item) => item.id === productId)
      if (!product) return
      fillProductForm(product)
    }

    function renderProductsAdmin() {
      if (adminProducts.length === 0) {
        nodes.productAdminList.innerHTML = '<p style="color: var(--muted)">暂无产品。</p>'
        nodes.productPagination.innerHTML = ''
        return
      }

      nodes.productAdminList.innerHTML = adminProducts.map((product) => `
        <button class="product-list-button" type="button" data-id="${shared.escapeHtml(product.id)}">
          <strong>${shared.escapeHtml(product.name)}</strong>
          <small>${shared.escapeHtml(product.id)} · ${shared.escapeHtml(product.application)} · ${shared.escapeHtml(product.alloy)}</small>
        </button>
      `).join('')
      nodes.productPagination.innerHTML = window.KemiteComponents.renderPagination(productAdminPagination)

      selectProduct(selectedProductId || adminProducts[0].id)
    }

    async function loadProducts(options = {}) {
      if (!shared.token()) {
        shared.showLogin()
        return
      }

      const nextPageSize = Number(nodes.productPageSize.value || productAdminPagination.pageSize || 10)
      const nextPage = options.page || productAdminPagination.page || 1
      const query = String(nodes.productAdminSearch.value || '').trim()
      productAdminPagination = { ...productAdminPagination, page: nextPage, pageSize: nextPageSize }

      nodes.productAdminList.innerHTML = '<p style="color: var(--muted)">正在加载产品...</p>'
      nodes.productPagination.innerHTML = ''

      try {
        const params = new URLSearchParams({
          page: String(productAdminPagination.page),
          pageSize: String(productAdminPagination.pageSize),
        })
        if (query) params.set('q', query)
        const data = await shared.adminRequest(`/api/admin/products?${params.toString()}`)
        adminProducts = data.products
        productAdminPagination = data.pagination || productAdminPagination
        if (adminProducts.length === 0 && productAdminPagination.page > 1) {
          productAdminPagination.page -= 1
          await loadProducts({ page: productAdminPagination.page })
          return
        }
        renderProductsAdmin()
      } catch (error) {
        showProductStatus('error', error instanceof Error ? error.message : '产品加载失败')
      }
    }

    async function moveSelectedProduct(direction) {
      if (!selectedProductId) return
      try {
        await shared.adminRequest(`/api/admin/products/${selectedProductId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction }),
        })
        await loadProducts({ page: productAdminPagination.page })
      } catch (error) {
        showProductStatus('error', error instanceof Error ? error.message : '产品排序失败')
      }
    }

    async function uploadAdminFile(input, uploadPath, targetField, previewAfterUpload = false) {
      const file = input.files?.[0]
      if (!file) return

      try {
        if (previewAfterUpload) {
          const imageError = window.KemiteFile.validateImageFile(file)
          if (imageError) throw new Error(imageError)
        } else if (file.type !== 'application/pdf') {
          throw new Error('仅支持 PDF 文件')
        }

        showProductStatus('success', '正在上传文件...')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('filename', file.name)

        let data
        try {
          data = await shared.adminRequest(uploadPath, { method: 'POST', body: formData, json: false })
        } catch (_formDataError) {
          const dataUrl = await shared.readFileAsDataUrl(file)
          data = await shared.adminRequest(uploadPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, dataUrl }),
          })
        }

        nodes.productForm.elements[targetField].value = data.path
        if (previewAfterUpload) nodes.productPreview.src = data.path
        if (previewAfterUpload) hooks.onImageLibraryDirty?.()
        showProductStatus('success', '文件已上传，请保存产品。')
      } catch (error) {
        showProductStatus('error', error instanceof Error ? error.message : '文件上传失败')
      } finally {
        input.value = ''
      }
    }

    function init() {
      nodes.productAdminSearch.addEventListener('input', window.KemiteTiming.debounce(() => {
        selectedProductId = ''
        loadProducts({ page: 1 })
      }, 240))

      nodes.productPageSize.addEventListener('change', () => {
        selectedProductId = ''
        loadProducts({ page: 1 })
      })

      nodes.productPagination.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-page]')
        if (!button || button.disabled) return
        selectedProductId = ''
        loadProducts({ page: Number(button.dataset.page) })
      })

      nodes.productAdminList.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-id]')
        if (!button) return
        selectProduct(button.dataset.id)
      })

      nodes.productImageInput.addEventListener('input', () => {
        nodes.productPreview.src = nodes.productImageInput.value
      })

      nodes.productCreateButton.addEventListener('click', async () => {
        try {
          const data = await shared.adminRequest('/api/admin/products', { method: 'POST' })
          selectedProductId = data.product.id
          const total = Array.isArray(data.products) ? data.products.length : productAdminPagination.total + 1
          const pageCount = Math.max(1, Math.ceil(total / productAdminPagination.pageSize))
          nodes.productAdminSearch.value = ''
          await loadProducts({ page: pageCount })
          showProductStatus('success', '已新增产品，请完善资料后保存。')
        } catch (error) {
          showProductStatus('error', error instanceof Error ? error.message : '新增产品失败')
        }
      })

      nodes.productDeleteButton.addEventListener('click', async () => {
        if (!selectedProductId) return
        if (!shared.confirmAction('确定删除这个产品吗？')) return
        try {
          const data = await shared.adminRequest(`/api/admin/products/${selectedProductId}`, { method: 'DELETE' })
          const total = Array.isArray(data.products) ? data.products.length : Math.max(0, productAdminPagination.total - 1)
          const pageCount = Math.max(1, Math.ceil(total / productAdminPagination.pageSize))
          selectedProductId = ''
          await loadProducts({ page: Math.min(productAdminPagination.page, pageCount) })
          showProductStatus('success', '产品已删除，并已同步前台数据。')
        } catch (error) {
          showProductStatus('error', error instanceof Error ? error.message : '删除产品失败')
        }
      })

      nodes.productMoveUpButton.addEventListener('click', () => moveSelectedProduct('up'))
      nodes.productMoveDownButton.addEventListener('click', () => moveSelectedProduct('down'))

      nodes.productPreviewButton.addEventListener('click', () => {
        const id = selectedProductId || nodes.productForm.elements.id.value
        if (!id) return
        window.open(`products.html?preview=${encodeURIComponent(id)}`, '_blank')
      })

      nodes.productImageUpload.addEventListener('change', () => {
        uploadAdminFile(nodes.productImageUpload, '/api/admin/uploads/product-image', 'image', true)
      })

      nodes.productDatasheetUpload.addEventListener('change', () => {
        uploadAdminFile(nodes.productDatasheetUpload, '/api/admin/uploads/datasheet', 'datasheet')
      })

      nodes.productForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        if (!selectedProductId) {
          showProductStatus('error', '请先选择一个产品')
          return
        }

        const payload = currentProductPayload()
        if (shared.hasProductMojibakeRisk(payload) && !shared.confirmAction('检测到内容可能包含乱码，确定要保存吗？')) return

        nodes.productSaveButton.textContent = '保存中...'
        nodes.productSaveButton.disabled = true
        nodes.productStatus.style.display = 'none'

        try {
          await shared.adminRequest(`/api/admin/products/${selectedProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          showProductStatus('success', '产品已保存，并已同步前台数据。')
          await loadProducts({ page: productAdminPagination.page })
        } catch (error) {
          showProductStatus('error', error instanceof Error ? error.message : '产品保存失败')
        } finally {
          nodes.productSaveButton.textContent = '保存产品'
          nodes.productSaveButton.disabled = false
        }
      })
    }

    return {
      fillProductForm,
      hasProducts: () => adminProducts.length > 0,
      init,
      loadProducts,
      renderProductsAdmin,
      selectProduct,
    }
  }

  window.KemiteProductAdmin = { createProductAdmin }
})()

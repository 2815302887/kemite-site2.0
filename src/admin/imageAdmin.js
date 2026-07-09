(function () {
  function createImageAdmin(shared, nodes) {
    let adminImages = []

    function showImageStatus(type, message) {
      nodes.imageLibraryStatus.style.display = 'block'
      nodes.imageLibraryStatus.querySelector('.info-body').textContent = message
      nodes.imageLibraryStatus.style.background = type === 'error' ? '#fef2f2' : 'white'
    }

    function renderImageLibrary() {
      if (adminImages.length === 0) {
        nodes.imageLibraryList.innerHTML = '<div class="info-card"><div class="info-body">暂无产品图片。</div></div>'
        return
      }

      nodes.imageLibraryList.innerHTML = adminImages.map((image) => `
        <article class="product-card">
          <div class="product-media">
            <img src="${shared.escapeHtml(image.path)}" alt="${shared.escapeHtml(image.name)}" loading="lazy" />
          </div>
          <div class="product-body">
            <label class="inline-actions" style="justify-content: flex-start">
              <input type="checkbox" data-select-image="${shared.escapeHtml(image.path)}" ${image.used ? 'disabled' : ''} />
              <span>${image.used ? '使用中不可批量删除' : '选择删除'}</span>
            </label>
            <small>${image.used ? '使用中' : '未使用'}</small>
            <h3>${shared.escapeHtml(image.name)}</h3>
            <p>${shared.escapeHtml(image.path)}</p>
            <div class="product-actions">
              <button class="button" type="button" data-copy-image="${shared.escapeHtml(image.path)}">复制路径</button>
              <button class="button" type="button" data-delete-image="${shared.escapeHtml(image.path)}" ${image.used ? 'disabled' : ''}>删除</button>
            </div>
          </div>
        </article>
      `).join('')
      window.KemiteLazy?.observeImages(nodes.imageLibraryList)
    }

    async function loadImages() {
      if (!shared.token()) {
        shared.showLogin()
        return
      }

      nodes.imageLibraryList.innerHTML = '<div class="info-card"><div class="info-body">正在加载图片...</div></div>'
      nodes.imageLibraryStatus.style.display = 'none'
      try {
        const data = await shared.adminRequest('/api/admin/images')
        adminImages = data.images
        renderImageLibrary()
      } catch (error) {
        showImageStatus('error', error instanceof Error ? error.message : '图片加载失败')
      }
    }

    function init() {
      nodes.refreshImagesButton.addEventListener('click', loadImages)

      nodes.batchDeleteImagesButton.addEventListener('click', async () => {
        const paths = Array.from(nodes.imageLibraryList.querySelectorAll('[data-select-image]:checked')).map((input) => input.dataset.selectImage)
        if (paths.length === 0) {
          showImageStatus('error', '请先勾选要删除的未使用图片。')
          return
        }
        if (!shared.confirmAction(`确定删除 ${paths.length} 张未使用图片吗？`)) return

        try {
          const data = await shared.adminRequest('/api/admin/images/batch', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paths }),
          })
          adminImages = data.images
          renderImageLibrary()
          showImageStatus(data.failed?.length ? 'error' : 'success', `已删除 ${data.deleted?.length || 0} 张，失败 ${data.failed?.length || 0} 张。`)
        } catch (error) {
          showImageStatus('error', error instanceof Error ? error.message : '批量删除失败')
        }
      })

      nodes.imageLibraryList.addEventListener('click', async (event) => {
        const copyButton = event.target.closest('[data-copy-image]')
        if (copyButton) {
          await navigator.clipboard.writeText(copyButton.dataset.copyImage)
          showImageStatus('success', '图片路径已复制。')
          return
        }

        const deleteButton = event.target.closest('[data-delete-image]')
        if (!deleteButton) return
        if (!shared.confirmAction('确定删除这张未使用图片吗？')) return

        try {
          const data = await shared.adminRequest('/api/admin/images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: deleteButton.dataset.deleteImage }),
          })
          adminImages = data.images
          renderImageLibrary()
          showImageStatus('success', '图片已删除。')
        } catch (error) {
          showImageStatus('error', error instanceof Error ? error.message : '图片删除失败')
        }
      })
    }

    return {
      hasImages: () => adminImages.length > 0,
      init,
      loadImages,
      markDirty: () => {
        adminImages = []
      },
      renderImageLibrary,
    }
  }

  window.KemiteImageAdmin = { createImageAdmin }
})()

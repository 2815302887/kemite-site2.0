(function () {
  function createMessageAdmin(shared, nodes) {
    let contacts = []

    function renderMessages() {
      const query = String(nodes.messageSearch.value || '').trim().toLowerCase()
      const filter = nodes.messageFilter.value
      const visible = contacts.filter((contact) => {
        const text = `${contact.name} ${contact.phone || ''} ${contact.email} ${contact.message}`.toLowerCase()
        const matchesQuery = query === '' || text.includes(query)
        const matchesFilter = filter === 'all' || (filter === 'read' ? contact.is_read : !contact.is_read)
        return matchesQuery && matchesFilter
      })

      nodes.totalCount.textContent = contacts.length
      nodes.unreadCount.textContent = contacts.filter((item) => !item.is_read).length
      nodes.systemState.textContent = '正常'

      if (visible.length === 0) {
        nodes.messageStatus.style.display = 'block'
        nodes.messageStatus.querySelector('.info-body').textContent = contacts.length === 0
          ? '暂无留言。客户提交联系表单后，会显示在这里。'
          : '没有匹配的留言。'
        nodes.messageList.innerHTML = ''
        return
      }

      nodes.messageStatus.style.display = 'none'
      nodes.messageList.innerHTML = visible.map((contact) => `
        <article class="message-card" data-id="${contact.id}">
          <div class="section-head" style="margin-bottom: 0">
            <div>
              <h3>${shared.escapeHtml(contact.name)}</h3>
              <p>${shared.escapeHtml(contact.email)}</p>
              <p>${shared.escapeHtml(contact.phone || '未填写电话')}</p>
            </div>
            <div style="text-align: right">
              <span class="badge" style="width: auto; padding: 0 12px">${contact.is_read ? '已读' : '未读'}</span>
              <p style="margin-top: 10px">${shared.formatDate(contact.created_at)}</p>
            </div>
          </div>
          <p class="message-body">${shared.escapeHtml(contact.message)}</p>
          <div class="message-actions">
            ${contact.is_read ? '' : `<button class="button" type="button" data-action="read" data-id="${contact.id}">标记已读</button>`}
            <button class="button" type="button" data-action="delete" data-id="${contact.id}">删除留言</button>
          </div>
        </article>
      `).join('')
    }

    async function loadContacts() {
      if (!shared.token()) {
        shared.showLogin()
        return
      }

      shared.showDashboard()
      nodes.messageStatus.style.display = 'block'
      nodes.messageStatus.querySelector('.info-body').textContent = '正在加载留言...'
      nodes.messageList.innerHTML = ''

      try {
        const data = await shared.adminRequest('/api/admin/contacts')
        contacts = data.contacts
        renderMessages()
      } catch (error) {
        if (error.status === 401) {
          shared.expireLogin()
          return
        }
        nodes.systemState.textContent = '--'
        nodes.messageStatus.style.display = 'block'
        nodes.messageStatus.querySelector('.info-body').textContent = error instanceof Error ? error.message : '留言加载失败'
      }
    }

    function init() {
      nodes.messageSearch.addEventListener('input', window.KemiteTiming.debounce(renderMessages, 200))
      nodes.messageFilter.addEventListener('change', renderMessages)

      nodes.markAllReadButton.addEventListener('click', async () => {
        if (!shared.confirmAction('确定把全部留言标记为已读吗？')) return
        try {
          await shared.adminRequest('/api/admin/contacts/read-all', { method: 'PATCH' })
          await loadContacts()
        } catch (error) {
          shared.alertError(error)
        }
      })

      nodes.exportContactsButton.addEventListener('click', () => {
        if (!shared.token()) {
          shared.showLogin()
          return
        }
        window.open(`${shared.apiBase}/api/admin/contacts/export?token=${encodeURIComponent(shared.token())}`, '_blank')
      })

      nodes.messageList.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]')
        if (!button) return
        const id = button.dataset.id
        const action = button.dataset.action

        try {
          if (action === 'read') {
            await shared.adminRequest(`/api/admin/contacts/${id}/read`, { method: 'PATCH' })
          }
          if (action === 'delete') {
            if (!shared.confirmAction('确定删除这条留言吗？')) return
            await shared.adminRequest(`/api/admin/contacts/${id}`, { method: 'DELETE' })
          }
          await loadContacts()
        } catch (error) {
          shared.alertError(error)
        }
      })
    }

    return {
      init,
      loadContacts,
      renderMessages,
    }
  }

  window.KemiteMessageAdmin = { createMessageAdmin }
})()

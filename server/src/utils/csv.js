export function contactsToCsv(contacts) {
  const headers = ['ID', '姓名', '电话', '邮箱', '留言内容', '提交时间', '状态']
  const rows = contacts.map((contact) => [
    contact.id,
    contact.name,
    contact.phone || '',
    contact.email,
    contact.message,
    contact.created_at,
    contact.is_read ? '已读' : '未读',
  ])
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')}`
}

import { createOperationLog } from '../model/operationLogModel.js'
import { getContacts, readAllContacts, readContact, removeContact } from '../service/contactService.js'
import { contactsToCsv } from '../utils/csv.js'
import { ok } from '../utils/response.js'

export async function listAdminContacts(_req, res, next) {
  try {
    const contacts = await getContacts()
    ok(res, { contacts }, '操作成功', { contacts })
  } catch (error) {
    next(error)
  }
}

export async function exportContacts(req, res, next) {
  try {
    const contacts = await getContacts()
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'export',
      targetType: 'contacts',
      detail: `exported ${contacts.length} contacts`,
    })
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.xls"')
    res.send(contactsToCsv(contacts))
  } catch (error) {
    next(error)
  }
}

export async function markRead(req, res, next) {
  try {
    await readContact(Number(req.params.id))
    ok(res)
  } catch (error) {
    next(error)
  }
}

export async function markAllRead(_req, res, next) {
  try {
    await readAllContacts()
    ok(res)
  } catch (error) {
    next(error)
  }
}

export async function deleteContact(req, res, next) {
  try {
    await removeContact(Number(req.params.id))
    await createOperationLog({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: 'delete',
      targetType: 'contact',
      targetId: req.params.id,
    })
    ok(res)
  } catch (error) {
    next(error)
  }
}

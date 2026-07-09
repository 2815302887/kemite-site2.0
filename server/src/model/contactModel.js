import { contactsPath } from '../config/paths.js'
import { query } from '../db.js'
import { readJsonFile, writeJsonFile } from '../utils/jsonFile.js'
import { checkDatabase } from './storageState.js'

export async function listContacts() {
  const database = await checkDatabase()
  if (database.ok) {
    return query(
      `SELECT id, name, phone, email, message, created_at, is_read
       FROM contacts
       ORDER BY created_at DESC, id DESC`,
    )
  }
  return readJsonFile(contactsPath, [])
}

export async function createContact(contact) {
  const database = await checkDatabase()
  if (database.ok) {
    await query(
      'INSERT INTO contacts (name, phone, email, message) VALUES (?, ?, ?, ?)',
      [contact.name, contact.phone || null, contact.email, contact.message],
    )
    return
  }

  const contacts = await readJsonFile(contactsPath, [])
  contacts.unshift({
    id: Date.now(),
    ...contact,
    created_at: new Date().toISOString(),
    is_read: 0,
  })
  await writeJsonFile(contactsPath, contacts)
}

export async function markContactRead(id) {
  const database = await checkDatabase()
  if (database.ok) {
    await query('UPDATE contacts SET is_read = 1 WHERE id = ?', [id])
    return
  }

  const contacts = await readJsonFile(contactsPath, [])
  const contact = contacts.find((item) => Number(item.id) === Number(id))
  if (contact) contact.is_read = 1
  await writeJsonFile(contactsPath, contacts)
}

export async function markAllContactsRead() {
  const database = await checkDatabase()
  if (database.ok) {
    await query('UPDATE contacts SET is_read = 1 WHERE is_read = 0')
    return
  }

  const contacts = await readJsonFile(contactsPath, [])
  contacts.forEach((contact) => {
    contact.is_read = 1
  })
  await writeJsonFile(contactsPath, contacts)
}

export async function deleteContact(id) {
  const database = await checkDatabase()
  if (database.ok) {
    await query('DELETE FROM contacts WHERE id = ?', [id])
    return
  }
  await writeJsonFile(
    contactsPath,
    (await readJsonFile(contactsPath, [])).filter((item) => Number(item.id) !== Number(id)),
  )
}

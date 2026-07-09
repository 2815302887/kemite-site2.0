import { createContact, deleteContact, listContacts, markAllContactsRead, markContactRead } from '../model/contactModel.js'
import { isValidEmail, sanitizeText } from '../utils/validators.js'

export function normalizeContact(input) {
  return {
    name: sanitizeText(input.name, 40),
    phone: sanitizeText(input.phone, 40),
    email: sanitizeText(input.email, 120),
    message: sanitizeText(input.message, 1000),
  }
}

export function validateContact(contact) {
  if (!contact.name || !contact.email || !contact.message) return 'name, email and message are required'
  if (!isValidEmail(contact.email)) return '邮箱格式不正确'
  return null
}

export async function submitContact(input) {
  const contact = normalizeContact(input)
  const validationError = validateContact(contact)
  if (validationError) return { error: validationError, status: 400 }
  await createContact(contact)
  return {}
}

export async function getContacts() {
  return listContacts()
}

export async function readContact(id) {
  await markContactRead(id)
}

export async function readAllContacts() {
  await markAllContactsRead()
}

export async function removeContact(id) {
  await deleteContact(id)
}

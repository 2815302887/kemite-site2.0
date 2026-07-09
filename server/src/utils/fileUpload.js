import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'

export const allowedImageMimeTypes = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
])

export const allowedDatasheetMimeTypes = new Map([
  ['application/pdf', '.pdf'],
])

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function uniqueName(originalName, extension) {
  const originalBase = path.basename(String(originalName || ''), path.extname(String(originalName || '')))
  const random = Math.random().toString(36).slice(2, 10)
  return `${slugify(originalBase) || 'upload'}-${Date.now()}-${random}${extension}`
}

function decodeBase64Payload(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

export async function saveBase64File({ dataUrl, filename, directory, publicPrefix, allowedMimeTypes }) {
  const payload = decodeBase64Payload(dataUrl)
  if (!payload) return { error: 'Invalid upload data' }

  const uploadLimitBytes = env.uploadLimitMb * 1024 * 1024
  if (payload.buffer.length > uploadLimitBytes) {
    return { error: `File is too large, limit is ${env.uploadLimitMb}MB` }
  }

  const extension = allowedMimeTypes.get(payload.mimeType)
  if (!extension) return { error: 'Unsupported file type' }

  const outputName = uniqueName(filename, extension)
  const outputPath = path.resolve(path.join(directory, outputName))
  const resolvedDir = path.resolve(directory)
  if (!outputPath.startsWith(resolvedDir + path.sep)) return { error: 'Invalid upload path' }

  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(outputPath, payload.buffer)
  return { path: `${publicPrefix}/${outputName}`, name: outputName, size: payload.buffer.length }
}

export async function saveBufferFile({ buffer, mimeType, filename, directory, publicPrefix, allowedMimeTypes }) {
  if (!Buffer.isBuffer(buffer)) return { error: 'Invalid upload data' }

  const uploadLimitBytes = env.uploadLimitMb * 1024 * 1024
  if (buffer.length > uploadLimitBytes) {
    return { error: `File is too large, limit is ${env.uploadLimitMb}MB` }
  }

  const extension = allowedMimeTypes.get(mimeType)
  if (!extension) return { error: 'Unsupported file type' }

  const outputName = uniqueName(filename, extension)
  const outputPath = path.resolve(path.join(directory, outputName))
  const resolvedDir = path.resolve(directory)
  if (!outputPath.startsWith(resolvedDir + path.sep)) return { error: 'Invalid upload path' }

  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(outputPath, buffer)
  return { path: `${publicPrefix}/${outputName}`, name: outputName, size: buffer.length, mimeType }
}

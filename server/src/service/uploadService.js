import { datasheetsDir, productImagesDir } from '../config/paths.js'
import {
  allowedDatasheetMimeTypes,
  allowedImageMimeTypes,
  saveBase64File,
  saveBufferFile,
} from '../utils/fileUpload.js'

export function saveProductImage(input) {
  if (input.file) {
    return saveBufferFile({
      buffer: input.file.buffer,
      mimeType: input.file.mimetype,
      filename: input.file.originalname,
      directory: productImagesDir,
      publicPrefix: 'public/products',
      allowedMimeTypes: allowedImageMimeTypes,
    })
  }

  return saveBase64File({
    dataUrl: input.dataUrl,
    filename: input.filename,
    directory: productImagesDir,
    publicPrefix: 'public/products',
    allowedMimeTypes: allowedImageMimeTypes,
  })
}

export function saveDatasheet(input) {
  if (input.file) {
    return saveBufferFile({
      buffer: input.file.buffer,
      mimeType: input.file.mimetype,
      filename: input.file.originalname,
      directory: datasheetsDir,
      publicPrefix: 'public/datasheets',
      allowedMimeTypes: allowedDatasheetMimeTypes,
    })
  }

  return saveBase64File({
    dataUrl: input.dataUrl,
    filename: input.filename,
    directory: datasheetsDir,
    publicPrefix: 'public/datasheets',
    allowedMimeTypes: allowedDatasheetMimeTypes,
  })
}

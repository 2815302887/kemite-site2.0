import multer from 'multer'
import { env } from '../config/env.js'

export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadLimitMb * 1024 * 1024,
    files: 1,
  },
}).single('file')

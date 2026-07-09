import { Router } from 'express'
import { createContact } from '../controller/contactController.js'
import { datasheets, downloadDatasheet, health, products, productsDb } from '../controller/publicController.js'
import { env } from '../config/env.js'
import { rateLimit } from '../middleware/rateLimit.js'

export const publicRoutes = Router()

publicRoutes.get('/api/health', health)
publicRoutes.get('/api/products', products)
publicRoutes.get('/api/products-db', productsDb)
publicRoutes.get('/api/datasheets', datasheets)
publicRoutes.get('/public/datasheets/:filename', downloadDatasheet)
publicRoutes.post(
  '/api/contact',
  rateLimit({
    bucket: 'contact',
    limit: env.contactRateLimitMax,
    windowMs: env.contactRateLimitWindowMs,
    message: '提交过于频繁，请稍后再试',
  }),
  createContact,
)

import { Router } from 'express'
import { adminLogin } from '../controller/adminController.js'
import {
  deleteContact,
  exportContacts,
  listAdminContacts,
  markAllRead,
  markRead,
} from '../controller/adminContactController.js'
import {
  createAdminProduct,
  deleteAdminProduct,
  listAdminProducts,
  moveAdminProduct,
  updateAdminProduct,
} from '../controller/adminProductController.js'
import { deleteImage, deleteImages, listImages } from '../controller/imageController.js'
import { uploadDatasheet, uploadProductImage } from '../controller/uploadController.js'
import { requireAdminAuth } from '../middleware/auth.js'
import { uploadSingleFile } from '../middleware/upload.js'
import { validateIdParam } from '../middleware/validate.js'

export const adminRoutes = Router()

adminRoutes.get(['/admin', '/admin/login'], (_req, res) => {
  res.redirect(302, '/admin.html')
})

adminRoutes.post('/api/admin/login', adminLogin)

adminRoutes.get('/api/admin/contacts', requireAdminAuth, listAdminContacts)
adminRoutes.get('/api/admin/contacts/export', requireAdminAuth, exportContacts)
adminRoutes.patch('/api/admin/contacts/read-all', requireAdminAuth, markAllRead)
adminRoutes.patch('/api/admin/contacts/:id/read', requireAdminAuth, validateIdParam('id'), markRead)
adminRoutes.delete('/api/admin/contacts/:id', requireAdminAuth, validateIdParam('id'), deleteContact)

adminRoutes.get('/api/admin/products', requireAdminAuth, listAdminProducts)
adminRoutes.post('/api/admin/products', requireAdminAuth, createAdminProduct)
adminRoutes.put('/api/admin/products/:id', requireAdminAuth, updateAdminProduct)
adminRoutes.delete('/api/admin/products/:id', requireAdminAuth, deleteAdminProduct)
adminRoutes.post('/api/admin/products/:id/move', requireAdminAuth, moveAdminProduct)

adminRoutes.post('/api/admin/uploads/product-image', requireAdminAuth, uploadSingleFile, uploadProductImage)
adminRoutes.post('/api/admin/uploads/datasheet', requireAdminAuth, uploadSingleFile, uploadDatasheet)

adminRoutes.get('/api/admin/images', requireAdminAuth, listImages)
adminRoutes.delete('/api/admin/images', requireAdminAuth, deleteImage)
adminRoutes.delete('/api/admin/images/batch', requireAdminAuth, deleteImages)

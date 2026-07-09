import express from 'express'
import { env } from './config/env.js'
import { rootDir } from './config/paths.js'
import { closePool } from './db.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { registerCoreMiddleware } from './middleware/security.js'
import { adminRoutes } from './routes/admin.js'
import { publicRoutes } from './routes/public.js'

const app = express()

app.use(requestLogger)
registerCoreMiddleware(app)
app.use(adminRoutes)
app.use(publicRoutes)

app.use(express.static(rootDir, {
  extensions: ['html'],
  index: 'index.html',
}))

app.use(errorHandler)

const server = app.listen(env.port, () => {
  console.log(`Site server listening on http://127.0.0.1:${env.port}`)
})

function shutdown() {
  server.close(async () => {
    await closePool()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

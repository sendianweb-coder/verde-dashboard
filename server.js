import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const distPath = path.join(__dirname, 'dist')

app.disable('x-powered-by')

app.use(express.static(distPath))

app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
})

import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()

app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDistPath = path.resolve(__dirname, '../../client/dist')

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/dog', async (req, res) => {
  try {
    const { name, trait, traits, horoscope } = req.body ?? {}

    const normalizedTraits = Array.isArray(traits)
      ? traits.filter((t) => typeof t === 'string' && t.trim().length > 0)
      : typeof trait === 'string' && trait.trim().length > 0
        ? [trait.trim()]
        : []

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Missing name.' })
    }

    if (normalizedTraits.length === 0) {
      return res.status(400).json({ error: 'Missing traits.' })
    }

    if (normalizedTraits.length > 5) {
      return res.status(400).json({ error: 'Too many traits (max 5).' })
    }

    if (
      !horoscope ||
      typeof horoscope !== 'string' ||
      horoscope.trim().length === 0
    ) {
      return res.status(400).json({ error: 'Missing horoscope.' })
    }

    const dogResponse = await fetch('https://dog.ceo/api/breeds/image/random')

    if (!dogResponse.ok) {
      return res.status(502).json({ error: 'Failed to fetch dog image.' })
    }

    const dogJson = await dogResponse.json()
    const imageUrl = dogJson?.message

    if (!imageUrl) {
      return res
        .status(502)
        .json({ error: 'Dog API returned an invalid response.' })
    }

    res.json({
      name: name.trim(),
      traits: normalizedTraits,
      horoscope: horoscope.trim(),
      imageUrl,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Unexpected server error.' })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath))

  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

const port = process.env.PORT ? Number(process.env.PORT) : 3001
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${port}`)
})

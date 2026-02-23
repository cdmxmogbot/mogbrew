import { Hono } from 'hono'
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getRouter } from './router'
import { env } from 'cloudflare:workers'

const app = new Hono()

// API: POST /api/log - Log beers directly
app.post('/api/log', async (c) => {
  const data = await c.req.json() as {
    user_id: string
    beer_name: string
    brand: string
    abv: number
    container_type: string
    volume_ml: number
    quantity?: number
  }

  const quantity = data.quantity ?? 1

  const stmt = env.DB.prepare(
    'INSERT INTO beer_log (user_id, beer_name, brand, abv, container_type, volume_ml) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const inserts = Array.from({ length: quantity }, () =>
    stmt.bind(data.user_id, data.beer_name, data.brand, data.abv, data.container_type, data.volume_ml)
  )

  await env.DB.batch(inserts)

  return c.json({ success: true, logged: quantity })
})

// API: GET /api/today - Get today's beers for a user
app.get('/api/today', async (c) => {
  const user_id = c.req.query('user_id') ?? 'ian'

  const result = await env.DB.prepare(
    "SELECT * FROM beer_log WHERE user_id = ? AND date(logged_at) = date('now') ORDER BY logged_at DESC"
  ).bind(user_id).all()

  return c.json({ beers: result.results })
})

// All other routes handled by TanStack Start
const startHandler = createStartHandler({ getRouter, defaultRenderHandler: defaultStreamHandler })

app.all('*', async (c) => {
  return startHandler({ request: c.req.raw })
})

export default app

// Minimal Bun + Hono + Arcis app. The `arcisHono` adapter provides rate
// limiting, security headers, and bot protection at the Hono middleware
// layer. Input sanitization (XSS, SQLi, NoSQL, path traversal, command
// injection, SSTI, XXE) is not currently included in this adapter; for
// boundary input sanitization use the Express, FastAPI, Gin, or NestJS
// example. Run with `bun start`, then fire `bun run attack` in another
// shell to see the rate-limit and headers behavior.

import { Hono } from 'hono';
import { arcisHono } from '@arcis/node/bun';

const app = new Hono();

// arcisHono returns Hono middleware: a low-default rate limiter (100
// req/60s in-memory), security headers (CSP, HSTS, X-Frame-Options,
// referrer policy, etc.), and opt-in bot protection. Tighten the limit
// to make the demo visible.
app.use(arcisHono({ rateLimit: { max: 5, windowMs: 60_000 } }));

app.get('/', (c) =>
  c.json({ ok: true, message: 'Arcis is live. Try /api/echo or fire bun run attack.' })
);

// c.req.queries() returns a plain object (Record<string, string[]>),
// not an iterable. Object.fromEntries() needs iterable of [key, value]
// pairs and throws "TypeError: {} is not iterable" on the object
// directly. Return the object as-is.
app.get('/api/echo', (c) => c.json({ query: c.req.queries() }));

app.post('/api/echo', async (c) => {
  const body = await c.req.json();
  return c.json({ received: body });
});

const port = Number(process.env.PORT ?? 3000);
console.log(`arcis-example-bun listening on http://localhost:${port}`);
console.log('In another shell: bun run attack');

export default {
  port,
  fetch: app.fetch,
};

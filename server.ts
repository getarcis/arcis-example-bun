// Minimal Bun + Hono + Arcis app. One install, one middleware line,
// twenty-plus attack vectors blocked. Run with `bun start`, then fire
// `bun run attack` in another shell to see Arcis at work.

import { Hono } from 'hono';
import { arcisHono } from '@arcis/node/bun';

const app = new Hono();

// block:true returns 403 on detected attacks. The default is sanitize
// (silently strip + observe), which is safer to roll out without
// breaking existing clients. We use block here so the demo is visible.
app.use(arcisHono({ block: true } as never));

app.get('/', (c) =>
  c.json({ ok: true, message: 'Arcis is live. Try /api/echo with an attack payload.' })
);

app.get('/api/echo', (c) => c.json({ query: Object.fromEntries(c.req.queries() as never) }));

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

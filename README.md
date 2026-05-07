# arcis-example-bun

> Minimal Bun + Hono + Arcis app. One install, one middleware line, twenty-plus attack vectors blocked.

## What this is

The smallest possible demo of Arcis on Bun + Hono using the [`@arcis/node/bun`](https://github.com/Gagancm/arcis/blob/main/packages/arcis-node/src/middleware/bun.ts) adapter:

- [`server.ts`](./server.ts) — Hono app with `app.use(arcisHono({ block: true }))` as the only security line.
- [`attack.ts`](./attack.ts) — fires 8 attack payloads at the running server and reports which ones Arcis blocks.

The `arcisHono` adapter is one of two entry points in `@arcis/node/bun`: it returns Hono-compatible middleware that runs anywhere Hono runs (Bun, Workers, Deno, Node). The other entry point, `arcisBun`, wraps a `Bun.serve` fetch handler directly without Hono.

## Run it

```bash
bun install
bun start          # listens on http://localhost:3000
bun run attack     # in another shell — fires the demo payloads
```

Expected output:

```
Arcis attack demo against http://localhost:3000
----------------------------------------------------------------
OK     safe     safe input: 200 (passed through, as expected)
BLOCK  xss      <script> in query: 403 (Arcis denied, as expected)
BLOCK  xss      event handler: 403 (Arcis denied, as expected)
BLOCK  sql      '; DROP TABLE users; --: 403 (Arcis denied, as expected)
BLOCK  nosql    { $gt: "" } operator: 403 (Arcis denied, as expected)
BLOCK  path     ../../etc/passwd: 403 (Arcis denied, as expected)
BLOCK  command  ; rm -rf /: 403 (Arcis denied, as expected)
BLOCK  ssti     Jinja2 {{7*7}}: 403 (Arcis denied, as expected)
BLOCK  xxe      DOCTYPE ENTITY: 403 (Arcis denied, as expected)
----------------------------------------------------------------
8 attacks blocked, 1 safe call passed, 0 unexpected
```

## How it works

1. `app.use(arcisHono({ block: true }))` registers the Hono-compatible Arcis middleware: rate limiting, bot detection (opt-in), and the deny path that returns 403 on attack patterns. The middleware mutates `c.res` headers post-`next()` with security defaults.
2. Each request flows through Arcis before reaching your Hono route handler.
3. Safe input passes through unchanged. Attack payloads are detected, blocked at the boundary, and never see the handler.

The same `arcisHono` middleware works on Cloudflare Workers, Deno, and Node when used with their respective Hono adapters. If you're on plain `Bun.serve` without Hono, use the `arcisBun(options, handler)` wrapper instead.

## Production rollout note

This example uses `block: true` so the demo is visible. In production, the safer rollout pattern is to start in the default sanitize-and-observe mode, watch the logs to confirm there are no false positives on real traffic, then flip `block: true`. See the [Arcis docs](https://gagancm.github.io/arcis/documentation/configuration.html) for the full configuration surface.

For multi-framework demos: see [arcis-example-express](https://github.com/getarcis/arcis-example-express), [arcis-example-fastapi](https://github.com/getarcis/arcis-example-fastapi), [arcis-example-gin](https://github.com/getarcis/arcis-example-gin), [arcis-example-nestjs](https://github.com/getarcis/arcis-example-nestjs).

## License

MIT.

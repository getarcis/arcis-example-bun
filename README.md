# arcis-example-bun

> Minimal Bun + Hono + Arcis demo. The `arcisHono` adapter applies rate limiting, security headers, and opt-in bot protection at the Hono middleware layer.

## What this is

A small demo of the [`@arcis/node/bun`](https://github.com/Gagancm/arcis/blob/main/packages/arcis-node/src/middleware/bun.ts) adapter. The adapter exposes two entry points: `arcisHono` (returns Hono-compatible middleware that runs on Bun, Workers, Deno, and Node) and `arcisBun` (wraps a `Bun.serve` fetch handler directly without Hono).

- `server.ts` Hono app with `app.use(arcisHono({ rateLimit: { max: 5, windowMs: 60_000 } }))`.
- `attack.ts` checks two things the adapter actually does: response security headers are present, and the rate limiter blocks the 6th request in the same window.

## What this adapter does and does not do

| Protection | arcisHono | Where to get it |
|------------|-----------|-----------------|
| Rate limiting (per-IP, in-memory) | yes | built in |
| Security headers (CSP, HSTS, X-Frame-Options, etc.) | yes | built in |
| Bot detection (opt-in via `bot: true`) | yes | built in |
| Input sanitization (XSS, SQLi, NoSQL, path traversal, command injection, SSTI, XXE) | no | use the Express, FastAPI, Gin, or NestJS adapter |

If you need boundary input sanitization on a Hono / Bun deployment, run input through the core sanitizers manually inside your handlers, or proxy through one of the request-mutating adapters above.

## Run it

```bash
bun install
bun start          # listens on http://localhost:3000
bun run attack     # in another shell
```

Expected output:

```
Arcis Bun + Hono adapter demo against http://localhost:3000
----------------------------------------------------------------
OK    headers: CSP, X-Frame-Options, X-Content-Type-Options all set
OK    rate-limit: 5 x 200 then 2 x 429 (got 200,200,200,200,200,429,429)
----------------------------------------------------------------
All Arcis Hono adapter checks passed.
```

## How it works

1. `app.use(arcisHono({ rateLimit: { max: 5, windowMs: 60_000 } }))` registers the Hono-compatible Arcis middleware. Every request is checked against the in-memory rate limiter; if exceeded, the request gets a 429 with `Retry-After`. Otherwise the request is passed to the next handler, and after the response is built, security headers are added to `c.res.headers`.
2. The same middleware works on Cloudflare Workers, Deno, and Node when used with their respective Hono adapters. If you are on plain `Bun.serve` without Hono, use the `arcisBun(options, handler)` wrapper instead.

## Production rollout note

For in-memory rate limiting, every Bun process keeps its own counter, so per-process limits diverge from per-cluster limits. Move to a shared store (Redis, Cloudflare Durable Object, etc.) once you are running more than one process. See the [Arcis docs](https://gagancm.github.io/arcis/documentation/configuration.html) for the full configuration surface.

For multi-framework demos: see [arcis-example-express](https://github.com/getarcis/arcis-example-express), [arcis-example-fastapi](https://github.com/getarcis/arcis-example-fastapi), [arcis-example-gin](https://github.com/getarcis/arcis-example-gin), [arcis-example-nestjs](https://github.com/getarcis/arcis-example-nestjs).

## License

MIT.

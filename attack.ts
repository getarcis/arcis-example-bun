// Demo what arcisHono actually catches in this example: rate limiting
// and the presence of security response headers. The Hono adapter does
// not currently run input sanitization, so this script does not assert
// XSS/SQLi blocks. Run after `bun start`.

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const c = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', reset: '\x1b[0m' };

function pass(label: string, detail: string) {
  console.log(`${c.green}OK   ${c.reset} ${label}: ${detail}`);
}

function fail(label: string, detail: string) {
  console.log(`${c.red}FAIL ${c.reset} ${label}: ${detail}`);
}

let failures = 0;

console.log(`\nArcis Bun + Hono adapter demo against ${BASE}\n${'-'.repeat(64)}`);

// 1. Security headers are present on a 200 response.
const probe = await fetch(`${BASE}/api/echo?q=hello`);
const cspPresent = probe.headers.has('content-security-policy');
const xfoPresent = probe.headers.has('x-frame-options');
const xctoPresent = probe.headers.has('x-content-type-options');
if (cspPresent && xfoPresent && xctoPresent) {
  pass('headers', 'CSP, X-Frame-Options, X-Content-Type-Options all set');
} else {
  fail(
    'headers',
    `CSP=${cspPresent} XFO=${xfoPresent} XCTO=${xctoPresent} (expected all true)`,
  );
  failures += 1;
}

// 2. Rate limit kicks in: server is configured for 5 req / 60s, so a
//    burst of 7 should produce 200,200,200,200,200,429,429.
const burst: number[] = [];
for (let i = 0; i < 7; i += 1) {
  const r = await fetch(`${BASE}/api/echo?q=burst-${i}`);
  burst.push(r.status);
}
const okCount = burst.filter((s) => s === 200).length;
const limited = burst.filter((s) => s === 429).length;
if (okCount === 5 && limited === 2) {
  pass('rate-limit', `5 x 200 then 2 x 429 (got ${burst.join(',')})`);
} else {
  fail('rate-limit', `expected [200x5, 429x2], got ${burst.join(',')}`);
  failures += 1;
}

console.log('-'.repeat(64));
if (failures === 0) {
  console.log(`${c.green}All Arcis Hono adapter checks passed.${c.reset}`);
} else {
  console.log(
    `${c.yellow}${failures} check${failures === 1 ? '' : 's'} failed.${c.reset}`,
  );
}
process.exit(failures === 0 ? 0 : 1);

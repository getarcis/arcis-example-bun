// Fire 8 attack payloads at the running Bun server and report which
// ones Arcis blocks. Run after `bun start`. Expected: every attack
// returns 403, every safe payload returns 200.

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const tests: Array<[string, string, () => Promise<Response>, number]> = [
  ['safe', 'safe input', () => fetch(`${BASE}/api/echo?q=hello`), 200],
  ['xss', '<script> in query', () => fetch(`${BASE}/api/echo?q=${encodeURIComponent('<script>alert(1)</script>')}`), 403],
  ['xss', 'event handler', () =>
    fetch(`${BASE}/api/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ x: '<img onerror="alert(1)">' }),
    }), 403],
  ['sql', "'; DROP TABLE users; --", () => fetch(`${BASE}/api/echo?q=${encodeURIComponent("'; DROP TABLE users; --")}`), 403],
  ['nosql', '{ $gt: "" } operator', () =>
    fetch(`${BASE}/api/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: { $gt: '' } }),
    }), 403],
  ['path', '../../etc/passwd', () => fetch(`${BASE}/api/echo?file=${encodeURIComponent('../../etc/passwd')}`), 403],
  ['command', '; rm -rf /', () => fetch(`${BASE}/api/echo?cmd=${encodeURIComponent('hi; rm -rf /')}`), 403],
  ['ssti', 'Jinja2 {{7*7}}', () => fetch(`${BASE}/api/echo?t=${encodeURIComponent('{{7*7}}')}`), 403],
  ['xxe', 'DOCTYPE ENTITY', () =>
    fetch(`${BASE}/api/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        xml: '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      }),
    }), 403],
];

const c = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', reset: '\x1b[0m' };

let blocked = 0,
  allowed = 0,
  unexpected = 0;

console.log(`\nArcis attack demo against ${BASE}\n${'-'.repeat(64)}`);
for (const [category, label, send, expected] of tests) {
  try {
    const res = await send();
    if (res.status === expected) {
      const verb = expected === 200 ? 'OK   ' : 'BLOCK';
      const note = expected === 200 ? 'passed through' : 'Arcis denied';
      console.log(`${c.green}${verb}${c.reset}  ${category.padEnd(8)} ${label}: ${res.status} (${note}, as expected)`);
      if (expected === 200) allowed += 1;
      else blocked += 1;
    } else {
      const word = expected === 200 ? 'WHAT' : 'LEAK';
      console.log(`${c.red}${word}${c.reset}   ${category.padEnd(8)} ${label}: got ${res.status}, expected ${expected}`);
      unexpected += 1;
    }
  } catch (err) {
    console.log(`${c.red}ERR${c.reset}    ${category.padEnd(8)} ${label}: ${(err as Error).message}`);
    unexpected += 1;
  }
}

console.log('-'.repeat(64));
console.log(
  `${c.green}${blocked} attack${blocked === 1 ? '' : 's'} blocked${c.reset}, ${allowed} safe call${allowed === 1 ? '' : 's'} passed, ${c.yellow}${unexpected} unexpected${c.reset}`
);
process.exit(unexpected === 0 ? 0 : 1);

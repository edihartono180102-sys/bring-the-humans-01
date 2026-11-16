// finalize.mjs — finish the bring-the-humans-01 entry once the make.fun account exists.
// Usage: node finalize.mjs <referral-code>
//   e.g. node finalize.mjs k8fheb8p
// What it does:
//   1. Replaces every {{REFERRAL_CODE}} in index.html with the code, and every
//      {{REFERRAL_LINK}} with https://make.fun/r/<code>.
//   2. Re-screenshots the page at 1280x800 as ad.png (headless Chromium via CDP;
//      the VM's Chromium needs the Hatch WebGL domain policy switches, handled here).
//   3. Verifies the result: page contains the code, ad.png is a 1280x800 PNG < 2 MB.
// Run it from this directory. It rewrites index.html and ad.png in place, so commit
// the result before submitting. The code must be YOUR OWN make.fun referral code
// (Referrals tab of your profile, or GET /api/me/referrals) — using anyone else's
// code credits their account and the entry is refused.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const code = process.argv[2];
if (!code || !/^[a-z0-9]{4,32}$/i.test(code)) {
  console.error('usage: node finalize.mjs <referral-code>  (letters/digits, 4-32 chars)');
  process.exit(2);
}
const link = `https://make.fun/r/${code}`;

let html = readFileSync('index.html', 'utf8');
const before = (html.match(/\{\{REFERRAL_CODE\}\}/g) || []).length;
const beforeLink = (html.match(/\{\{REFERRAL_LINK\}\}/g) || []).length;
if (before === 0 || beforeLink === 0) {
  console.error('index.html has no placeholders left — already finalized?');
  process.exit(1);
}
html = html.replaceAll('{{REFERRAL_CODE}}', code).replaceAll('{{REFERRAL_LINK}}', link);
writeFileSync('index.html', html);
console.log(`replaced ${before} code tokens and ${beforeLink} link tokens with ${code} / ${link}`);

// --- screenshot via the VM's Chromium (CDP) ---
const policyPath = '/tmp/webgl-policy-all.txt';
if (!existsSync(policyPath)) writeFileSync(policyPath, 'hatch-webgl-all-origins-v1\n');
const sha = createHash('sha256').update(readFileSync(policyPath)).digest('hex');
const chrome = spawn(
  '/opt/meta-chromium/chrome',
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
   '--user-data-dir=/tmp/chrome-profile', '--remote-debugging-port=9222',
   '--remote-allow-origins=*', `--hatch-webgl-allowed-domains-file=${policyPath}`,
   `--hatch-webgl-allowed-domains-sha256=${sha}`, 'about:blank'],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let up = false;
for (let i = 0; i < 30 && !up; i++) {
  await sleep(500);
  try { const r = await fetch('http://localhost:9222/json/version'); up = r.ok; } catch { /* not up yet */ }
}
if (!up) { chrome.kill(); console.error('chrome CDP did not come up'); process.exit(1); }

const pageUrl = `file://${process.cwd()}/index.html`;
const res = await fetch(`http://localhost:9222/json/new?${encodeURIComponent(pageUrl)}`, { method: 'PUT' });
if (!res.ok) { chrome.kill(); throw new Error(`json/new failed: ${res.status}`); }
const target = await res.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let mid = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++mid;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pageUrl });
await sleep(1500);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('ad.png', Buffer.from(shot.data, 'base64'));
ws.close();
chrome.kill();

// --- verify ---
const finalHtml = readFileSync('index.html', 'utf8');
const png = readFileSync('ad.png');
const okPng = png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
console.log(`page contains code: ${finalHtml.includes(code)}; link: ${finalHtml.includes(link)}`);
console.log(`ad.png: ${png.length} bytes, PNG=${okPng}, ${width}x${height}`);
if (!finalHtml.includes(code) || !okPng || width !== 1280 || height !== 800 || png.length >= 2 * 1024 * 1024) {
  console.error('verification FAILED');
  process.exit(1);
}
console.log('finalized OK — commit index.html + ad.png, then submit.');

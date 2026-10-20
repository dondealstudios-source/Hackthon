import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const temp = mkdtempSync(join(tmpdir(), 'buildfest-test-'));
const port = 3008, base = `http://127.0.0.1:${port}`, password = 'Test-only-unique-password-2027';
let child, cookie;
const person = { name: '=Test Student', email: 'student@example.com', college: 'Test College', location: 'Test City, Test State', phone: '', interest: 'AI & emerging technology', participation: 'individual', consent: 'yes' };
async function request(path, body, auth = false, method = 'POST', headers = {}) {
  return fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: cookie } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
before(async () => {
  child = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(port), NODE_ENV: 'test', ADMIN_PASSWORD: password, DATABASE_PATH: join(temp, 'test.sqlite'), RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_WEBHOOK_SECRET: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; child.stderr.on('data', d => { logs += d; });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(base + '/api/health'); if (r.ok) return; } catch {} await setTimeout(100); }
  throw new Error(`Server failed to start: ${logs}`);
});
after(async () => { child?.kill(); await setTimeout(400); rmSync(temp, { recursive: true, force: true }); });
test('public configuration preserves official facts and closed payments', async () => {
  const c = await (await fetch(base + '/api/config')).json();
  assert.equal(c.fee, 300); assert.equal(c.registrationStatus, 'coming_soon'); assert.equal(c.feeBasis, null);
  assert.equal(c.internships.selectedParticipants, 3); assert.equal(c.internships.statedValue, 20000);
  assert.deepEqual(c.partners.map(p => p.name), ['DONDEAL', 'COMPANY EXPRESS', 'DHARMA SETU']);
  assert.equal(JSON.stringify(c).includes(password), false);
  const r = await request('/api/registration/order', person); assert.equal(r.status, 503);
});
test('server rejects invalid email, missing consent, invalid interest, and bots', async () => {
  for (const changed of [{ email: 'invalid' }, { consent: '' }, { interest: 'invalid' }, { website: 'spam' }]) {
    const r = await request('/api/waitlist', { ...person, ...changed }); assert.equal(r.status, 400);
  }
});
test('waitlist persists and normalizes duplicate email submissions', async () => {
  assert.equal((await request('/api/waitlist', person)).status, 201);
  assert.equal((await request('/api/waitlist', { ...person, email: 'STUDENT@example.com' })).status, 201);
});
test('mentoring questions validate and deduplicate', async () => {
  assert.equal((await request('/api/questions', { ...person, question: 'Short' })).status, 400);
  const question = { ...person, question: 'What costs remain when startup revenue is zero?' };
  assert.equal((await request('/api/questions', question)).status, 201);
  assert.equal((await request('/api/questions', question)).status, 201);
});
test('administrator data and CSV require authentication', async () => {
  assert.equal((await fetch(base + '/api/admin/entries')).status, 401);
  assert.equal((await fetch(base + '/api/admin/export?kind=waitlist')).status, 401);
  assert.equal((await request('/api/admin/login', { password: 'wrong' })).status, 401);
  const login = await request('/api/admin/login', { password }); assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie'); assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /SameSite=Strict/i);
  cookie = setCookie.split(';')[0];
  const data = await (await request('/api/admin/entries', undefined, true, 'GET')).json();
  assert.equal(data.waitlist.length, 1); assert.equal(data.questions.length, 1); assert.equal(data.registrations.length, 0);
  const csv = await (await request('/api/admin/export?kind=waitlist', undefined, true, 'GET')).text();
  assert.match(csv, /'=Test Student/);
});
test('cross-origin updates, malformed JSON, and unconfigured payments are rejected', async () => {
  assert.equal((await request('/api/waitlist', person, false, 'POST', { Origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await fetch(base + '/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await request('/api/registration/verify', { razorpay_order_id: 'fake', razorpay_payment_id: 'fake', razorpay_signature: 'fake' })).status, 503);
  assert.equal((await request('/api/payments/webhook', {})).status, 503);
});
test('configuration persists, validates links, and prevents opening incomplete registration', async () => {
  const c = await (await fetch(base + '/api/config')).json();
  assert.equal((await request('/api/admin/config', { ...c, registrationStatus: 'open' }, true, 'PUT')).status, 400);
  assert.equal((await request('/api/admin/config', { ...c, partners: c.partners.map((partner, i) => i === 0 ? { ...partner, url: 'javascript:alert(1)' } : partner) }, true, 'PUT')).status, 400);
  assert.equal((await request('/api/admin/config', { ...c, dateAnnouncement: 'Test configuration update' }, true, 'PUT')).status, 200);
  const updated = await (await fetch(base + '/api/config')).json(); assert.equal(updated.dateAnnouncement, 'Test configuration update');
});
test('sign-out revokes the session', async () => {
  assert.equal((await request('/api/admin/logout', {}, true)).status, 200);
  assert.equal((await request('/api/admin/entries', undefined, true, 'GET')).status, 401);
});

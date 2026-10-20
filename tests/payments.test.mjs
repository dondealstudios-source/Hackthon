import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
const temp = mkdtempSync(join(tmpdir(), 'buildfest-payments-')), database = join(temp, 'test.sqlite');
const port = 3009, base = `http://127.0.0.1:${port}`, secret = 'test-only-webhook-secret';
let child, db;
before(async () => {
  child = spawn(process.execPath, ['server/index.mjs'], { env: { ...process.env, PORT: String(port), NODE_ENV: 'test', DATABASE_PATH: database, ADMIN_PASSWORD: '', RAZORPAY_KEY_ID: 'test-key', RAZORPAY_KEY_SECRET: 'test-secret', RAZORPAY_WEBHOOK_SECRET: secret }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/api/health')).ok) break; } catch {} await setTimeout(100); }
  db = new DatabaseSync(database);
  db.prepare('INSERT INTO registrations(id,email,details,order_id,amount,status,created_at) VALUES (?,?,?,?,?,?,?)').run('TEST-REGISTRATION-ID', 'test@example.com', '{}', 'order_test', 30000, 'pending', new Date().toISOString());
});
after(async () => { db?.close(); child?.kill(); await setTimeout(400); rmSync(temp, { recursive: true, force: true }); });
async function webhook(payment, event = 'payment.captured', signatureOverride) {
  const body = JSON.stringify({ event, payload: { payment: { entity: payment } } });
  const signature = signatureOverride || createHmac('sha256', secret).update(body).digest('hex');
  return fetch(base + '/api/payments/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature }, body });
}
const payment = { id: 'pay_test', order_id: 'order_test', amount: 30000, currency: 'INR', status: 'captured' };
test('forged frontend payment confirmation and webhook signatures are rejected', async () => {
  const verify = await fetch(base + '/api/registration/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_fake', razorpay_signature: 'forged' }) });
  assert.equal(verify.status, 400);
  assert.equal((await webhook(payment, 'payment.captured', 'forged')).status, 400);
  assert.equal(db.prepare('SELECT status FROM registrations').get().status, 'pending');
});
test('wrong amount, currency, or order cannot confirm a registration', async () => {
  for (const changed of [{ amount: 100 }, { currency: 'USD' }, { order_id: 'unknown' }, { status: 'authorized' }]) assert.equal((await webhook({ ...payment, ...changed })).status, 400);
  assert.equal(db.prepare('SELECT status FROM registrations').get().status, 'pending');
});
test('signed captured payments confirm the registration idempotently', async () => {
  assert.equal((await webhook(payment)).status, 200); assert.equal((await webhook(payment)).status, 200);
  const row = db.prepare('SELECT * FROM registrations').get(); assert.equal(row.status, 'paid'); assert.equal(row.payment_id, 'pay_test'); assert.equal(row.id, 'TEST-REGISTRATION-ID');
});
test('late failed events cannot downgrade a completed registration', async () => {
  assert.equal((await webhook({ ...payment, status: 'failed' }, 'payment.failed')).status, 200);
  assert.equal(db.prepare('SELECT status FROM registrations').get().status, 'paid');
  assert.equal((await webhook({ ...payment, id: 'pay_other' })).status, 400);
});

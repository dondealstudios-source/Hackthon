import express from 'express';
import sheetsRegistration from './sheets-registration.mjs';
import { renderSeoDocument } from './seo.mjs';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(root, '.env'))) loadEnvFile(resolve(root, '.env'));
const defaults = JSON.parse(readFileSync(resolve(root, 'src/config/event.json'), 'utf8'));
const production = process.env.NODE_ENV === 'production';
const submissionsEnabled = process.env.ENABLE_FORM_SUBMISSIONS === 'true';
const checkoutEnabled = process.env.ALLOW_THIRD_PARTY_CHECKOUT === 'true';
if (production && !/^https:\/\/[^/]+\/?$/.test(process.env.PUBLIC_ORIGIN || '')) throw new Error('Production requires PUBLIC_ORIGIN set to the HTTPS website origin.');
const databasePath = resolve(process.env.DATABASE_PATH || resolve(root, 'data/buildfest.sqlite'));
mkdirSync(dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS waitlist (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, college TEXT NOT NULL, location TEXT NOT NULL, phone TEXT, interest TEXT NOT NULL, participation TEXT NOT NULL, consent_at TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, question TEXT NOT NULL, consent_at TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(email,question));
CREATE TABLE IF NOT EXISTS registrations (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, details TEXT NOT NULL, order_id TEXT UNIQUE, payment_id TEXT UNIQUE, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);

function config() { const saved = db.prepare('SELECT value FROM settings WHERE key=?').get('event'); const result = saved ? { ...structuredClone(defaults), ...JSON.parse(saved.value) } : structuredClone(defaults); if (defaults.fee === null && result.fee === 300 && result.feeBasis === null) result.fee = null; result.teamRules = { ...defaults.teamRules, ...result.teamRules, maximum: Math.min(result.teamRules?.maximum ?? 4, 4) }; result.teamSize ||= defaults.teamSize; result.hackathon.teamSize ||= defaults.hackathon.teamSize; result.organizer = { ...defaults.organizer, ...result.organizer }; if (result.organizer.brandLogo === '/assets/vistacortex-organizer.png') result.organizer.brandLogo = defaults.organizer.brandLogo; if (['Online event', 'Offline event'].includes(result.format)) result.format = defaults.format; if (result.schedule.length !== 2 || result.schedule.some(day => /workshop|mentoring|online hackathon/i.test(day.title))) result.schedule = structuredClone(defaults.schedule); result.hackathon.problemStatements ||= defaults.hackathon.problemStatements; result.partners = result.partners.map(partner => { const official = defaults.partners.find(item => item.name === partner.name); return ['DONDEAL', 'COMPANY EXPRESS', 'DHARMA SETU'].includes(partner.name) ? { ...partner, logo: partner.logo || official.logo, url: partner.url || official.url } : partner; }); return result; }
function paymentReady(c = config()) { return Boolean(submissionsEnabled && checkoutEnabled && c.registrationStatus === 'open' && Number.isSafeInteger(c.fee) && c.fee > 0 && c.fee <= 100000 && ['per_participant', 'per_team'].includes(c.feeBasis) && c.rulesAcceptedText && c.eligibility && c.teamSize && Number.isInteger(c.teamRules.minimum) && Number.isInteger(c.teamRules.maximum) && typeof c.teamRules.individualAllowed === 'boolean' && c.registrationDeadline && !Number.isNaN(Date.parse(c.registrationDeadline)) && c.refundPolicy && c.contact.email && c.privacyContact && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET); }
const app = express();
app.disable('x-powered-by');
app.use(helmet({ referrerPolicy: { policy: 'no-referrer' }, contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: checkoutEnabled ? ["'self'", 'https://checkout.razorpay.com'] : ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], connectSrc: checkoutEnabled ? ["'self'", 'https://api.razorpay.com'] : ["'self'"], frameSrc: checkoutEnabled ? ['https://api.razorpay.com', 'https://checkout.razorpay.com'] : ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], fontSrc: ["'self'"], objectSrc: ["'none'"], upgradeInsecureRequests: production ? [] : null } } }));
app.use((_req, res, next) => { res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()'); next(); });
// No proxy trust by default: never accept spoofed client IPs. Configure only for your exact proxy.
if (process.env.TRUST_PROXY_HOPS) { const hops = Number(process.env.TRUST_PROXY_HOPS); if (!Number.isInteger(hops) || hops < 1 || hops > 5) throw new Error('TRUST_PROXY_HOPS must be an integer from 1 to 5.'); app.set('trust proxy', hops); }
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
function sameOrigin(req, res, next) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const allowed = production ? [process.env.PUBLIC_ORIGIN] : ['http://localhost:5173', 'http://127.0.0.1:5173', `http://localhost:${process.env.PORT || 3001}`, `http://127.0.0.1:${process.env.PORT || 3001}`, process.env.PUBLIC_ORIGIN];
    if (!production && /^http:\/\/(localhost|127\.0\.0\.1):[0-9]{1,5}$/.test(req.headers.origin || '')) allowed.push(req.headers.origin);
    if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && !allowed.includes(req.headers.origin))) return res.status(403).json({ error: 'This request must come from the event website.' });
  }
  next();
}
const secureEqual = (a, b) => { const aa = Buffer.from(a || ''), bb = Buffer.from(b || ''); return aa.length === bb.length && timingSafeEqual(aa, bb); };
const hash = text => createHash('sha256').update(text).digest('hex');
const limiter = (limit, windowMs = 60 * 60 * 1000) => rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Please wait and try again.' } });

async function gateway(path, options = {}) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, { ...options, signal: AbortSignal.timeout(15000), headers: { Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`, 'Content-Type': 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error('The payment provider could not process this request. Please retry.');
  return data;
}
function markPaid(payment) {
  const entry = db.prepare('SELECT * FROM registrations WHERE order_id=?').get(payment.order_id);
  if (!entry || payment.amount !== entry.amount || payment.currency !== 'INR' || payment.status !== 'captured') return null;
  if (entry.status === 'paid' && entry.payment_id !== payment.id) return null;
  db.prepare("UPDATE registrations SET status='paid', payment_id=? WHERE id=?").run(payment.id, entry.id);
  return entry.id;
}
app.post('/api/payments/webhook', limiter(300, 60000), express.raw({ type: 'application/json', limit: '64kb' }), (req, res) => {
  if (!submissionsEnabled || !checkoutEnabled) return res.status(503).json({ error: 'Payment processing is disabled.' });
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(503).json({ error: 'Payment webhook is not configured.' });
  if (!Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'Invalid webhook body.' });
  const signature = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest('hex');
  if (!secureEqual(signature, req.headers['x-razorpay-signature'])) return res.status(400).json({ error: 'Invalid payment signature.' });
  let event; try { event = JSON.parse(req.body.toString()); } catch { return res.status(400).json({ error: 'Invalid webhook body.' }); }
  const payment = event.payload?.payment?.entity;
  if (event.event === 'payment.captured' && !markPaid(payment || {})) return res.status(400).json({ error: 'Payment does not match an existing order.' });
  if (event.event === 'payment.failed' && payment?.order_id) db.prepare("UPDATE registrations SET status='failed' WHERE order_id=? AND status!='paid'").run(payment.order_id);
  return res.json({ received: true });
});
app.use('/api', sameOrigin, express.json({ limit: '64kb' }));
app.get('/api/registration/submit', (req, res) => sheetsRegistration(req, res, config()));
app.post('/api/registration/submit', limiter(20), (req, res) => sheetsRegistration(req, res, config()));
app.get('/api/privacy-status', (_req, res) => res.json({ formSubmissionsEnabled: submissionsEnabled, paymentCheckoutEnabled: submissionsEnabled && checkoutEnabled }));
app.use(['/api/waitlist', '/api/questions', '/api/registration/order', '/api/registration/verify', '/api/payments/webhook'], (req, res, next) => { if (req.method === 'POST' && !submissionsEnabled) return res.status(503).json({ error: 'Submissions are not open yet. Participant details are not being collected.' }); next(); });
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', (_req, res) => res.json(config()));
app.get('/api/payment-status', (_req, res) => res.json({ ready: paymentReady() }));

const text = (value, max, min = 1) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max ? value.trim() : null;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validatePerson(body, question = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please complete the required fields.');
  if (body.website) throw new Error('Submission could not be accepted.');
  const name = text(body.name, 100, 2), email = text(body.email, 254)?.toLowerCase();
  if (!name || !email || !emailPattern.test(email)) throw new Error('Enter a full name and a valid email address.');
  if (body.consent !== 'yes') throw new Error('Consent is required to submit your details.');
  if (question) { const q = text(body.question, 2000, 10); if (!q) throw new Error('Your question must be between 10 and 2,000 characters.'); return { name, email, question: q }; }
  const college = text(body.college, 160), location = text(body.location, 160);
  const interests = ['AI & emerging technology', 'Web / app development', 'Startups & entrepreneurship', 'Hackathon & prototyping', 'Exploring all of it', ...config().hackathon.problemStatements.split(/\r?\n/).map(line => line.trim()).filter(Boolean)];
  if (!college || !location || !interests.includes(body.interest) || !['individual', 'team'].includes(body.participation)) throw new Error('Complete your institution, city and state, interest area, and participation preference.');
  if (body.phone !== undefined && typeof body.phone !== 'string') throw new Error('Enter a valid phone number or leave it empty.');
  const phone = body.phone?.trim() || '';
  if (phone && !/^[+0-9 ()-]{7,20}$/.test(phone)) throw new Error('Enter a valid phone number or leave it empty.');
  return { name, email, college, location, phone, interest: body.interest, participation: body.participation };
}
app.post('/api/waitlist', limiter(12), (req, res) => {
  let person; try { person = validatePerson(req.body); } catch (err) { return res.status(400).json({ error: err.message }); }
  const now = new Date().toISOString();
  db.prepare('INSERT OR IGNORE INTO waitlist VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(), person.name, person.email, person.college, person.location, person.phone, person.interest, person.participation, now, now);
  return res.status(201).json({ message: 'Your interest is saved. The organizers can include you in event updates when registration opens. Repeated submissions won’t create duplicate entries.' });
});
app.post('/api/questions', limiter(8), (req, res) => {
  let person; try { person = validatePerson(req.body, true); } catch (err) { return res.status(400).json({ error: err.message }); }
  const now = new Date().toISOString();
  db.prepare('INSERT OR IGNORE INTO questions VALUES (?,?,?,?,?,?)').run(randomUUID(), person.name, person.email, person.question, now, now);
  res.status(201).json({ message: 'Your question has been saved for the organizers to review for the mentoring session. Duplicate questions are recorded only once.' });
});

app.post('/api/registration/order', limiter(10), async (req, res) => {
  const c = config();
  if (!paymentReady(c)) return res.status(503).json({ error: 'Paid registration is not active. The organizer must confirm the fee basis, rules, policies, and payment setup first. Please join the waitlist for updates.' });
  if (Date.now() > Date.parse(c.registrationDeadline)) return res.status(409).json({ error: 'The registration deadline has passed. Contact the organizers for updates.' });
  let person; try { person = validatePerson(req.body); } catch (err) { return res.status(400).json({ error: err.message }); }
  if (req.body.rules !== 'yes') return res.status(400).json({ error: 'Accept the finalized rules before continuing.' });
  const teamName = text(req.body.teamName, 120);
  if (person.participation === 'team' && !teamName) return res.status(400).json({ error: 'Enter your team name.' });
  if (person.participation === 'team' && req.body.teamConsent !== 'yes') return res.status(400).json({ error: 'Confirm permission to submit team members’ details.' });
  const teamMembers = person.participation === 'team' ? text(req.body.teamMembers, 10000)?.split('\n').map(line => line.trim()).filter(Boolean).map(line => { const [name, email] = line.split('|').map(s => s.trim()); return { name, email: email?.toLowerCase() }; }) : [];
  if (person.participation === 'team' && (!teamMembers?.length || teamMembers.length > 100 || teamMembers.some(m => !text(m.name, 100, 2) || !text(m.email, 254) || !emailPattern.test(m.email)) || new Set(teamMembers.map(m => m.email)).size !== teamMembers.length || !teamMembers.some(m => m.email === person.email))) return res.status(400).json({ error: 'Enter each team member as Full name | email on a separate line. Include yourself and use unique valid email addresses.' });
  if (person.participation === 'individual' && !c.teamRules.individualAllowed) return res.status(400).json({ error: 'Finalized rules require team participation.' });
  if (person.participation === 'team' && (teamMembers.length < c.teamRules.minimum || teamMembers.length > c.teamRules.maximum)) return res.status(400).json({ error: `Teams must contain ${c.teamRules.minimum} to ${c.teamRules.maximum} members under the finalized rules.` });
  const existing = db.prepare('SELECT * FROM registrations WHERE email=?').get(person.email);
  if (existing?.status === 'paid') return res.status(409).json({ error: 'A completed registration exists for these details. Contact the organizers before making another payment.' });
  if (existing && JSON.parse(existing.details).name !== person.name) return res.status(409).json({ error: 'An order already exists with different details. Contact the organizers to update it.' });
  if (existing?.order_id) return res.json({ orderId: existing.order_id, amount: existing.amount, key: process.env.RAZORPAY_KEY_ID });
  const registrationId = existing?.id || `VCBF-${randomUUID()}`;
  const amount = c.fee * 100;
  // Reserve the unique email BEFORE contacting the gateway. Parallel submissions cannot create two orders.
  if (existing) return res.status(409).json({ error: 'An order is being prepared. Please retry shortly or contact the organizers if it remains pending.' });
  const details = { ...person, teamName, teamMembers, feeBasis: c.feeBasis, rules: c.rulesAcceptedText, consentAt: new Date().toISOString() };
  try { db.prepare('INSERT INTO registrations(id,email,details,amount,status,created_at) VALUES (?,?,?,?,?,?)').run(registrationId, person.email, JSON.stringify(details), amount, 'pending', new Date().toISOString()); }
  catch { return res.status(409).json({ error: 'A registration request is already in progress. Please retry shortly.' }); }
  try {
    const order = await gateway('orders', { method: 'POST', body: JSON.stringify({ amount, currency: 'INR', receipt: registrationId.slice(0, 40) }) });
    if (order.amount !== amount || order.currency !== 'INR' || !order.id) throw new Error('The payment order could not be verified.');
    db.prepare('UPDATE registrations SET order_id=? WHERE id=?').run(order.id, registrationId);
    res.json({ orderId: order.id, amount, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    // Ambiguous provider timeouts remain reserved for organizer reconciliation; never create a second order blindly.
    db.prepare("UPDATE registrations SET status='failed' WHERE id=?").run(registrationId);
    res.status(502).json({ error: `${err.message} If an order remains pending, contact the organizers before trying another payment.` });
  }
});
app.post('/api/registration/verify', limiter(30), async (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ error: 'Payments are not configured.' });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (![orderId, paymentId, signature].every(v => typeof v === 'string' && v.length <= 200)) return res.status(400).json({ error: 'Invalid payment details.' });
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  if (!secureEqual(expected, signature)) return res.status(400).json({ error: 'Payment signature could not be verified.' });
  try {
    const payment = await gateway(`payments/${encodeURIComponent(paymentId)}`);
    if (payment.order_id !== orderId || payment.id !== paymentId) return res.status(400).json({ error: 'Payment order mismatch.' });
    const id = markPaid(payment);
    if (!id) return res.status(409).json({ error: 'Payment is not yet confirmed as captured for the correct amount. The organizer will reconcile it through the payment webhook. Do not pay again.' });
    return res.json({ registrationId: id, status: 'paid' });
  } catch (err) { res.status(502).json({ error: err.message }); }
});

const organizerSessionLifetime = 60 * 60 * 1000;
function authorize(req, res, next) {
  const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: 'Organizer authentication required.' });
  const session = db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(token), Date.now());
  if (!session) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  req.sessionHash = hash(token); next();
}
const passwordSalt = randomBytes(32);
const passwordHash = process.env.ADMIN_PASSWORD?.length >= 16 ? scryptSync(process.env.ADMIN_PASSWORD, passwordSalt, 64) : null;
app.post('/api/admin/login', limiter(8, 15 * 60 * 1000), (req, res) => {
  if (!passwordHash) return res.status(503).json({ error: 'Organizer access is not configured. Set ADMIN_PASSWORD to a unique password of at least 16 characters on the server.' });
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length > 512 || !timingSafeEqual(scryptSync(password, passwordSalt, 64), passwordHash)) return res.status(401).json({ error: 'Incorrect organizer password.' });
  db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
  const token = randomBytes(32).toString('hex'); db.prepare('INSERT INTO sessions VALUES (?,?)').run(hash(token), Date.now() + organizerSessionLifetime);
  res.json({ ok: true, sessionToken: token });
});
app.use('/api/admin', authorize);
app.post('/api/admin/logout', (req, res) => { db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.sessionHash); res.json({ ok: true }); });
function entries() { return { waitlist: db.prepare('SELECT * FROM waitlist ORDER BY created_at DESC').all(), questions: db.prepare('SELECT * FROM questions ORDER BY created_at DESC').all(), registrations: db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all().map(r => ({ ...r, ...JSON.parse(r.details), details: undefined })) }; }
app.get('/api/admin/entries', (_req, res) => res.json(entries()));
const csvCell = value => { let s = value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''); if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"', '""')}"`; };
app.get('/api/admin/export', (req, res) => {
  if (!['waitlist', 'questions', 'registrations'].includes(req.query.kind)) return res.status(400).json({ error: 'Invalid export type.' });
  const rows = entries()[req.query.kind]; const columns = rows.length ? Object.keys(rows[0]).filter(k => k !== 'details') : ['id', 'created_at'];
  const csv = [columns.map(csvCell).join(','), ...rows.map(row => columns.map(k => csvCell(row[k])).join(','))].join('\r\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="buildfest-${req.query.kind}.csv"` }).send('\uFEFF' + csv);
});
function validateConfig(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('Configuration must be an object.');
  function shape(value, base, key = '') {
    if (key === 'fee') { if (value !== null && (!Number.isSafeInteger(value) || value <= 0 || value > 100000)) throw new Error('Fee must be a positive whole number of rupees or null.'); return; }
    if (base === null) { if (['winnerCount', 'minimum', 'maximum'].includes(key)) { if (value !== null && (!Number.isSafeInteger(value) || value < 1 || value > 10000)) throw new Error(`${key} must be a positive integer or null.`); return; } if (key === 'individualAllowed') { if (value !== null && typeof value !== 'boolean') throw new Error('individualAllowed must be true, false, or null.'); return; } if (value !== null && (typeof value !== 'string' || value.length > 10000)) throw new Error(`${key} must be text or null.`); return; }
    if (Array.isArray(base)) {
      if (!Array.isArray(value) || value.length > 100) throw new Error(`${key} must be an array with at most 100 items.`);
      const template = base[0] || (key === 'socials' ? { name: '', url: '' } : '');
      value.forEach(v => shape(v, template, key)); return;
    }
    if (typeof base === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${key} must be an object.`);
      if (Object.keys(value).some(k => !Object.hasOwn(base, k)) || Object.keys(base).some(k => !Object.hasOwn(value, k))) throw new Error(`${key || 'Configuration'} contains missing or unknown fields.`);
      for (const k of Object.keys(base)) shape(value[k], base[k], k); return;
    }
    if (typeof value !== typeof base || (typeof value === 'string' && value.length > 10000)) throw new Error(`${key} has an invalid value.`);
  }
  shape(c, defaults);
  if (!['coming_soon', 'open', 'closed'].includes(c.registrationStatus)) throw new Error('Invalid registration status.');
  if (c.feeBasis !== null && !['per_participant', 'per_team'].includes(c.feeBasis)) throw new Error('feeBasis must be per_participant, per_team, or null.');
  if (c.fee !== null && (!Number.isSafeInteger(c.fee) || c.fee <= 0 || c.fee > 100000)) throw new Error('Fee must be a positive whole number of rupees or null.');
  if (!Number.isSafeInteger(c.internships.selectedParticipants) || c.internships.selectedParticipants < 1 || !Number.isSafeInteger(c.internships.statedValue) || c.internships.statedValue < 0) throw new Error('Invalid internship numbers.');
  if (c.teamRules.minimum !== null && c.teamRules.maximum !== null && (c.teamRules.minimum > c.teamRules.maximum || c.teamRules.maximum > 100)) throw new Error('Team bounds must be ordered and at most 100 members.');
  if (c.registrationDeadline && (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(c.registrationDeadline) || Number.isNaN(Date.parse(c.registrationDeadline)))) throw new Error('Use an ISO date and time with timezone for registrationDeadline.');
  if (c.schedule.length !== 2 || c.partners.length !== 3) throw new Error('Keep two hackathon days and three official partners.');
  if (c.partners.map(p => p.name).join('|') !== 'DONDEAL|COMPANY EXPRESS|DHARMA SETU' || c.organizer.name !== 'VistaCortex') throw new Error('Preserve the official organizer and partner names.');
  for (const logo of [c.organizer.logo, c.organizer.brandLogo, ...c.partners.map(p => p.logo)]) if (logo && (!/^\/(?!\/)[a-zA-Z0-9_./ -]+$/.test(logo) || logo.includes('..'))) throw new Error('Logos must use safe local public asset paths, starting with /.');
  for (const url of [c.organizer.url, ...c.socials.map(s => s.url), ...c.partners.map(p => p.url)]) if (url) { let parsed; try { parsed = new URL(url); } catch { throw new Error('Links must be valid HTTPS URLs.'); } if (parsed.protocol !== 'https:') throw new Error('Links must use HTTPS.'); }
  for (const email of [c.contact.email, c.privacyContact]) if (email && !emailPattern.test(email)) throw new Error('Contact fields must contain valid email addresses.');
  if (c.registrationStatus === 'open' && !paymentReady(c)) throw new Error('Before opening registration, configure payment credentials, fee basis, eligibility, team-size rules, deadline, rules, refund policy, contact email, and privacy contact.');
  return c;
}
app.put('/api/admin/config', (req, res) => {
  try { const c = validateConfig(req.body); db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('event', JSON.stringify(c)); res.json({ ok: true }); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
if (existsSync(resolve(root, 'dist/index.html'))) {
  app.use(express.static(resolve(root, 'dist'), { index: false }));
  app.get(['/', '/faq', '/faq/', '/register', '/register/', '/organizer'], (req, res) => { if (req.path === '/organizer') res.set('X-Robots-Tag', 'noindex, nofollow'); res.type('html').send(renderSeoDocument(readFileSync(resolve(root, 'dist/index.html'), 'utf8'), config(), req.path)); });
}
app.use((err, _req, res, _next) => { res.status(err.status || 500).json({ error: err.status === 400 ? 'Invalid request body.' : err.status === 413 ? 'Submission is too large.' : 'The server could not save this request. Please retry.' }); });
const server = app.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log(`BuildFeast server ready on http://127.0.0.1:${process.env.PORT || 3001}`));
function shutdown() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);

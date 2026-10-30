import { readFileSync } from 'node:fs';
const defaults = JSON.parse(readFileSync(new URL('../src/config/event.json', import.meta.url), 'utf8'));
const attempts = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function sheetsRegistrationEnabled() {
  return process.env.ENABLE_REGISTRATION_SUBMISSIONS === 'true' && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(process.env.REGISTRATION_SHEETS_URL || '') && (process.env.REGISTRATION_SHEETS_SECRET || '').length >= 32;
}
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function text(value, label, max, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail('Please check ' + label + '.');
  return value.trim();
}
export function validateSheetEntry(body, config = defaults) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Invalid registration details.');
  if (body.website) fail('Unable to accept this entry.');
  const requestId = text(body.requestId, 'the entry reference', 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)) fail('Reload the page and try again.');
  const name = text(body.name, 'your name', 100, 2), email = text(body.email, 'your email address', 254).toLowerCase();
  if (!emailPattern.test(email)) fail('Please enter a valid email address.');
  const college = text(body.college, 'your institution', 160, 2), location = text(body.location, 'your city and state', 160, 2);
  const phone = body.phone ? text(body.phone, 'your phone number', 20, 7) : '';
  if (phone && !/^[+0-9 ()-]{7,20}$/.test(phone)) fail('Please check your phone number.');
  const interest = text(body.interest, 'your problem statement', 200);
  if (!(config.hackathon.problemStatements || '').split(/\r?\n/).map(item => item.trim()).includes(interest)) fail('Choose one of the listed problem statements.');
  if (!['individual', 'team'].includes(body.participation)) fail('Choose individual or team participation.');
  if (body.consent !== true) fail('Please consent to storing your registration details.');
  let teamName = '', teamMembers = [];
  if (body.participation === 'team') {
    teamName = text(body.teamName, 'your team name', 120, 2);
    if (!Array.isArray(body.teamMembers) || body.teamMembers.length > 3) fail('Teams can have up to 4 members, including the team lead.');
    teamMembers = body.teamMembers.map(member => {
      if (!member || typeof member !== 'object') fail('Please check your team members.');
      const memberName = text(member.name, 'each teammate’s name', 100, 2), memberEmail = text(member.email, 'each teammate’s email', 254).toLowerCase();
      if (!emailPattern.test(memberEmail)) fail('Please check each teammate’s email address.');
      const memberPhone = member.phone ? text(member.phone, 'each teammate’s phone number', 20, 7) : '';
      if (memberPhone && !/^[+0-9 ()-]{7,20}$/.test(memberPhone)) fail('Please check each teammate’s phone number.');
      return { name: memberName, email: memberEmail, phone: memberPhone };
    });
    const emails = [email, ...teamMembers.map(member => member.email)];
    if (new Set(emails).size !== emails.length) fail('Use a different email address for each team member.');
    if (teamMembers.length && body.teamConsent !== true) fail('Please confirm you have each teammate’s permission.');
    const count = teamMembers.length + 1;
    if (config.teamRules.minimum !== null && count < config.teamRules.minimum) fail('Your team has fewer members than the event permits.');
    if (config.teamRules.maximum !== null && count > config.teamRules.maximum) fail('Your team has more members than the event permits.');
  } else if (config.teamRules.individualAllowed === false) fail('Individual registration is not available for this event.');
  return { requestId, name, email, college, location, phone, participation: body.participation, teamName, teamMembers, interest, consentAt: new Date().toISOString(), teamConsent: body.participation === 'team' && body.teamConsent === true };
}
export default async function sheetsRegistration(req, res, config = defaults) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET') return res.status(200).json({ enabled: sheetsRegistrationEnabled() && config.registrationStatus !== 'closed' });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  if (!sheetsRegistrationEnabled() || config.registrationStatus === 'closed') return res.status(503).json({ error: 'Registration submissions are not open yet.' });
  try {
    const origin = req.headers.origin;
    const host = req.headers.host;
    const allowed = new Set([process.env.PUBLIC_ORIGIN, host ? 'https://' + host : '']);
    if (process.env.NODE_ENV !== 'production' && host) allowed.add('http://' + host);
    if (req.headers['sec-fetch-site'] === 'cross-site' || (origin && !allowed.has(origin))) fail('Submit your entry from the event website.', 403);
    if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) fail('Please submit JSON registration details.', 415);
    if (Number(req.headers['content-length'] || 0) > 32768) fail('Your entry is too large.', 413);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (JSON.stringify(body || {}).length > 32768) fail('Your entry is too large.', 413);
    const entry = validateSheetEntry(body, config);
    // Best-effort instance-local limit; the Express server also applies its shared limiter.
    const now = Date.now(), key = entry.email;
    for (const [email, value] of attempts) if (value.expires < now) attempts.delete(email);
    const count = attempts.get(key) || { count: 0, expires: now + 600000 };
    if (count.count >= 6 || attempts.size > 5000) fail('Please wait a few minutes before trying again.', 429);
    count.count++; attempts.set(key, count);
    const registrationId = 'BF27-' + entry.requestId.replaceAll('-', '').slice(0, 12).toUpperCase();
    let response;
    try {
      response = await fetch(process.env.REGISTRATION_SHEETS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: process.env.REGISTRATION_SHEETS_SECRET, registrationId, ...entry }), redirect: 'follow', signal: AbortSignal.timeout(18000) });
    } catch { fail('We couldn’t confirm your entry. Keep this page open and retry safely.', 502); }
    let result;
    try { result = await response.json(); } catch { fail('The registration service is temporarily unavailable. Please retry.', 502); }
    if (!response.ok || !result || result.ok !== true || result.registrationId !== registrationId) {
      if (result?.code === 'ENTRY_CHANGED') fail('An earlier version of this entry was already received. Contact the organizers to change it.', 409);
      if (result?.code === 'DUPLICATE_EMAIL') fail('This email already has an entry. Contact the organizers before registering again.', 409);
      fail('We couldn’t confirm your entry. Keep this page open and retry safely.', 502);
    }
    return res.status(201).json({ registrationId, message: 'Your entry has been received. Final event details and any payment instructions will be announced separately.' });
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.status ? error.message : 'Please check your registration details and try again.' });
  }
}

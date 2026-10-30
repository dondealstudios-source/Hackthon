// Paste into Extensions > Apps Script in the event registration spreadsheet.
const SPREADSHEET_ID = '1A-z-BM13Nj8y9DAM_-DX3ouGfQE6ulT9CVxOjB25sAQ';
const TAB_NAME = 'Registrations';
const HEADERS = ['Registration ID', 'Request ID', 'Submitted at (UTC)', 'Full name', 'Email', 'Phone', 'Institution', 'City and state', 'Participation', 'Team name', 'Team size', 'Teammates (JSON)', 'Problem statement', 'Consent at (UTC)', 'Teammate consent', 'Entry status', 'Entry fingerprint'];

function setupRegistrationSheet() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('REGISTRATION_SECRET')) properties.setProperty('REGISTRATION_SECRET', Utilities.getUuid() + Utilities.getUuid());
  const sheet = registrationSheet_();
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#245b3d').setFontColor('#ffffff');
  sheet.autoResizeColumns(1, HEADERS.length);
  console.log('Setup complete. Copy REGISTRATION_SECRET from Project Settings > Script properties to your server environment. Do not share it publicly.');
}
function registrationSheet_() {
  const workbook = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = workbook.getSheetByName(TAB_NAME) || workbook.insertSheet(TAB_NAME);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  else if (sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) throw new Error('Unexpected registration columns.');
  return sheet;
}
function reply_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function cell_(value) {
  const text = String(value == null ? '' : value);
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}
function doGet() { return reply_({ ok: true, service: 'BuildFeast registration' }); }
function doPost(event) {
  let lock;
  try {
    if (!event || !event.postData || event.postData.contents.length > 40000) return reply_({ ok: false, code: 'INVALID_REQUEST' });
    const entry = JSON.parse(event.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('REGISTRATION_SECRET');
    if (!expected || typeof entry.secret !== 'string' || entry.secret !== expected) return reply_({ ok: false, code: 'UNAUTHORIZED' });
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(entry.requestId || '') || !/^BF27-[A-F0-9]{12}$/.test(entry.registrationId || '') || !entry.name || !entry.email || !entry.consentAt || !Array.isArray(entry.teamMembers) || entry.teamMembers.length > 3) return reply_({ ok: false, code: 'INVALID_ENTRY' });
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const sheet = registrationSheet_();
    const lastRow = sheet.getLastRow();
    const fingerprint = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify([entry.name, entry.email, entry.phone, entry.college, entry.location, entry.participation, entry.teamName, entry.teamMembers, entry.interest, entry.teamConsent])));
    if (lastRow > 1) {
      const retry = sheet.getRange(2, 2, lastRow - 1, 1).createTextFinder(entry.requestId).matchEntireCell(true).findNext();
      if (retry) { if (sheet.getRange(retry.getRow(), 17).getDisplayValue() !== fingerprint) return reply_({ ok: false, code: 'ENTRY_CHANGED' }); return reply_({ ok: true, registrationId: sheet.getRange(retry.getRow(), 1).getDisplayValue() }); }
      const duplicate = sheet.getRange(2, 5, lastRow - 1, 1).createTextFinder(entry.email).matchCase(false).matchEntireCell(true).findNext();
      if (duplicate) return reply_({ ok: false, code: 'DUPLICATE_EMAIL' });
    }
    const row = [entry.registrationId, entry.requestId, new Date().toISOString(), entry.name, entry.email, entry.phone, entry.college, entry.location, entry.participation, entry.teamName, entry.teamMembers.length + 1, JSON.stringify(entry.teamMembers), entry.interest, entry.consentAt, entry.teamConsent ? 'Yes' : 'Not applicable', 'Entry received — payment not collected', fingerprint].map(cell_);
    sheet.getRange(lastRow + 1, 1, 1, HEADERS.length).setNumberFormat('@').setValues([row]);
    SpreadsheetApp.flush();
    return reply_({ ok: true, registrationId: entry.registrationId });
  } catch (_) {
    // Keep sheet contents and owner/account details out of public responses.
    return reply_({ ok: false, code: 'TEMPORARILY_UNAVAILABLE' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

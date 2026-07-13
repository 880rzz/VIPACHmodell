/**
 * modell.vipach.at — Application form backend (ENGLISH)
 * "In the Footsteps of Great Photographers" — VIPACH year-end exhibition
 *
 * SETUP:
 * 1. Create a Google Sheet, e.g. "Applications EN — modell.vipach.at"
 * 2. In the sheet: Extensions → Apps Script → clear the editor, paste this file
 * 3. Check the email address in CONFIG below
 * 4. Deploy → New deployment → Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the resulting /exec URL into SCRIPT_URLS.en in index.html
 *
 * Note: on first run Google will ask you to authorise access to the
 * Sheet and MailApp — approve it once.
 */

var CONFIG = {
  NOTIFY_EMAIL: 'office@vipach.at',
  FROM_NAME: 'VIPACH — In the Footsteps of Great Photographers',
  SHEET_NAME: 'Applications',
  MAX_FIELD_LENGTH: 3000
};

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    // Statisztika: az oldal aljáig görgetők számlálása (nincs e-mail, nincs személyes adat)
    if (p.event === 'scroll_bottom') {
      recordScrollStat();
      return jsonResponse({ ok: true });
    }

    // Honeypot: the "website" field is hidden; humans never fill it
    if (p.website) return jsonResponse({ ok: true });

    var name  = clean(p.name);
    var email = clean(p.email);
    var phone = clean(p.phone);
    var city  = clean(p.city);
    var pageLang = clean(p.page_language);
    var message = clean(p.message);

    if (!name || !email || !city || !isValidEmail(email)) {
      return jsonResponse({ ok: false, error: 'missing_fields' });
    }

    // 1) Log to the sheet
    var sheet = getSheet();
    sheet.appendRow([
      new Date(), name, email, phone, city, pageLang, message,
      'English page', 'new'
    ]);

    // 2) Confirmation email to the applicant
    MailApp.sendEmail({
      to: email,
      subject: 'We have received your application — In the Footsteps of Great Photographers | VIPACH',
      name: CONFIG.FROM_NAME,
      replyTo: CONFIG.NOTIFY_EMAIL,
      body:
        'Dear ' + name + ',\n\n' +
        'Thank you for applying to "In the Footsteps of Great Photographers", our exclusive photo project and year-end exhibition!\n\n' +
        'Your application details:\n' +
        '• Name: ' + name + '\n' +
        '• Email: ' + email + '\n' +
        (phone ? '• Phone: ' + phone + '\n' : '') +
        '• Place of residence: ' + city + '\n\n' +
        'Important: this email confirms that your application has been received. It does not constitute selection ' +
        'and does not create any payment obligation.\n\n' +
        'Places are limited (20 participants) and the application deadline is 31 August 2026. We respond to every application within 48 hours; if you are selected, ' +
        'you will receive a separate confirmation email containing the online payment link for the EUR 299 participation fee. ' +
        'The fee is paid to the account of the maintaining organisation of the VIPACH Photo Club, the Hungarian School of Vienna (www.magyariskola.at).\n\n' +
        'The exhibition will take place in November 2026 in a gallery in Vienna. Its patron and curator is fine art photographer Norbert Bánhalmi.\n\n' +
        'If you have any questions, feel free to write to us: ' + CONFIG.NOTIFY_EMAIL + '\n\n' +
        'Best regards,\n' +
        'The VIPACH team\n' +
        'Vienna Photo Art & Creative Hub\n' +
        'https://www.vipach.at'
    });

    // 3) Notification to the organisers
    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: '[modell.vipach.at] New application (EN): ' + name,
      name: CONFIG.FROM_NAME,
      replyTo: email,
      body:
        'A new application has arrived from the English page.\n\n' +
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Phone: ' + (phone || '—') + '\n' +
        'City: ' + city + '\n' +
        'Page language: ' + (pageLang || '—') + '\n' +
        'Message:\n' + (message || '—') + '\n\n' +
        'Sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });

    return jsonResponse({ ok: true });

  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/* ---------- helpers ---------- */

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'City',
                     'Page language', 'Message', 'Source', 'Status']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}

function clean(v) {
  if (!v) return '';
  return String(v).substring(0, CONFIG.MAX_FIELD_LENGTH).trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Napi bontásban számolja, hányan görgettek az oldal aljáig.
 * Az eredmény a(z) "Statistics" munkalapon látható.
 */
function recordScrollStat() {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return; }
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Statistics');
    if (!sh) {
      sh = ss.insertSheet('Statistics');
      sh.appendRow(['Date', 'Scrolled to bottom']);
      sh.setFrozenRows(1);
      sh.getRange('1:1').setFontWeight('bold');
    }
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var last = sh.getLastRow();
    var cell = last > 1 ? sh.getRange(last, 1).getValue() : null;
    var cellStr = (cell instanceof Date)
      ? Utilities.formatDate(cell, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(cell || '');
    if (last > 1 && cellStr === today) {
      var c = sh.getRange(last, 2);
      c.setValue(Number(c.getValue()) + 1);
    } else {
      sh.appendRow([today, 1]);
    }
  } finally {
    lock.releaseLock();
  }
}

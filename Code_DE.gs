/**
 * modell.vipach.at — Bewerbungsformular-Backend (DEUTSCH)
 * „Auf den Spuren großer Fotokünstler“ — VIPACH Jahresabschluss-Ausstellung
 *
 * Diese Version verwendet KEIN Google Sheet. Die Bewerbungsdaten werden nur
 * in zwei E-Mails übermittelt: als Bestätigung an die bewerbende Person und
 * als Benachrichtigung an office@vipach.at.
 *
 * EINRICHTUNG:
 * 1. Diese Datei in ein eigenständiges Google-Apps-Script-Projekt einfügen.
 * 2. testConfigurationAndEmail einmal manuell ausführen und MailApp erlauben.
 * 3. Bereitstellen → Bereitstellungen verwalten → Bearbeiten
 *    → Neue Version → Bereitstellen.
 * 4. Ausführen als: Ich; Zugriff: Jeder.
 */

var CONFIG = {
  NOTIFY_EMAIL: 'office@vipach.at',
  FROM_NAME: "VIPACH — Auf den Spuren großer Fotokünstler",
  MAX_FIELD_LENGTH: 3000,
  CALLBACK_URL: 'https://modell.vipach.at/form-callback/',
  BACKEND_VERSION: '2026-07-15-v6-mail-only'
};

function doGet() {
  return jsonResponse({
    ok: true,
    language: "de",
    message: "VIPACH DE E-Mail-Backend ist erreichbar",
    version: CONFIG.BACKEND_VERSION,
    storage: 'none',
    mail_quota_remaining: MailApp.getRemainingDailyQuota()
  });
}

function doPost(e) {
  var submitToken = '';
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    submitToken = clean(p.submit_token);

    // Backward compatibility: the previous frontend sent an anonymous footer event.
    // No statistics are stored in this mail-only version.
    if (p.event === 'scroll_bottom') {
      return jsonResponse({ ok: true, ignored: true, version: CONFIG.BACKEND_VERSION });
    }

    // Honeypot: silently acknowledge automated submissions without sending mail.
    if (p.website) {
      return formResponse({
        status: 'ok', processed: true,
        applicant_mail: 'sent', office_mail: 'sent', token: submitToken
      });
    }

    var name = clean(p.name);
    var email = clean(p.email);
    var phone = clean(p.phone);
    var city = clean(p.city);
    var pageLang = clean(p.page_language);
    var message = clean(p.message);
    var ageConfirmed = clean(p.age_confirmed);
    var termsAccepted = clean(p.terms_accepted);
    var privacyAcknowledged = clean(p.privacy_acknowledged);
    var noticeVersion = clean(p.notice_version);
    var submittedAt = new Date().toISOString();

    if (!name || !email || !city || !isValidEmail(email) ||
        ageConfirmed !== 'yes' || termsAccepted !== '2026-07-13' ||
        privacyAcknowledged !== '2026-07-13' || noticeVersion !== '2026-07-13') {
      return formResponse({
        status: 'validation_error', processed: false,
        applicant_mail: 'not_attempted', office_mail: 'not_attempted', token: submitToken
      });
    }

    // Prevent the same browser submission token from sending duplicate emails.
    var cache = CacheService.getScriptCache();
    var cacheKey = submitToken ? 'submission_' + submitToken : '';
    if (cacheKey) {
      var cached = cache.get(cacheKey);
      if (cached) return formResponse(JSON.parse(cached));
    }

    var officeEmailStatus = 'pending';
    var officeEmailError = '';
    try {
      MailApp.sendEmail({
        to: CONFIG.NOTIFY_EMAIL,
        subject: '[modell.vipach.at] Neue Bewerbung (DE): ' + singleLine(name),
        name: CONFIG.FROM_NAME,
        replyTo: email,
        body:
              'Eine neue Bewerbung ist über die deutsche Seite eingegangen.\n\n' +
              'Name: ' + name + '\n' +
              'E-Mail: ' + email + '\n' +
              'Telefon: ' + (phone || '—') + '\n' +
              'Wohnort: ' + city + '\n' +
              'Seitensprache: ' + (pageLang || '—') + '\n' +
              'Nachricht:\n' + (message || '—') + '\n\n' +
              'Bewerbungs-ID: ' + (submitToken || '—') + '\n' +
              'Eingereicht am: ' + submittedAt + '\n' +
              'Bestätigung 18+: ' + ageConfirmed + '\n' +
              'AGB-Version: ' + termsAccepted + '\n' +
              'Datenschutzhinweis: ' + privacyAcknowledged + '\n' +
              'Hinweisversion: ' + noticeVersion
      });
      officeEmailStatus = 'sent';
    } catch (officeError) {
      officeEmailStatus = 'failed';
      officeEmailError = compactError(officeError);
      console.error('Office email error: ' + officeEmailError);
    }

    var applicantEmailStatus = 'pending';
    var applicantEmailError = '';
    try {
      MailApp.sendEmail({
        to: email,
        subject: "Wir haben deine Bewerbung erhalten — Auf den Spuren großer Fotokünstler | VIPACH",
        name: CONFIG.FROM_NAME,
        replyTo: CONFIG.NOTIFY_EMAIL,
        body:
              'Liebe/r ' + name + ',\n\n' +
              'vielen Dank für deine Bewerbung zu „Auf den Spuren großer Fotokünstler“, unserem exklusiven Fotoprojekt mit Jahresabschluss-Ausstellung!\n\n' +
              'Deine Bewerbungsdaten:\n' +
              '• Name: ' + name + '\n' +
              '• E-Mail: ' + email + '\n' +
              (phone ? '• Telefon: ' + phone + '\n' : '') +
              '• Wohnort: ' + city + '\n\n' +
              'Wichtig: Diese E-Mail bestätigt den Eingang deiner Bewerbung. Sie stellt keine Auswahl dar und begründet keine Zahlungspflicht.\n\n' +
              'Die Plätze sind auf 20 Teilnehmende begrenzt; Bewerbungsfrist ist der 31. August 2026. Wir antworten auf jede Bewerbung innerhalb von 48 Stunden. Bei Auswahl erhältst du eine separate Bestätigungs-E-Mail mit dem Online-Zahlungslink für den Teilnahmebeitrag von 299 EUR. Der Beitrag wird auf das Konto des Trägers des VIPACH Fotoklubs, der Ungarischen Schule Wien (www.magyariskola.at), eingezahlt.\n\n' +
              'Die Ausstellung findet vom 29. November bis 5. Dezember 2026 in der CITYgalleryVIENNA by publicartists (Mahlerstraße 11, 1010 Wien) statt. Die Eröffnung mit Sektempfang beginnt am 29. November um 17:00 Uhr. Schirmherr und Kurator ist der Fotokünstler Norbert Bánhalmi.\n\n' +
              'Bei Fragen schreib uns gerne: ' + CONFIG.NOTIFY_EMAIL + '\n\n' +
              'Herzliche Grüße,\n' +
              'das VIPACH-Team\n' +
              'Vienna Photo Art & Creative Hub\n' +
              'https://www.vipach.at' 
      });
      applicantEmailStatus = 'sent';
    } catch (applicantError) {
      applicantEmailStatus = 'failed';
      applicantEmailError = compactError(applicantError);
      console.error('Applicant email error: ' + applicantEmailError);
    }

    var allEmailsSent = applicantEmailStatus === 'sent' && officeEmailStatus === 'sent';
    var result = {
      status: allEmailsSent ? 'ok' : 'email_error',
      processed: true,
      applicant_mail: applicantEmailStatus,
      office_mail: officeEmailStatus,
      token: submitToken
    };

    if (cacheKey) cache.put(cacheKey, JSON.stringify(result), 21600);
    return formResponse(result);
  } catch (err) {
    console.error('VIPACH doPost error: ' + compactError(err));
    return formResponse({
      status: 'server_error', processed: false,
      applicant_mail: 'not_attempted', office_mail: 'not_attempted', token: submitToken
    });
  }
}

function clean(value) {
  if (!value) return '';
  return String(value).substring(0, CONFIG.MAX_FIELD_LENGTH).trim();
}

function singleLine(value) {
  return clean(value).replace(/[\r\n\t]+/g, ' ').substring(0, 160);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function compactError(err) {
  return String(err || 'unknown_error').replace(/[\r\n]+/g, ' ').substring(0, 500);
}

function formResponse(obj) {
  var payload = obj || {};
  var processed = payload.processed === true;
  var fields = {
    status: payload.status || 'server_error',
    token: payload.token || '',
    processed: processed ? '1' : '0',
    // Legacy alias so a previously cached v5 page also understands v6.
    stored: processed ? '1' : '0',
    applicant_mail: payload.applicant_mail || 'unknown',
    office_mail: payload.office_mail || 'unknown',
    version: CONFIG.BACKEND_VERSION
  };
  var inputs = Object.keys(fields).map(function(key) {
    return '<input type="hidden" name="' + escapeHtml(key) + '" value="' + escapeHtml(fields[key]) + '">';
  }).join('');
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta charset="utf-8"><base target="_self"></head><body>' +
    '<form id="vipachCallback" action="' + escapeHtml(CONFIG.CALLBACK_URL) + '" method="get" target="_self">' + inputs + '</form>' +
    '<script>document.getElementById("vipachCallback").submit();<\/script>' +
    '</body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Run once manually after pasting the script. No spreadsheet is required. */
function testConfigurationAndEmail() {
  var quotaBefore = MailApp.getRemainingDailyQuota();
  if (quotaBefore < 1) throw new Error('MAIL_QUOTA_EXHAUSTED');
  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    subject: "[modell.vipach.at] DE Backend E-Mail-Test — " + CONFIG.BACKEND_VERSION,
    name: CONFIG.FROM_NAME,
    body: "Die MailApp-Verbindung des deutschen VIPACH-Backends funktioniert." + '\n\nVersion: ' + CONFIG.BACKEND_VERSION +
      '\nRemaining recipient quota before test: ' + quotaBefore +
      '\nTest time: ' + new Date().toISOString()
  });
  Logger.log('OK | mail_test_sent_to=' + CONFIG.NOTIFY_EMAIL +
    ' | quota_before=' + quotaBefore + ' | version=' + CONFIG.BACKEND_VERSION);
  return { ok: true, quota_before: quotaBefore, version: CONFIG.BACKEND_VERSION };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

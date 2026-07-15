/**
 * modell.vipach.at — Application form backend (ENGLISH)
 * “In the Footsteps of Great Photographers” — VIPACH year-end exhibition
 *
 * This version does NOT use Google Sheets. Application data is transmitted
 * only by two emails: a confirmation to the applicant and a notification to
 * office@vipach.at.
 *
 * SETUP:
 * 1. Paste this file into a standalone Google Apps Script project.
 * 2. Run testConfigurationAndEmail once manually and authorise MailApp.
 * 3. Deploy → Manage deployments → Edit → New version → Deploy.
 * 4. Execute as: Me; Who has access: Anyone.
 */

var CONFIG = {
  NOTIFY_EMAIL: 'office@vipach.at',
  FROM_NAME: "VIPACH — In the Footsteps of Great Photographers",
  MAX_FIELD_LENGTH: 3000,
  CALLBACK_URL: 'https://modell.vipach.at/form-callback/',
  BACKEND_VERSION: '2026-07-15-v6-mail-only'
};

function doGet() {
  return jsonResponse({
    ok: true,
    language: "en",
    message: "VIPACH EN email backend is running",
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
        subject: '[modell.vipach.at] New application (EN): ' + singleLine(name),
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
              'Application ID: ' + (submitToken || '—') + '\n' +
              'Submitted at: ' + submittedAt + '\n' +
              'Age 18+ confirmation: ' + ageConfirmed + '\n' +
              'Terms version: ' + termsAccepted + '\n' +
              'Privacy notice: ' + privacyAcknowledged + '\n' +
              'Notice version: ' + noticeVersion
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
        subject: "We have received your application — In the Footsteps of Great Photographers | VIPACH",
        name: CONFIG.FROM_NAME,
        replyTo: CONFIG.NOTIFY_EMAIL,
        body:
              'Dear ' + name + ',\n\n' +
              'Thank you for applying to “In the Footsteps of Great Photographers”, our exclusive photo project and year-end exhibition!\n\n' +
              'Your application details:\n' +
              '• Name: ' + name + '\n' +
              '• Email: ' + email + '\n' +
              (phone ? '• Phone: ' + phone + '\n' : '') +
              '• Place of residence: ' + city + '\n\n' +
              'Important: this email confirms receipt of your application. It does not constitute selection and does not create a payment obligation.\n\n' +
              'Places are limited to 20 participants and the application deadline is 31 August 2026. We respond to every application within 48 hours. If selected, you will receive a separate confirmation email with the online payment link for the EUR 299 participation fee. The fee is paid to the account of the maintaining organisation of the VIPACH Photo Club, the Hungarian School of Vienna (www.magyariskola.at).\n\n' +
              'The exhibition runs from 29 November to 5 December 2026 at CITYgalleryVIENNA by publicartists (Mahlerstraße 11, 1010 Vienna). The champagne opening begins at 17:00 on 29 November. Patron and curator: fine art photographer Norbert Bánhalmi.\n\n' +
              'If you have any questions, write to us at: ' + CONFIG.NOTIFY_EMAIL + '\n\n' +
              'Best regards,\n' +
              'The VIPACH team\n' +
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
    subject: "[modell.vipach.at] EN backend email test — " + CONFIG.BACKEND_VERSION,
    name: CONFIG.FROM_NAME,
    body: "The English VIPACH backend MailApp connection is working." + '\n\nVersion: ' + CONFIG.BACKEND_VERSION +
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

/**
 * modell.vipach.at — Jelentkezési űrlap backend (MAGYAR)
 * „Nagy fotóművészek nyomában” — VIPACH évzáró kiállítás
 *
 * Ez a verzió NEM használ Google Táblázatot. A beérkező adatokat kizárólag
 * két e-mailben továbbítja: egy visszaigazolás a jelentkezőnek és egy
 * értesítés az office@vipach.at címre.
 *
 * TELEPÍTÉS:
 * 1. Illeszd be ezt a fájlt egy önálló Google Apps Script projektbe.
 * 2. Futtasd le kézzel egyszer a testConfigurationAndEmail függvényt,
 *    és engedélyezd a MailApp használatát.
 * 3. Üzembe helyezés → Központi telepítések kezelése → Szerkesztés
 *    → Új verzió → Üzembe helyezés.
 * 4. Végrehajtás mint: Én; hozzáférés: Bárki.
 */

var CONFIG = {
  NOTIFY_EMAIL: 'office@vipach.at',
  FROM_NAME: "VIPACH — Nagy fotóművészek nyomában",
  MAX_FIELD_LENGTH: 3000,
  CALLBACK_URL: 'https://modell.vipach.at/form-callback/',
  BACKEND_VERSION: '2026-07-15-v6-mail-only'
};

function doGet() {
  return jsonResponse({
    ok: true,
    language: "hu",
    message: "VIPACH HU e-mail backend működik",
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
        subject: '[modell.vipach.at] Új jelentkezés (HU): ' + singleLine(name),
        name: CONFIG.FROM_NAME,
        replyTo: email,
        body:
              'Új jelentkezés érkezett a magyar nyelvű oldalról.\n\n' +
              'Név: ' + name + '\n' +
              'E-mail: ' + email + '\n' +
              'Telefon: ' + (phone || '—') + '\n' +
              'Lakóhely: ' + city + '\n' +
              'Az oldal nyelve: ' + (pageLang || '—') + '\n' +
              'Üzenet:\n' + (message || '—') + '\n\n' +
              'Jelentkezési azonosító: ' + (submitToken || '—') + '\n' +
              'Beküldés időpontja: ' + submittedAt + '\n' +
              '18+ megerősítés: ' + ageConfirmed + '\n' +
              'ÁSZF-verzió: ' + termsAccepted + '\n' +
              'Adatvédelmi tájékoztató: ' + privacyAcknowledged + '\n' +
              'Tájékoztató verziója: ' + noticeVersion
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
        subject: "Megkaptuk a jelentkezésed — Nagy fotóművészek nyomában | VIPACH",
        name: CONFIG.FROM_NAME,
        replyTo: CONFIG.NOTIFY_EMAIL,
        body:
              'Kedves ' + name + '!\n\n' +
              'Köszönjük a jelentkezésed a „Nagy fotóművészek nyomában” exkluzív fotóprojektre és évzáró kiállításra!\n\n' +
              'A jelentkezésed adatai:\n' +
              '• Név: ' + name + '\n' +
              '• E-mail: ' + email + '\n' +
              (phone ? '• Telefon: ' + phone + '\n' : '') +
              '• Lakóhely: ' + city + '\n\n' +
              'Fontos: ez az e-mail a jelentkezésed beérkezését igazolja, és önmagában nem jelent kiválasztást, valamint nem keletkeztet fizetési kötelezettséget.\n\n' +
              'A helyek száma limitált (20 fő), a jelentkezési határidő 2026. augusztus 31. Minden jelentkezésre 48 órán belül válaszolunk. Kiválasztás esetén külön visszaigazoló e-mailt küldünk a 299 EUR részvételi díj online befizetési linkjével. A díj a VIPACH Fotóklub fenntartója, a Bécsi Magyar Iskola (www.magyariskola.at) számlájára érkezik.\n\n' +
              'A kiállítás 2026. november 29-től december 5-ig tart a CITYgalleryVIENNA by publicartists galériában (Mahlerstraße 11, 1010 Wien). A pezsgős megnyitó november 29-én 17:00 órakor kezdődik. Védnöke és kurátora Bánhalmi Norbert fotóművész.\n\n' +
              'Kérdés esetén írj bátran: ' + CONFIG.NOTIFY_EMAIL + '\n\n' +
              'Üdvözlettel,\n' +
              'a VIPACH csapata\n' +
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
    subject: "[modell.vipach.at] HU backend e-mail teszt — " + CONFIG.BACKEND_VERSION,
    name: CONFIG.FROM_NAME,
    body: "A magyar VIPACH backend MailApp-kapcsolata működik." + '\n\nVersion: ' + CONFIG.BACKEND_VERSION +
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

/**
 * modell.vipach.at — Jelentkezési űrlap backend (MAGYAR)
 * "Nagy fotóművészek nyomában" — VIPACH évzáró kiállítás
 *
 * TELEPÍTÉS:
 * 1. Hozz létre egy Google Táblázatot, pl. "Jelentkezések HU — modell.vipach.at"
 * 2. A táblázatban: Bővítmények → Apps Script → töröld a tartalmat, illeszd be ezt a fájlt
 * 3. Fent a CONFIG-ban ellenőrizd az e-mail címet
 * 4. Deploy (Üzembe helyezés) → New deployment → Web app
 *      - Execute as / Végrehajtás: Me (saját fiók)
 *      - Who has access / Hozzáférés: Anyone (Bárki)
 * 5. A kapott /exec végű URL-t másold be az index.html SCRIPT_URLS.hu mezőjébe
 *
 * Megjegyzés: az első futtatáskor a Google engedélyt kér a Táblázat és a
 * levélküldés (MailApp) használatához — ezt egyszer jóvá kell hagyni.
 */

var CONFIG = {
  NOTIFY_EMAIL: 'office@vipach.at',      // ide megy az értesítés minden új jelentkezésről
  FROM_NAME: 'VIPACH — Nagy fotóművészek nyomában',
  SHEET_NAME: 'Jelentkezések',           // munkalap neve (automatikusan létrejön)
  MAX_FIELD_LENGTH: 3000                 // mezőnkénti hosszkorlát (spam/abuse ellen)
};


function doGet() {
  return jsonResponse({ ok: true, language: "hu", message: "VIPACH HU backend működik" });
}

function doPost(e) {
  var submitToken = '';
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    submitToken = clean(p.submit_token);

    // Statisztika: az oldal aljáig görgetők számlálása (nincs e-mail, nincs személyes adat)
    if (p.event === 'scroll_bottom') {
      recordScrollStat();
      return jsonResponse({ ok: true });
    }

    // Honeypot: a "website" mező rejtett, ember nem tölti ki
    if (p.website) return formResponse({ ok: true, token: submitToken });

    var name  = clean(p.name);
    var email = clean(p.email);
    var phone = clean(p.phone);
    var city  = clean(p.city);
    var pageLang = clean(p.page_language);
    var message = clean(p.message);
    var ageConfirmed = clean(p.age_confirmed);
    var termsAccepted = clean(p.terms_accepted);
    var privacyAcknowledged = clean(p.privacy_acknowledged);
    var noticeVersion = clean(p.notice_version);

    if (!name || !email || !city || !isValidEmail(email) ||
        ageConfirmed !== 'yes' || !termsAccepted || !privacyAcknowledged) {
      return formResponse({ ok: false, error: 'missing_or_invalid_fields', token: submitToken });
    }

    // 1) Mentés a táblázatba
    var sheet = getSheet();
    var rowNumber = appendApplicationRow(sheet, [
      new Date(), name, email, phone, city, pageLang, message,
      'magyar oldal | 18+: ' + ageConfirmed + ' | ASZF: ' + termsAccepted + ' | adatvedelem: ' + privacyAcknowledged + ' | tajekoztato: ' + noticeVersion, 'új'
    ]);

    // 2) Visszaigazoló e-mail a jelentkezőnek
    var applicantEmailStatus = 'jelentkezői e-mail elküldve';
    try {
      MailApp.sendEmail({
            to: email,
            subject: 'Megkaptuk a jelentkezésed — Nagy fotóművészek nyomában | VIPACH',
            name: CONFIG.FROM_NAME,
            replyTo: CONFIG.NOTIFY_EMAIL,
            body:
              'Kedves ' + name + '!\n\n' +
              'Köszönjük a jelentkezésed a „Nagy fotóművészek nyomában" exkluzív fotóprojektre és évzáró kiállításra!\n\n' +
              'A jelentkezésed adatai:\n' +
              '• Név: ' + name + '\n' +
              '• E-mail: ' + email + '\n' +
              (phone ? '• Telefon: ' + phone + '\n' : '') +
              '• Lakóhely: ' + city + '\n\n' +
              'Fontos: ez az e-mail a jelentkezésed beérkezését igazolja, és önmagában nem jelent kiválasztást ' +
              'és nem keletkeztet fizetési kötelezettséget.\n\n' +
              'A helyek száma limitált (20 fő), a jelentkezési határidő 2026. augusztus 31. Minden jelentkezésre 48 órán belül válaszolunk; ha kiválasztásra kerülsz, ' +
              'külön visszaigazoló e-mailt küldünk, amely tartalmazza a 299 EUR részvételi díj online befizetési linkjét. ' +
              'A díj a VIPACH Fotóklub fenntartója, a Bécsi Magyar Iskola (www.magyariskola.at) számlájára érkezik.\n\n' +
              'A kiállítás 2026. november 29-től december 5-ig tart a CITYgalleryVIENNA by publicartists galériában (Mahlerstraße 11, 1010 Wien). A pezsgős megnyitó november 29-én 17:00 órakor kezdődik. Védnöke és kurátora Bánhalmi Norbert fotóművész.\n\n' +
              'Kérdés esetén írj bátran: ' + CONFIG.NOTIFY_EMAIL + '\n\n' +
              'Üdvözlettel,\n' +
              'a VIPACH csapata\n' +
              'Vienna Photo Art & Creative Hub\n' +
              'https://www.vipach.at'
          });
    } catch (mailError) {
      applicantEmailStatus = 'jelentkezői e-mail hiba: ' + String(mailError);
      console.error('Applicant email error: ' + mailError);
    }

    // 3) Értesítés a szervezőknek
    var organiserEmailStatus = 'szervezői e-mail elküldve';
    try {
      MailApp.sendEmail({
            to: CONFIG.NOTIFY_EMAIL,
            subject: '[modell.vipach.at] Új jelentkezés (HU): ' + name,
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
              'Táblázat: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
          });
    } catch (notifyError) {
      organiserEmailStatus = 'szervezői e-mail hiba: ' + String(notifyError);
      console.error('Organiser email error: ' + notifyError);
    }

    // The application is already safely stored. Mail delivery errors are
    // recorded in the status column but do not turn the submission into a failure.
    sheet.getRange(rowNumber, 9).setValue('mentve | ' + applicantEmailStatus + ' | ' + organiserEmailStatus);

    return formResponse({ ok: true, token: submitToken });

  } catch (err) {
    console.error('VIPACH doPost error: ' + err);
    return formResponse({ ok: false, error: 'server_error', token: submitToken });
  }
}

/* ---------- segédfüggvények ---------- */

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(['Időpont', 'Név', 'E-mail', 'Telefon', 'Lakóhely',
                     'Oldal nyelve', 'Üzenet', 'Forrás', 'Státusz']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}

function appendApplicationRow(sheet, values) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var safeValues = values.map(safeForSheet);
    sheet.appendRow(safeValues);
    return sheet.getLastRow();
  } finally {
    lock.releaseLock();
  }
}

/** Prevents spreadsheet formula injection from user-provided values. */
function safeForSheet(value) {
  if (value instanceof Date) return value;
  var text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function clean(v) {
  if (!v) return '';
  return String(v).substring(0, CONFIG.MAX_FIELD_LENGTH).trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function formResponse(obj) {
  var payload = obj || {};
  payload.source = 'vipach-form';
  var safeJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.parent.postMessage(' + safeJson + ', "*");<\/script>' +
    '</body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Napi bontásban számolja, hányan görgettek az oldal aljáig.
 * Az eredmény a(z) "Statisztika" munkalapon látható.
 */
function recordScrollStat() {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return; }
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Statisztika');
    if (!sh) {
      sh = ss.insertSheet('Statisztika');
      sh.appendRow(['Dátum', 'Az oldal aljáig görgetők']);
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

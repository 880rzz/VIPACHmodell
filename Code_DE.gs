/**
 * modell.vipach.at — Bewerbungsformular-Backend (DEUTSCH)
 * "Auf den Spuren großer Fotokünstler" — VIPACH Jahresabschluss-Ausstellung
 *
 * EINRICHTUNG:
 * 1. Erstelle ein Google Sheet, z. B. "Bewerbungen DE — modell.vipach.at"
 * 2. Im Sheet: Erweiterungen → Apps Script → Editor leeren, diese Datei einfügen
 * 3. E-Mail-Adresse in CONFIG unten prüfen
 * 4. Bereitstellen → Neue Bereitstellung → Web-App
 *      - Ausführen als: Ich
 *      - Zugriff: Jeder
 * 5. Die erhaltene /exec-URL in SCRIPT_URLS.de in index.html eintragen
 *
 * Hinweis: Beim ersten Ausführen fragt Google nach der Berechtigung für
 * Sheet und MailApp — einmalig bestätigen.
 */

var CONFIG = {
  NOTIFY_EMAIL: 'office@vipach.at',
  FROM_NAME: 'VIPACH — Auf den Spuren großer Fotokünstler',
  SHEET_NAME: 'Bewerbungen',
  MAX_FIELD_LENGTH: 3000
};


function doGet() {
  return jsonResponse({ ok: true, language: "de", message: "VIPACH DE Backend ist erreichbar" });
}

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    // Statisztika: az oldal aljáig görgetők számlálása (nincs e-mail, nincs személyes adat)
    if (p.event === 'scroll_bottom') {
      recordScrollStat();
      return jsonResponse({ ok: true });
    }

    // Honeypot: das Feld "website" ist versteckt; Menschen füllen es nie aus
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

    // 1) In das Sheet eintragen
    var sheet = getSheet();
    var rowNumber = appendApplicationRow(sheet, [
      new Date(), name, email, phone, city, pageLang, message,
      'deutsche Seite', 'neu'
    ]);

    // 2) Bestätigungs-E-Mail an die Bewerberin / den Bewerber
    var applicantEmailStatus = 'Bestätigung gesendet';
    try {
      MailApp.sendEmail({
            to: email,
            subject: 'Wir haben deine Bewerbung erhalten — Auf den Spuren großer Fotokünstler | VIPACH',
            name: CONFIG.FROM_NAME,
            replyTo: CONFIG.NOTIFY_EMAIL,
            body:
              'Liebe/r ' + name + ',\n\n' +
              'vielen Dank für deine Bewerbung zu „Auf den Spuren großer Fotokünstler", unserem exklusiven Fotoprojekt mit Jahresabschluss-Ausstellung!\n\n' +
              'Deine Bewerbungsdaten:\n' +
              '• Name: ' + name + '\n' +
              '• E-Mail: ' + email + '\n' +
              (phone ? '• Telefon: ' + phone + '\n' : '') +
              '• Wohnort: ' + city + '\n\n' +
              'Wichtig: Diese E-Mail bestätigt den Eingang deiner Bewerbung. Sie stellt keine Auswahl dar ' +
              'und begründet keine Zahlungspflicht.\n\n' +
              'Die Plätze sind begrenzt (20 Teilnehmende), Bewerbungsfrist ist der 31. August 2026. Wir antworten auf jede Bewerbung innerhalb von 48 Stunden; wirst du ausgewählt, ' +
              'erhältst du eine separate Bestätigungs-E-Mail mit dem Online-Zahlungslink für den Teilnahmebeitrag von 299 EUR. ' +
              'Der Beitrag wird auf das Konto des Trägers des VIPACH Fotoklubs, der Ungarischen Schule Wien (www.magyariskola.at), eingezahlt.\n\n' +
              'Die Ausstellung findet im November 2026 in einer Wiener Galerie statt. Schirmherr und Kurator ist der Fotokünstler Norbert Bánhalmi.\n\n' +
              'Bei Fragen schreib uns gerne: ' + CONFIG.NOTIFY_EMAIL + '\n\n' +
              'Herzliche Grüße,\n' +
              'das VIPACH-Team\n' +
              'Vienna Photo Art & Creative Hub\n' +
              'https://www.vipach.at'
          });
    } catch (mailError) {
      applicantEmailStatus = 'Bestätigung fehlgeschlagen: ' + String(mailError);
      console.error('Applicant email error: ' + mailError);
    }

    // 3) Benachrichtigung an das Organisationsteam
    var organiserEmailStatus = 'Team-E-Mail gesendet';
    try {
      MailApp.sendEmail({
            to: CONFIG.NOTIFY_EMAIL,
            subject: '[modell.vipach.at] Neue Bewerbung (DE): ' + name,
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
              'Tabelle: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
          });
    } catch (notifyError) {
      organiserEmailStatus = 'Team-E-Mail fehlgeschlagen: ' + String(notifyError);
      console.error('Organiser email error: ' + notifyError);
    }

    // The application is already safely stored. Mail delivery errors are
    // recorded in the status column but do not turn the submission into a failure.
    sheet.getRange(rowNumber, 9).setValue('gespeichert | ' + applicantEmailStatus + ' | ' + organiserEmailStatus);

    return jsonResponse({ ok: true });

  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/* ---------- Hilfsfunktionen ---------- */

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(['Zeitpunkt', 'Name', 'E-Mail', 'Telefon', 'Wohnort',
                     'Seitensprache', 'Nachricht', 'Quelle', 'Status']);
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

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Napi bontásban számolja, hányan görgettek az oldal aljáig.
 * Az eredmény a(z) "Statistik" munkalapon látható.
 */
function recordScrollStat() {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return; }
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Statistik');
    if (!sh) {
      sh = ss.insertSheet('Statistik');
      sh.appendRow(['Datum', 'Bis zum Seitenende gescrollt']);
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

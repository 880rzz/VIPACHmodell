# VIPACH űrlap – gyökérok és végleges frontend-javítás

Dátum: 2026-07-15

## Megállapítás

A Google Apps Script megfelelően lefutott: a beküldés eljutott a backendhez, a táblázatba mentés és az e-mail-küldés működhetett. A weboldal mégis hibát jelzett, mert a frontend a Google Apps Script `HtmlService` válaszából érkező `postMessage` visszaigazolásra várt.

Az Apps Script HTML-válaszát a Google saját, többszörösen beágyazott és sandboxolt iframe-környezetben jeleníti meg. Emiatt a válaszoldalról küldött `window.parent.postMessage(...)` és `window.top.postMessage(...)` nem tekinthető megbízható visszajelzési csatornának. A külső oldal nem kapta meg az üzenetet, a 45 másodperces időzítő pedig téves hibát jelenített meg.

## Javítás

A HU, EN és DE oldalakból eltávolítottuk:

- a dinamikusan létrehozott rejtett iframe-et;
- a `message` eseményfigyelőt;
- a `postMessage` válaszra épülő sikerellenőrzést;
- a téves `confirmation_timeout` hibafolyamatot.

A három oldal most közvetlen, szabványos `fetch()` POST-kérést használ:

- `mode: "no-cors"` – nem igényli, hogy az Apps Script CORS fejlécet szolgáltasson;
- `URLSearchParams` – ugyanazt az `application/x-www-form-urlencoded` adatstruktúrát küldi, amelyet az Apps Script már kezel;
- 45 másodperces `AbortController` hálózati időkorlát;
- dupla kattintás elleni `data-submitting` védelem;
- a meglévő nyelvi végpontok és `submit_token` változatlanok.

## Érintett fájlok

- `hu/index.html`
- `en/index.html`
- `de/index.html`

## Apps Script

Az Apps Script URL-ek és a jelenlegi backendkód megtartható. A v4 javítás frontendoldali; a scripteket nem kell ismét lecserélni vagy újratelepíteni.

## Ellenőrzés

- Mindhárom HTML inline JavaScriptje `node --check` vizsgálaton hibamentesen átment.
- Mindhárom nyelvben pontosan egy `no-cors` beküldési folyamat található.
- A hibás `window.addEventListener("message", ...)` visszaigazolási mechanizmus mindhárom oldalból eltávolításra került.
- A három felhasználó által megadott `/exec` végpont karakterpontosan megmaradt.

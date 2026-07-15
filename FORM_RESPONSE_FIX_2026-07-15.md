# VIPACH űrlap-válasz javítás — 2026-07-15

## Hiba oka

A Google Apps Script `HtmlService` a sikeres választ egy Google által sandboxolt, esetenként belső iframe-ből küldi vissza. A weboldal előző verziója megkövetelte, hogy a `postMessage` pontosan a külső cél-iframe `contentWindow` objektumából érkezzen. Ez több böngészőben nem teljesül, ezért a valódi sikeres válasz figyelmen kívül maradt, majd 20 másodperc után téves hibajelzés jelent meg.

## Javítás

- A válasz azonosítása továbbra is az egyedi, véletlenszerű `submit_token` alapján történik.
- A hibás `event.source === frame.contentWindow` korlátozás kikerült.
- A válaszvárakozás 20 másodpercről 45 másodpercre nőtt, mert a táblázatírás és a két e-mail küldése lassabb hálózatnál tovább tarthat.
- A javítás a HU, EN és DE oldalon is megtörtént.

## Telepítés

Az Apps Scriptet nem kell újra cserélni. A következő három weboldalfájlt kell frissíteni a tárhelyen:

- `hu/index.html`
- `en/index.html`
- `de/index.html`

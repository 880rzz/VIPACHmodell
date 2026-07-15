# VIPACHmodell — helyszín-, dátum- és űrlapaudit

Dátum: 2026-07-15

## Beépített kiállítási adatok

- Helyszín: CITYgalleryVIENNA by publicartists
- Weboldal: https://publicartists.online
- Cím: Mahlerstraße 11, 1010 Wien
- Kiállítás: 2026. november 29. – december 5.
- Megnyitó: 2026. november 29., 17:00
- Kiállítótér: földszint és az emeleti hátsó különterem
- Kirakati megjelenés: televíziós bemutató a kiállítótérről

Az információk bekerültek a magyar, angol és német oldal hero-adatsorába, a projektadatok közé, a külön kiállítási blokkba, a meta leírásokba és a schema.org Event strukturált adataiba. A jelentkezői visszaigazoló e-mailek szövege is frissült.

## Űrlap-audit eredménye

Mindhárom oldal külön Google Apps Script végpontra van kötve, és a statikus nyelvi azonosító alapján a megfelelő HU / EN / DE végpontot választja. A mezőnevek egyeznek a szerveroldali kóddal.

### Javított kockázatok

1. A szerveroldal korábban nem ellenőrizte a 18+ nyilatkozatot, az ÁSZF elfogadását és az adatkezelési tájékoztató tudomásulvételét. Ez most szerveroldalon is kötelező.
2. A böngésző korábban időzítő alapján akkor is sikeres beküldést jelezhetett, ha a Google Script hibát adott vissza. Az új verzió egy egyedi beküldési tokennel és `postMessage` válaszcsatornával csak valódi `ok: true` szerverválasz után mutat sikert.
3. A hozzájárulási verziók és a 18+ nyilatkozat a táblázat Forrás mezőjében is naplózásra kerülnek.
4. A három Apps Script visszaigazoló e-mailje tartalmazza a pontos helyszínt, dátumot és megnyitóidőpontot.

## Kötelező telepítési lépés

A `Code_HU.gs`, `Code_EN.gs` és `Code_DE.gs` fájlokat a hozzájuk tartozó Google Apps Script projektekben frissíteni kell, majd mindhárom meglévő webalkalmazás-telepítést új verzióra kell állítani:

- Execute as / Végrehajtás: Me
- Who has access / Hozzáférés: Anyone
- A meglévő deployment szerkesztése ajánlott, így a jelenlegi `/exec` URL-ek változatlanok maradnak.

A weboldal és a három backend-frissítés együtt publikálandó. A ZIP forráskódja alapján a bekötés és a kód konzisztens; a tényleges élő deployment jogosultságai és e-mail-küldési engedélyei csak egy-egy valódi tesztbeküldéssel ellenőrizhetők.

## Lefuttatott ellenőrzések

- mindhárom HTML oldal szerkezeti elemzése
- mindhárom nyelv i18n-kulcsainak teljessége
- mindhárom oldalon azonos és helyes endpoint-térkép
- űrlapmezők és backend-paraméterek egyezése
- JSON-LD szintaktikai ellenőrzése és Event adatellenőrzés
- inline JavaScript szintaktikai ellenőrzése
- mindhárom Apps Script szintaktikai ellenőrzése

# VIPACH űrlap- és Apps Script bekötési audit

## Bekötések

- HU oldal → `AKfycbwLb.../exec`
- EN oldal → `AKfycbxQ-.../exec`
- DE oldal → `AKfycbxcP.../exec`

A három URL különböző, és mindhárom nyelvi oldal ugyanazt a helyes nyelv–végpont térképet tartalmazza. A nyelvi oldalak `data-static-lang` értéke rendre `hu`, `en`, `de`, ezért nem keverednek a végpontok.

## Feltárt kockázat

A korábbi beküldés `fetch(..., {mode: "no-cors", keepalive: true, signal})` kombinációt használt. Ez Safari/iOS alatt, illetve Google Apps Script átirányítás esetén nem minden környezetben megbízható.

## Javítás

A beküldés most natív HTML POST-tal, rejtett iframe-be történik. Ez:

- nem igényli a Google válaszának CORS-os kiolvasását;
- nem navigálja el az oldalt;
- Safari/iPhone alatt is stabilabb;
- mindig az adott oldal saját nyelvi `/exec` URL-jére küld;
- elküldi a `page_language` mezőt is.

A három Apps Script kapott egy `doGet()` állapotellenőrzést. A telepítés frissítése után a `/exec` URL böngészőben megnyitva JSON állapotüzenetet ad.

# VIPACH — háromnyelvű audit és automatikus nyelvfelismerés

## Nyelvi belépési logika

- A gyökér URL (`https://modell.vipach.at/`) most önálló nyelvi router.
- `hu`, `hu-HU` vagy más `hu-*` böngészőnyelv → `/hu/`.
- `de`, `de-AT`, `de-DE`, `de-CH` vagy más `de-*` böngészőnyelv → `/de/`.
- Minden más böngészőnyelv → `/en/`.
- A `?lang=hu`, `?lang=de` és `?lang=en` paraméter kézi felülbírálást tesz lehetővé.
- A query string és az oldalon belüli hash megmarad az átirányítás során.
- JavaScript nélkül kézi HU/EN/DE nyelvválasztó jelenik meg.

## Audit eredménye

**Nem maradt kritikus technikai vagy nyelvi konzisztenciahiba.**

## Ellenőrzött területek

- HTML `lang`, oldalanként egy H1, title és meta description.
- Canonical és kölcsönös `hreflang` HU/EN/DE/x-default.
- Open Graph locale és angol közösségimédia-kép.
- JSON-LD szintaktikai érvényesség.
- A három jelentkezési űrlap mezői és Google Apps Script végpontjai.
- A korábbi `no-cors` űrlapjavítás jelenléte.
- Belső hivatkozások és jogi aloldalak elérhetősége.
- A három fő nyelvi oldal szekció-, kártya- és GYIK-paritása.
- A nyelvi router nem fut a `/hu/`, `/en/` vagy `/de/` oldalakon, így nincs átirányítási hurok.

## Oldalankénti alapellenőrzés

| Nyelv | HTML lang | Title hossz | Description hossz | H1 |
|---|---:|---:|---:|---:|
| HU | hu | 55 | 160 | 1 |
| EN | en | 69 | 175 | 1 |
| DE | de | 63 | 166 | 1 |

## Publikálási megjegyzés

A GitHub repó gyökerébe a `VIPACH_modell_audited` mappa **tartalmát** kell feltölteni. A gyökérben az új `index.html`, mellette pedig a `hu/`, `en/` és `de/` könyvtár legyen.

A ZIP nem tartalmaz rejtett fájlt vagy rejtett könyvtárat.
# modell.vipach.at — Nagy fotóművészek nyomában

Statikus landing + jelentkezési oldal (HU/EN/DE), GitHub Pages-re,
Google Apps Script űrlap-backenddel és automatikus visszaigazoló e-maillel.

## Repo tartalma
- `index.html` — a teljes oldal (három nyelv egy fájlban, nyelvváltóval)
- `hero-gallery-firefly-original.jpeg` — a felhasználó által jóváhagyott, Adobe Firefly-jal készült eredeti koncepciókép
- `hero-gallery-480.webp`, `hero-gallery-768.webp`, `hero-gallery-1152.webp` — vágás nélküli, reszponzív WebP-változatok
- `hero-gallery-1152.jpg` — JPEG fallback és közösségimédia-előnézet
- `CNAME` — a modell.vipach.at domainhez
- `Code_HU.gs`, `Code_EN.gs`, `Code_DE.gs` — nyelvenkénti Google Apps Script backend

## 1) GitHub Pages
1. Töltsd fel a csomag teljes tartalmát a repo gyökerébe, a nyelvi könyvtárakkal és a jogi oldalakkal együtt
2. Repo → Settings → Pages → Source: "Deploy from a branch" → `main` / `/ (root)`
3. DNS a vipach.at zónában: `modell` CNAME rekord → `<felhasznalonev>.github.io`
4. Pages beállításokban: "Enforce HTTPS" bepipálása

## 2) Google Apps Script (nyelvenként külön, 3×)
Mindhárom scripthez (HU / EN / DE) ugyanez a menet:
1. Hozz létre egy Google Táblázatot (pl. "Jelentkezések HU — modell.vipach.at")
2. Táblázatban: **Bővítmények → Apps Script** → az editor tartalmát töröld,
   illeszd be a megfelelő `Code_XX.gs` fájlt
3. Ellenőrizd a fájl tetején a CONFIG-ot (NOTIFY_EMAIL: office@vipach.at)
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Első deploy-nál engedélyezd a Táblázat- és levélküldési jogosultságot
6. Másold ki a kapott **/exec** végű URL-t

## 3) URL-ek bekötése az oldalba
Az `index.html`-ben keresd meg:
```js
const SCRIPT_URLS = {
  hu: "", // <-- magyar script /exec URL
  en: "", // <-- angol script /exec URL
  de: ""  // <-- német script /exec URL
};
```
Írd be a három URL-t, majd commit + push.

Amíg egy nyelv URL-je üres, azon a nyelven az űrlap demó módban fut
(validál, de nem küld adatot).

## Mit csinál a script?
Minden beérkező jelentkezésnél:
1. **Menti** az adatokat a saját Google Táblázatába (idő, név, e-mail,
   telefon, város, nyelv, üzenet, forrás, státusz oszlopokkal)
2. **Visszaigazoló e-mailt küld a jelentkezőnek** a saját nyelvén —
   kifejezetten jelezve, hogy ez még nem kiválasztás és nem keletkeztet
   fizetési kötelezettséget; a 299 EUR befizetési link csak a kiválasztás
   utáni külön e-mailben érkezik (Bécsi Magyar Iskola számlájára)
3. **Értesítést küld** az office@vipach.at címre a jelentkezés adataival
4. Honeypot mező alapján kiszűri a spam-botokat

## Kvóták, GDPR
- MailApp napi limit: ingyenes Gmail-fiókkal 100 e-mail/nap, Google
  Workspace-szel 1500/nap — a 2 e-mail/jelentkezés mellett bőven elég
- A jelentkezői adatok a saját Google-fiókod Táblázataiban tárolódnak;
  az adatkezelési tájékoztatóban a Google-t (Google Ireland Ltd.)
  adatfeldolgozóként érdemes feltüntetni
- A táblázatokhoz csak a szükséges személyek kapjanak hozzáférést,
  és a projekt lezárta után a nem kiválasztottak adatait töröljétek

## Jelentkezési időszak kezelése
- Határidő: **2026. augusztus 31.** — utána az oldal automatikusan lezárja
  az űrlapot és "A jelentkezési időszak lezárult" üzenetet mutat
- Ha előbb betelik a 20 hely: az `index.html`-ben állítsd át
  `const PLACES_FULL = false;` → `true`, commit + push — az űrlap helyén
  a "Betelt mind a 20 hely" üzenet jelenik meg mindhárom nyelven

## Statisztika (aljáig görgetők)
- Amikor egy látogató először eléri az oldal alját, névtelen jelzés megy
  az aktuális nyelv scriptjének — süti és személyes adat nélkül
- Az eredmény nyelvenként a saját táblázat "Statisztika" / "Statistics" /
  "Statistik" munkalapján gyűlik, napi bontásban
- **Fontos:** a scriptek frissítése után új verziót kell publikálni:
  Apps Script → Deploy → Manage deployments → ceruza ikon →
  Version: "New version" → Deploy. Az URL változatlan marad.

## Teendők élesítés előtt
- Ellenőrizd a végleges szerződő fél, adózási/áfakezelési és számlázási adatokat.
- A pontos bécsi galériahelyszínt és időpontot csak a helyszín végleges visszaigazolása után írd ki.
- A modell- és kiállítási képfelhasználási megállapodást kezeld külön dokumentumként.


## 2026-07-13 audit update
- HU/EN/DE indexable landing pages: `/hu/`, `/en/`, `/de/`
- 12 real, localized legal pages (imprint, terms, privacy, withdrawal)
- SEO/GEO/schema: canonical, hreflang, localized metadata, JSON-LD, sitemap, robots.txt, llms.txt, manifest, security headers
- Offer wording: EUR 1,200 estimated professional/production value; EUR 299 VIPACH material and production cost contribution
- Package now explicitly includes the elegant champagne exhibition opening
- Lenticular technique has a clear explanation and localized international references
- Form backends validate and record 18+, terms and privacy acknowledgement versions

### Hero image
The approved Adobe Firefly concept image is included as `hero-gallery-firefly-original.jpeg` and used through responsive, non-cropped renditions (`hero-gallery-480.webp`, `hero-gallery-768.webp`, `hero-gallery-1152.webp`, `hero-gallery-1152.jpg`). A visible caption states that it is an illustration, does not depict a real gallery, and does not show the project’s actual venue.

### Legal review
The legal pages are carefully drafted for an Austrian/EU consumer project, but publication should still be reviewed by the organisation's Austrian legal adviser, especially the contracting entity, tax/VAT treatment, final venue/date, cancellation policy and model-release wording.
## v3 – lentikuláris GIF és Google Apps Script

- A lentikuláris technika mellé bekerült az Imgur-példa mindhárom nyelven.
- Az Imgur-tartalom adatvédelmi okból csak külön kattintás után töltődik be; addig nem jön létre harmadik féllel kapcsolat.
- A három meglévő Google Apps Script webapp URL változatlan maradt.
- A `Code_HU.gs`, `Code_EN.gs` és `Code_DE.gs` az eredeti működési logikát tartja meg; csak a 299 EUR-os összeg és az „egy bécsi galéria” megfogalmazás lett átvezetve a visszaigazoló e-mailben.
- Az új összeg e-mailes megjelenéséhez a három meglévő Apps Script projekt kódját frissíteni, majd ugyanazt a telepítést új verzióval közzétenni kell; új webapp URL nem szükséges.

## v9 — Premium Apple-style release

- Complete favicon and Apple touch icon family.
- English 1200 × 630 Open Graph/social share image.
- Reduced-motion-aware premium motion and glass navigation.
- No hidden files or folders.

## v10 — Typography and UX audit
- Persistent dark header in every state.
- Apple-inspired system typography, sizes, line-height and spacing.
- Reduced hero headline size on desktop, tablet and mobile.
- Price explanation separated into a distinct light information panel.
- Unreliable local GIF removed; replaced with a direct accessible Imgur example link.

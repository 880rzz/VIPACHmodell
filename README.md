# VIPACH modell.vipach.at

## Űrlaparchitektúra – v6 mail-only

Az oldal három nyelvi űrlapot használ, külön Google Apps Script web app végponttal:

- `Code_HU.gs` → `/hu/`
- `Code_EN.gs` → `/en/`
- `Code_DE.gs` → `/de/`

A backend nem használ Google Táblázatot és nem ír külön adatbázisba. Egy érvényes jelentkezéskor két e-mailt küld:

1. szervezői értesítés az `office@vipach.at` címre, a teljes űrlaptartalommal;
2. visszaigazolás a jelentkező által megadott e-mail-címre.

A weboldal csak akkor mutat teljes sikert, ha mindkét `MailApp.sendEmail()` hívás kivétel nélkül lefutott. A callback útvonala: `/form-callback/`.

## Apps Script telepítés

1. Másold be a megfelelő `Code_*.gs` fájlt az adott Apps Script projektbe.
2. Futtasd le kézzel egyszer a `testConfigurationAndEmail` függvényt.
3. Engedélyezd a MailApp használatát.
4. Üzembe helyezés → Központi telepítések kezelése → Szerkesztés → Új verzió → Üzembe helyezés.
5. Beállítás: Végrehajtás mint **Én**, hozzáférés **Bárki**.

A helyes backend-verzió: `2026-07-15-v6-mail-only`.

## Weboldalon frissítendő fájlok

- `hu/index.html`
- `en/index.html`
- `de/index.html`
- `form-callback/index.html`
- `hu/adatvedelem/index.html`
- `en/privacy/index.html`
- `de/datenschutz/index.html`

## Teszt

A `testConfigurationAndEmail` futása után az `office@vipach.at` címre tesztlevélnek kell érkeznie. Ezután egy valós űrlaptesztnél az office postafiók és a jelentkező címe is kap levelet.

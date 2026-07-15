# VIPACH űrlap – v6 mail-only javítás

## Gyökérok
A v5 Apps Script kötelezően meghívta a `SpreadsheetApp` szolgáltatást, ezért önálló scriptprojektben `NO_SPREADSHEET_CONNECTED` hibával leállt még a `MailApp.sendEmail()` hívások előtt. A rendszerhez valójában nincs szükség Google Táblázatra.

## Javítás
- A három backendből minden `SpreadsheetApp`, munkalap-, sormentési és statisztikai kód eltávolítva.
- A rendszer kizárólag két e-mailt küld: az office értesítést és a jelentkező visszaigazolását.
- Az office e-mail megy ki először, így legalább a jelentkezési adatok a szervezőhöz eljutnak akkor is, ha a jelentkezői levél hibázna.
- A frontend csak akkor mutat teljes sikert, ha mindkét `MailApp.sendEmail()` kivétel nélkül lefutott.
- Egyedi token + Script Cache védi a folyamatot az azonos beküldésből eredő dupla levélküldéstől.
- A korábbi, táblázatos `scroll_bottom` statisztika eltávolítva.
- A callback új `processed` mezőt használ; a backend átmenetileg `stored` kompatibilitási alias-t is küld a cache-elt v5 oldalhoz. Ez nem jelent adatbázis- vagy táblázatmentést.

## Telepítés
1. Cseréld le a megfelelő `Code_HU.gs`, `Code_EN.gs`, `Code_DE.gs` fájl tartalmát.
2. Mindhárom projektben kézzel futtasd le a `testConfigurationAndEmail` függvényt.
3. A végrehajtási napló helyes eredménye `OK | mail_test_sent_to=office@vipach.at ...`.
4. Deploy / Üzembe helyezés → Manage deployments / Központi telepítések kezelése → Edit / Szerkesztés → New version / Új verzió → Deploy.
5. Töltsd fel a három nyelvi `index.html` fájlt és a `form-callback/index.html` fájlt.

## Fontos
A `MailApp.sendEmail()` sikeres lefutása azt igazolja, hogy a Google átvette a levelet kézbesítésre. A tényleges postaládába érkezést spam-szűrés, visszapattanás vagy fogadó oldali szabály még befolyásolhatja.

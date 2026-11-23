# Salikartta – eduskunta_koodaus

Ryhmän yhteinen repo, johon tallennetaan Tietojärjestelmien kehittäminen -kurssilla (TX00CN62-3012) tehtävän ryhmätyön osuudet.

**Salikartta** on selaimessa toimiva sovellus, joka näyttää eduskunnan 200 kansanedustajaa täysistuntosalin kartalla. Paikkaa klikkaamalla näkee edustajan tiedot, ja edustajia voi suodattaa puolueen, vaalipiirin, ministeriyden ja nimen mukaan.

## ▶ Katso projektia

**https://raw.githack.com/Jamina9/eduskunta_koodaus/main/static/index.html**

Linkki avaa sivun suoraan repon `main`-haarasta, eikä sen katsomiseen tarvitse asentaa mitään. Ilman Flask-palvelinta sivu lukee datan suoraan `mps.json`- ja `puolueet.json`-tiedostoista.

> Kun GitHub Pages on otettu käyttöön, virallinen osoite on https://jamina9.github.io/eduskunta_koodaus/. Repon omistaja voi ottaa sen käyttöön: Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.

## Tiimi

| Rooli | Nimi |
|---|---|
| Product Owner (sprintti 2) | Julia Nirhamo |
| Scrum Master | Jamina Mäkinen |
| Kehittäjät | Kasperi Toivio, Edla Vensu, Aleksi Manssila, Julia Nirhamo |

Product backlog, sprint backlogit ja retrot ovat tiimin Excelissä *Scrum pohjat.xlsx*.

## Tiedostot

```
eduskunta_koodaus/
├── index.html            # ohjaa static/index.html-sivulle (GitHub Pages)
├── app.py                # Flask-palvelin + REST-rajapinta
├── test_app.py           # rajapinnan testit
├── requirements.txt
├── mps.json              # DATA: 200 kansanedustajaa (kurssin datapaketti)
├── puolueet.json         # puolueiden nimet, lyhenteet ja värit
├── seating.json          # istumajärjestys mps.json:sta johdettuna
├── static/
│   ├── index.html        # Salikartta-sivu
│   ├── css/style.css
│   └── js/
│       ├── api.js        # datan haku (Flask-rajapinta tai suoraan tiedostoista)
│       └── salikartta.js # salin piirto, paikkanapit, suodattimet
└── docs/
    └── aleksi-sprint2.md # Aleksin sprintti 2 -devausvaiheet
```

## Data

- **`mps.json`** on kurssin datapaketti (https://users.metropolia.fi/~peterh/mps.json). Kentät: `personNumber, seatNumber, first, last, party, minister, picture, twitter, bornYear, constituency`.
- Data on **vaalikaudelta 2019–2023**, joten hallituspuolueet ovat SDP, KESK, VIHR, VAS ja RKP. Hallitusta ei ole kovakoodattu, vaan se päätellään datasta: hallituspuolue on puolue, jolla on vähintään yksi ministeri.
- `seatNumber` 0 on puhemies. Paikat 1–199 kulkevat salissa rivi kerrallaan edestä taakse ja vasemmalta oikealle.
- Edustajien kuvat (`picture`) eivät aukea eduskunnan palvelimelta, joten sivu näyttää toistaiseksi nimikirjaimet.

## Aja omalla koneella

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
flask --app app run                # http://127.0.0.1:5000
python -m unittest -v              # testit
```

### REST-rajapinta

| Endpoint | Palauttaa |
|---|---|
| `GET /api/edustajat` | kaikki edustajat paikkajärjestyksessä; suodattimet `?puolue=sd&vaalipiiri=Helsinki&ministeri=1` |
| `GET /api/edustajat/<personNumber>` | yksi edustaja tai 404 |
| `GET /api/puolueet` | `koodi, nimi, lyhenne, vari, paikat, hallitus` |
| `GET /api/vaalipiirit` | vaalipiirit aakkosjärjestyksessä |
| `GET /api/sali` | hallitus/oppositio-paikat, enemmistöraja, hallituspuolueet, puhemies |

### Suodatus muista skripteistä

```js
window.salikartta.asetaSuodatin({ puolue: 'kok', vaalipiiri: 'Uusimaa' }); // palauttaa osumien määrän
window.salikartta.haeSuodatus().osumat;                                     // suodatetut edustajat
window.salikartta.tyhjennaSuodattimet();
```

## Työtapa

1. `git pull` ja oma haara: `git checkout -b <nimi>/<ominaisuus>`
2. Commitit pieninä ja kuvaavina
3. Pull request → yksi tiimiläinen katselmoi → merge `main`-haaraan
4. Merkitse tehtävä Exceliin tilaan *Done*

## Tilanne

| Ominaisuus | User story | Tila |
|---|---|---|
| Datan integrointi (Flask + REST) | – | ✅ |
| Salikartta paikkanumeron mukaan | ID 11 | ✅ |
| Hallitus/oppositio salikartassa | ID 9 | ✅ |
| Suodattimet + nimihaku | ID 3 | ✅ perus |
| Mobiilinäkymä | – | 🔜 |
| Edustajien kuvat | – | 🔜 (Edla) |
| Kahden edustajan vertailu | ID 10 | 🔜 sprintti 3 |

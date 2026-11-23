# Aleksin devausvaiheet – Sprint 2 (23.–29.11.2026)

Projekti: **Salikartta** · Product Owner: Julia Nirhamo · Tiimi: Kasperi Toivio, Edla Vensu, Jamina Mäkinen, Aleksi Manssila, Julia Nirhamo

## Mistä nämä tulevat

**Sprint Backlog 2 – Aleksin tehtävät**

| Tehtävä | Tila |
|---|---|
| Datan integrointi | To Do |
| Salikartan teknillinen työstäminen, napin toimiminen | To Do |

**Product Backlogin käyttäjätarinat, jotka ovat Aleksilla** (välilehti *ominaisuudet*)

| ID | Käyttäjätarina | Prioriteetti | Sprintti |
|---|---|---|---|
| 11 | Opiskelijana haluan nähdä edustajat istuntosalin kartalla paikkanumeron mukaan, jotta hahmotan salin rakenteen. | high | **2 (tämä)** |
| 9 | Käyttäjänä haluan nähdä ministerit omana listanaan sekä sen, mitkä puolueet ovat hallituksessa ja mitkä oppositiossa. *(Backlogissa: "yhdistetään salikarttaan (ID 11)")* | high | **2 – vain salikarttaosuus** |
| 10 | Käyttäjänä haluan vertailla kahta edustajaa rinnakkain, jotta näen heidän tietojensa erot yhdellä silmäyksellä. | low | 3 (myöhemmin) |

## Tavoite: miltä valmiin pitää näyttää

Visuaalinen malli: https://claude.ai/artifact/AGJBrKhh6rRFranjxcKenT#play-7b3a7db3ae22

- Ylhäällä palkki, jossa logo **Salikartta**, navigaatio (Kartta · Edustajat · Hallitus · Tilastot) ja hakukenttä.
- Vasemmalla suodattimet: puolueet ja niiden paikkamäärät, vaalipiiri, "Vain ministerit".
- Keskellä **täysistuntosali**: 200 pyöreää paikkanappia puoliympyrässä puolueen värillä ja puhemiehen paikka alhaalla. Alla hallitus–oppositio-palkki.
- Oikealla **valittu edustaja**: nimikirjaimet tai kuva, puolue, ministerimerkki, vaalipiiri, paikka, syntymävuosi, ikä sekä painikkeet Avaa profiili ja Vertaa.
- Mobiilissa suodattimet ovat vaakasuuntaisina siruina, salikartta on alla ja valittu edustaja kortissa näytön alareunassa.

**Tyyli (kopioi mallista sellaisenaan):**

```css
:root {
  --bg: #F4F5F7;  --surface: #FFFFFF;  --border: #E3E6EB;  --input-border: #D5D9E0;
  --ink: #14181F; --ink-2: #3B4250;    --muted: #5B6372;
  --accent: #1D4ED8; --accent-soft: #EEF2FF; --opposition: #B9C0CC;
  --radius-card: 14px; --radius-ctrl: 10px;
}
body { font-family: Inter, system-ui, sans-serif; font-size: 15px; background: var(--bg); color: var(--ink); }
h1, .logo { font-family: 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: -0.01em; }
```

Fontit: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap`

## Huomioita datasta (`mps.json`)

- 200 edustajaa, kentät: `personNumber, seatNumber, first, last, party, minister, picture, twitter, bornYear, constituency`.
- **Data on vaalikaudelta 2019–2023**, ei nykyiseltä. Paikkajako: sd 40, ps 39, kok 38, kesk 31, vihr 20, vas 16, r 10, kd 5, liik 1. Mallin luvut (KOK 48 jne.) ovat siis keksittyjä.
- **Hallitusta ei kannata kovakoodata.** Päättele se datasta: hallituspuolue = puolue, jolla on vähintään yksi `minister: true`. Datassa on 19 ministeriä (sd, kesk, vihr, vas, r).
- **`seatNumber` 0 = puhemies** (Anu Vehviläinen). Paikat 1–199 ovat salissa.
- Puoluekoodit ovat pienellä (`sd`, `r` = RKP). Tee kartta koodista nimeen ja väriin (vaihe 3).
- Kuvapolut (`attachment/member/pictures/...`) eivät toimi suoraan eduskunnan palvelimelta (403). Kuvat hoitaa Edlan tehtävä *Puuttuvien kuvien integrointi*. Siihen asti näytä nimikirjaimet puolueen värillä.
- Twitter-linkki on vain 34 edustajalla, joten piilota painike, jos kenttä on tyhjä.

## Ehdotettu tiedostorakenne

Sovita tähän, mitä tiedostopohjassa (Julia & Aleksi) on jo sovittu.

```
eduskunta_koodaus/
├── app.py                # Flask-palvelin + REST-rajapinta
├── mps.json              # data (jo repossa)
├── static/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js        # fetch-kutsut palvelimelle
│       └── salikartta.js # salin piirto + napit
└── docs/
```

---

## Vaiheet

### Vaihe 0 – Oma haara
```bash
git pull
git checkout -b aleksi/salikartta
```
✅ Valmis, kun haara on pushattu (`git push -u origin aleksi/salikartta`).

### Vaihe 1 – Flask-palvelin pystyyn *(Datan integrointi)*
1. `pip install flask` ja `requirements.txt`, jossa rivi `flask`.
2. `app.py` lukee `mps.json`:n kerran käynnistyessä ja tarjoilee `static/`-kansion.

```python
import json
from flask import Flask, jsonify, abort, request

app = Flask(__name__, static_folder="static", static_url_path="")

with open("mps.json", encoding="utf-8") as f:
    EDUSTAJAT = json.load(f)

@app.get("/")
def etusivu():
    return app.send_static_file("index.html")
```
✅ Valmis, kun `flask --app app run` käynnistyy ja `http://127.0.0.1:5000` näyttää tyhjän sivun ilman virheitä.

### Vaihe 2 – REST-rajapinta *(Datan integrointi)*

| Endpoint | Palauttaa |
|---|---|
| `GET /api/edustajat` | kaikki 200, valinnaiset suodattimet `?puolue=sd&vaalipiiri=Helsinki&ministeri=1` |
| `GET /api/edustajat/<personNumber>` | yksi edustaja tai 404 |
| `GET /api/puolueet` | `[{koodi, nimi, vari, paikat, hallitus}]` |
| `GET /api/sali` | `{hallitus: n, oppositio: n, puhemies: {...}}` |

```python
@app.get("/api/edustajat")
def edustajat():
    tulos = EDUSTAJAT
    if p := request.args.get("puolue"):
        tulos = [e for e in tulos if e["party"] == p]
    if v := request.args.get("vaalipiiri"):
        tulos = [e for e in tulos if e["constituency"] == v]
    if request.args.get("ministeri") == "1":
        tulos = [e for e in tulos if e["minister"]]
    return jsonify(tulos)

@app.get("/api/edustajat/<int:nro>")
def edustaja(nro):
    for e in EDUSTAJAT:
        if e["personNumber"] == nro:
            return jsonify(e)
    abort(404)
```
✅ Valmis, kun jokainen endpoint palauttaa selaimessa oikeaa JSONia, `/api/edustajat/1` palauttaa 404 ja suodattimet toimivat yhdessä.

### Vaihe 3 – Puoluetiedot ja hallituksen päättely *(Datan integrointi + ID 9)*

```python
PUOLUEET = {
    "sd":   ("Suomen Sosialidemokraattinen Puolue", "#E11931"),
    "ps":   ("Perussuomalaiset",                    "#D9A400"),
    "kok":  ("Kansallinen Kokoomus",                "#006288"),
    "kesk": ("Suomen Keskusta",                     "#01954B"),
    "vihr": ("Vihreä liitto",                       "#4CAF1F"),
    "vas":  ("Vasemmistoliitto",                    "#E5195E"),
    "r":    ("Ruotsalainen kansanpuolue",           "#FFE08A"),
    "kd":   ("Kristillisdemokraatit",               "#1F5BC4"),
    "liik": ("Liike Nyt",                           "#8E5BB5"),
}
HALLITUS = {e["party"] for e in EDUSTAJAT if e["minister"]}
```
- `/api/puolueet` laskee paikat datasta, ei kovakoodattuna.
- Jos tulee uusi puoluekoodi, jota sanakirjassa ei ole, käytä harmaata `#8A93A3` äläkä kaada sovellusta.

✅ Valmis, kun `/api/puolueet`-paikkojen summa on 200 ja `hallitus: true` on täsmälleen sd, kesk, vihr, vas ja r.

### Vaihe 4 – Sivun runko ja tyyli *(Salikartan teknillinen työstäminen)*
1. `index.html`: header (logo, navigaatio, haku), kolme saraketta (`aside` suodattimet · `section` sali · `aside` valittu edustaja).
2. `style.css`: yllä olevat värimuuttujat. Sarakkeet `display:flex; flex-wrap:wrap; gap:24px`, jolloin ne pinoutuvat kapealla näytöllä.
3. Käytä oikeita `<button>`-, `<select>`-, `<label>`- ja `<input>`-elementtejä, älä klikattavia `div`ejä.

✅ Valmis, kun staattinen sivu näyttää mallin kaltaiselta, eikä 390 px leveydellä tule vaakavieritystä.

### Vaihe 5 – Salin geometria ja paikkojen piirto *(Salikartan teknillinen työstäminen + ID 11)*
1. `api.js`: `haeEdustajat()` → `fetch('/api/edustajat').then(r => r.json())`.
2. `salikartta.js`: laske 199 paikalle sijainnit puoliympyrän riveille. Logiikan voi ottaa mallista: 8 riviä, ulommilla riveillä enemmän paikkoja.

```js
function laskePaikat(maara = 199, rivit = 8) {
  const r = [...Array(rivit)].map((_, i) => 0.36 + i * (0.64 / (rivit - 1)));
  const summa = r.reduce((a, b) => a + b, 0);
  const n = r.map(x => Math.round(maara * x / summa));
  n[rivit - 1] += maara - n.reduce((a, b) => a + b, 0);
  const pos = [];
  r.forEach((ri, k) => {
    for (let j = 0; j < n[k]; j++) {
      const t = Math.PI * (1 - j / (n[k] - 1));
      pos.push({ t, r: ri, left: 50 + ri * Math.cos(t) * 44, top: 90 - ri * Math.sin(t) * 86 });
    }
  });
  // vasemmalta oikealle, sisältä ulos -> indeksi = paikkanumero - 1
  return pos.sort((a, b) => (b.t - a.t) || (a.r - b.r));
}
```
3. Järjestä edustajat `seatNumber`in mukaan. Paikka *n* (1–199) saa sijainnin `pos[n-1]`, ja paikka 0 eli puhemies piirretään erikseen puhujakorokkeelle.
4. Jokainen paikka on `<button class="seat">`, jossa `style.left/top` prosentteina, taustana puolueen väri sekä `aria-label` ja `title` muodossa `"Paikka 41: Etunimi Sukunimi (SDP)"`.

✅ Valmis, kun salissa on 199 nappia ja puhemies. Värit vastaavat puolueita, ja saman puolueen paikat ovat ryhmässä (tarkista silmämääräisesti).

> **Toteutettu:** datan perusteella paikat 1–199 kulkevat **rivi kerrallaan edestä taakse ja vasemmalta oikealle**. Jokaisella rivillä puolueet ovat järjestyksessä vasemmistosta oikeistoon (vas, sd, vihr, kesk, r, kd, kok, ps). Rivien pituudet ovat `[16, 22, 26, 32, 30, 29, 26, 18]` (= 199), ja ne on päätelty kohdista, joissa järjestys hyppää takaisin vasemmalle. Siksi `laskePaikat()` käyttää näitä rivejä eikä tasajakoa.

### Vaihe 6 – Napin toimiminen *(Salikartan teknillinen työstäminen)*
1. Pidä tila yhdessä oliossa: `const tila = { valittu: null, puolue: null, vaalipiiri: '', vainMinisterit: false }`.
2. Paikan klikkaus asettaa `tila.valittu = edustaja` → `paivitaPaneeli()` + `piirraSali()`.
3. Valittu paikka saa renkaan `box-shadow: 0 0 0 3px #fff, 0 0 0 5px #14181F`.
4. Oikea paneeli näyttää nimen, puolueen koko nimen, ministerimerkin (jos `minister`), vaalipiirin, paikan, syntymävuoden ja iän (`new Date().getFullYear() - bornYear`). Kuvan paikalla on nimikirjaimet puolueen värillä.
5. Twitter-painike näkyy vain, jos `twitter` ei ole tyhjä.
6. Näppäimistö: Tab kulkee paikkoihin ja Enter/välilyönti valitsee (tulee ilmaiseksi, kun käytät `<button>`ia). Lisää `:focus-visible`-reunus.

✅ Valmis, kun klikkaus tai Enter mille tahansa paikalle päivittää paneelin oikeilla tiedoilla, puhemieskin on valittavissa ja konsolissa ei ole virheitä.

### Vaihe 7 – Suodatus salissa *(rajapinta Kassun sort-työkalulle)*
1. Funktio `osuu(edustaja)` palauttaa true/false tilan suodattimien mukaan.
2. Paikat, jotka eivät osu suodattimeen, jäävät näkyviin himmennettyinä (`opacity: .15`). Paikkoja ei poisteta, jotta salin muoto säilyy.
3. Teksti "**X / 200 edustajaa näkyvissä**".
4. Sovi Kassun kanssa yhteinen rajapinta, esim. `asetaSuodatin({ puolue, vaalipiiri, vainMinisterit })`, jotta hänen sort- ja suodatinnappinsa ohjaavat samaa salia.

✅ Valmis, kun puolueen klikkaus himmentää muut, "Vain ministerit" näyttää 19 paikkaa ja "Tyhjennä suodattimet" palauttaa kaiken.

> **Toteutettu – rajapinta Kassulle** (`static/js/salikartta.js`):
>
> ```js
> // ES-moduulina
> import { asetaSuodatin, tyhjennaSuodattimet, haeSuodatus } from './salikartta.js';
> // tai mistä tahansa skriptistä
> window.salikartta.asetaSuodatin({ puolue: 'kok', vaalipiiri: 'Uusimaa' });
> ```
>
> | Funktio | Tekee |
> |---|---|
> | `asetaSuodatin({ puolue, vaalipiiri, vainMinisterit, haku })` | muuttaa vain annetut kentät, päivittää salin ja sivupalkin, palauttaa osumien määrän |
> | `tyhjennaSuodattimet()` | kaikki oletuksiin |
> | `haeSuodatus()` | `{ suodattimet, osumat }`: osumat ovat edustajaolioita, joita sort-työkalu voi järjestää ja listata |
>
> Hakukenttä on kytketty samaan rajapintaan (`haku`: nimen osa, kirjainkoolla ei väliä).

### Vaihe 8 – Hallitus vs. oppositio -palkki *(ID 9 yhdistettynä salikarttaan)*
- Hae `/api/sali`, ja näytä palkissa `Hallitus N` (tumma) ja `Oppositio M` (harmaa) sekä leveys prosentteina.
- Alle teksti: "Hallituspuolueet: SDP, KESK, VIHR, VAS, RKP · enemmistöraja 101". Puolueet tulevat datasta.
- Puoluelistaan jokaisen puolueen kohdalle pieni merkintä H/O.

✅ Valmis, kun luvut täsmäävät `/api/puolueet`-tietoihin ja yhteensä on 200.

### Vaihe 9 – Mobiili
- Alle 720 px: suodattimet vaakasuuntaisiksi siruiksi (`overflow-x:auto`), valittu edustaja kortiksi näytön alareunaan ja navigaatio alapalkkiin.
- Paikkanapin koko on suhteessa salin leveyteen (`width: 2.6%`), joten sali skaalautuu itsestään.

✅ Valmis, kun Chrome DevToolsin iPhone-näkymässä (390×844) kaikki toimii eikä tule vaakavieritystä.

### Vaihe 10 – Testaus, PR ja sprint review
- [ ] Kaikki 4 endpointia testattu selaimessa
- [ ] 199 paikkaa ja puhemies piirtyvät, värit oikein
- [ ] Klikkaus ja näppäimistö päivittävät paneelin
- [ ] Suodattimet ja tyhjennys toimivat
- [ ] Hallitus/oppositio-luvut oikein (summa 200)
- [ ] Mobiilinäkymä OK
- [ ] Ei virheitä konsolissa
- [ ] Pull request `aleksi/salikartta` → `main`, yksi tiimiläinen katselmoi
- [ ] Sprint Backlogissa tila *Done* ja kuvakaappaus sprint review -kalvoille

---

## Myöhemmin (Sprint 3 →)

**ID 10 – Kahden edustajan vertailu** (low)
- Paneelin "Vertaa"-painike tallentaa ensimmäisen edustajan, ja seuraava paikan klikkaus avaa vertailunäkymän.
- Vertailutaulukossa kaksi saraketta: puolue, vaalipiiri, ikä, ministeri, paikka. Erot korostetaan.
- Rajapinta: `GET /api/vertaa?a=<id>&b=<id>`.

## Riippuvuudet muihin

| Kuka | Mitä tarvitset / annat |
|---|---|
| Edla | Kuvat (*Puuttuvien kuvien integrointi*). Paneeli käyttää kuvaa, kun se on saatavilla, muuten nimikirjaimia. |
| Kassu | Sort-työkalu ja napit → yhteinen `asetaSuodatin()`-rajapinta (vaihe 7) |
| Jamina | Visuaalinen ilme. Sovi, käytetäänkö yllä olevia värejä ja fontteja koko sivustolla. |
| Julia | Priorisointi. Kerro, jos ID 9:n ministerilista halutaan myös omaksi sivukseen. |

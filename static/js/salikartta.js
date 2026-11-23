// Salikartta: salin piirto (vaihe 5) ja paikkanappien toiminta (vaihe 6).
import { haeEdustajat, haePuolueet, haeVaalipiirit, haeSali } from './api.js';

const PUHEMIESPAIKKA = 0;

// Sovelluksen tila yhdessä paikassa.
const tila = {
  edustajat: [],          // paikkajärjestyksessä
  puolueet: new Map(),    // koodi -> { nimi, lyhenne, vari, hallitus, paikat }
  valittu: null,          // valittu edustaja
  // Suodattimet (vaihe 7). Muuta näitä vain asetaSuodatin()-funktiolla.
  puolue: null,           // puoluekoodi, esim. 'sd', tai null = kaikki
  vaalipiiri: '',         // '' = kaikki
  vainMinisterit: false,
  haku: '',               // nimihaku, kirjainkoolla ei väliä
};

const OLETUSSUODATTIMET = { puolue: null, vaalipiiri: '', vainMinisterit: false, haku: '' };

const $ = (id) => document.getElementById(id);

/* ---------------- Geometria ---------------- */

/**
 * Rivien paikkamäärät edestä taakse. Päätelty mps.json-datasta: paikat 1–199
 * kulkevat rivi kerrallaan vasemmalta oikealle, ja jokaisella rivillä puolueet
 * ovat järjestyksessä vasemmistosta oikeistoon (vas, sd, vihr, kesk, r, kd, kok, ps).
 * Uusi rivi alkaa siitä, missä järjestys "hyppää" takaisin vasemmalle.
 */
export const RIVIT = [16, 22, 26, 32, 30, 29, 26, 18];

/**
 * Laskee sijainnit paikoille puoliympyrän riveille.
 * Palauttaa listan, jonka indeksi = paikkanumero - 1: ensin eturivi
 * vasemmalta oikealle, sitten seuraava rivi jne.
 * left/top ovat prosentteja salikartan laatikosta.
 */
export function laskePaikat(rivit = RIVIT) {
  const paikat = [];
  rivit.forEach((n, k) => {
    const r = 0.36 + k * (0.64 / (rivit.length - 1)); // säde: eturivi sisimpänä
    for (let j = 0; j < n; j++) {
      const t = Math.PI * (1 - j / (n - 1)); // vasemmalta (π) oikealle (0)
      paikat.push({ rivi: k + 1, left: 50 + r * Math.cos(t) * 44, top: 90 - r * Math.sin(t) * 86 });
    }
  });
  return paikat;
}

/* ---------------- Apufunktiot ---------------- */

const puolueOf = (e) =>
  tila.puolueet.get(e.party) ?? { nimi: e.party, lyhenne: e.party.toUpperCase(), vari: '#8A93A3' };

const koko_nimi = (e) => `${e.first} ${e.last}`;
const nimikirjaimet = (e) => `${e.first[0] ?? ''}${e.last[0] ?? ''}`.toUpperCase();

/** Tumma vai valkoinen teksti taustavärin päälle (WCAG-suhteellinen kirkkaus). */
function tekstivari(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.25 ? '#14181F' : '#FFFFFF';
}

function paikanNimi(e) {
  const p = puolueOf(e);
  const paikka = e.seatNumber === PUHEMIESPAIKKA ? 'Puhemies' : `Paikka ${e.seatNumber}`;
  return `${paikka}: ${koko_nimi(e)} (${p.lyhenne})`;
}

/** Osuuko edustaja nykyisiin suodattimiin. */
function osuu(e) {
  const haku = tila.haku.trim().toLocaleLowerCase('fi');
  return (
    (!tila.puolue || e.party === tila.puolue) &&
    (!tila.vaalipiiri || e.constituency === tila.vaalipiiri) &&
    (!tila.vainMinisterit || e.minister) &&
    (!haku || koko_nimi(e).toLocaleLowerCase('fi').includes(haku))
  );
}

/* ---------------- Suodatus (vaihe 7) ---------------- */

/**
 * Yhteinen rajapinta suodattimille. Sivun omat kontrollit ja Kassun
 * sort-työkalu kutsuvat tätä, jolloin kaikki ohjaavat samaa salia.
 *
 *   asetaSuodatin({ puolue: 'sd' })
 *   asetaSuodatin({ vaalipiiri: 'Helsinki', vainMinisterit: true })
 *   asetaSuodatin({ haku: 'marin' })
 *
 * Annetut kentät muuttuvat, muut pysyvät ennallaan. Palauttaa osumien määrän.
 */
export function asetaSuodatin(muutokset = {}) {
  for (const avain of Object.keys(muutokset)) {
    if (!(avain in OLETUSSUODATTIMET)) {
      console.warn(`asetaSuodatin: tuntematon suodatin "${avain}"`);
      continue;
    }
    tila[avain] = muutokset[avain] ?? OLETUSSUODATTIMET[avain];
  }
  paivitaSuodatinKontrollit();
  return paivitaSali();
}

/** Palauttaa kaikki suodattimet oletuksiin. */
export function tyhjennaSuodattimet() {
  return asetaSuodatin({ ...OLETUSSUODATTIMET });
}

/** Nykyiset suodattimet (kopio) ja niihin osuvat edustajat. */
export function haeSuodatus() {
  const suodattimet = Object.fromEntries(Object.keys(OLETUSSUODATTIMET).map((k) => [k, tila[k]]));
  return { suodattimet, osumat: tila.edustajat.filter(osuu) };
}

/** Pitää sivupalkin kontrollit samassa tilassa kuin suodattimet. */
function paivitaSuodatinKontrollit() {
  for (const nappi of $('puoluelista').querySelectorAll('.puolue')) {
    nappi.setAttribute('aria-pressed', String(nappi.dataset.koodi === tila.puolue));
  }
  $('vaalipiiri').value = tila.vaalipiiri;
  $('vainMinisterit').checked = tila.vainMinisterit;
  if ($('haku').value !== tila.haku) $('haku').value = tila.haku;
}

function kytkeSuodattimet() {
  $('puoluelista').addEventListener('click', (t) => {
    const nappi = t.target.closest('.puolue');
    if (!nappi) return;
    const koodi = nappi.dataset.koodi;
    asetaSuodatin({ puolue: tila.puolue === koodi ? null : koodi }); // toinen klikkaus poistaa
  });
  $('vaalipiiri').addEventListener('change', (t) => asetaSuodatin({ vaalipiiri: t.target.value }));
  $('vainMinisterit').addEventListener('change', (t) => asetaSuodatin({ vainMinisterit: t.target.checked }));
  $('haku').addEventListener('input', (t) => asetaSuodatin({ haku: t.target.value }));
  $('tyhjenna').addEventListener('click', tyhjennaSuodattimet);
}

/* ---------------- Salin piirto ---------------- */

function luoSali() {
  const sali = $('salikartta');
  sali.replaceChildren();

  const salissa = tila.edustajat.filter((e) => e.seatNumber !== PUHEMIESPAIKKA);
  const sijainnit = laskePaikat();
  if (sijainnit.length !== salissa.length) {
    console.warn(`Rivien paikkamäärä (${sijainnit.length}) ≠ edustajia salissa (${salissa.length})`);
  }

  salissa.forEach((e, i) => {
    const s = sijainnit[i];
    if (!s) return;
    const nappi = document.createElement('button');
    nappi.type = 'button';
    nappi.className = 'paikka';
    nappi.dataset.nro = e.personNumber;
    nappi.style.left = `${s.left.toFixed(2)}%`;
    nappi.style.top = `${s.top.toFixed(2)}%`;
    nappi.style.background = puolueOf(e).vari;
    nappi.setAttribute('aria-label', paikanNimi(e));
    nappi.setAttribute('aria-pressed', 'false');
    nappi.title = paikanNimi(e);
    sali.append(nappi);
  });

  const puhemies = tila.edustajat.find((e) => e.seatNumber === PUHEMIESPAIKKA);
  if (puhemies) {
    const nappi = document.createElement('button');
    nappi.type = 'button';
    nappi.className = 'puhemies';
    nappi.dataset.nro = puhemies.personNumber;
    nappi.setAttribute('aria-label', paikanNimi(puhemies));
    nappi.setAttribute('aria-pressed', 'false');
    nappi.title = paikanNimi(puhemies);
    const koroke = document.createElement('span');
    koroke.className = 'koroke';
    const teksti = document.createElement('span');
    teksti.className = 'teksti';
    teksti.textContent = 'Puhemies';
    nappi.append(koroke, teksti);
    sali.append(nappi);
  }
}

/** Päivittää valinnan ja himmennykset ilman että nappeja luodaan uudelleen. */
function paivitaSali() {
  let nakyvissa = 0;
  for (const nappi of $('salikartta').querySelectorAll('button')) {
    const e = tila.edustajat.find((x) => x.personNumber === Number(nappi.dataset.nro));
    const ok = osuu(e);
    if (ok) nakyvissa++;
    nappi.classList.toggle('himmea', !ok);
    nappi.setAttribute('aria-pressed', String(tila.valittu?.personNumber === e.personNumber));
  }
  $('nakyvissa').textContent = nakyvissa;
  $('yhteensa').textContent = tila.edustajat.length;
  return nakyvissa;
}

/* ---------------- Valittu edustaja -paneeli ---------------- */

function paivitaPaneeli() {
  const e = tila.valittu;
  $('paneeliTyhja').hidden = Boolean(e);
  $('paneeliSisalto').hidden = !e;
  if (!e) return;

  const p = puolueOf(e);
  const kuva = $('pKuva');
  // Kuvat tulevat Edlan tehtävästä; siihen asti nimikirjaimet puolueen värillä.
  kuva.textContent = nimikirjaimet(e);
  kuva.style.background = p.vari;
  kuva.style.color = tekstivari(p.vari);

  $('pNimi').textContent = koko_nimi(e);
  $('pPuolue').textContent = p.nimi;

  const puhemies = e.seatNumber === PUHEMIESPAIKKA;
  $('pMinisteri').hidden = !(e.minister || puhemies);
  $('pMinisteriTeksti').textContent = puhemies ? 'Puhemies' : 'Ministeri';

  $('pVaalipiiri').textContent = e.constituency;
  $('pPaikka').textContent = puhemies ? 'Puhemies' : e.seatNumber;
  $('pVuosi').textContent = e.bornYear;
  $('pIka').textContent = `${new Date().getFullYear() - e.bornYear} v`;

  const tw = $('pTwitter');
  const twOk = /^https:\/\/(www\.)?(twitter|x)\.com\//.test(e.twitter ?? '');
  tw.hidden = !twOk;
  if (twOk) tw.href = e.twitter;
}

function valitse(personNumber) {
  tila.valittu = tila.edustajat.find((e) => e.personNumber === personNumber) ?? null;
  paivitaSali();
  paivitaPaneeli();
}

/* ---------------- Sivupalkki ja voimasuhteet ---------------- */

function piirraPuolueet() {
  const lista = $('puoluelista');
  lista.replaceChildren();
  for (const [koodi, p] of tila.puolueet) {
    const nappi = document.createElement('button');
    nappi.type = 'button';
    nappi.className = 'puolue';
    nappi.dataset.koodi = koodi;
    nappi.setAttribute('aria-pressed', 'false');
    nappi.title = p.hallitus ? `${p.nimi} (hallitus)` : `${p.nimi} (oppositio)`;

    const pallo = document.createElement('span');
    pallo.className = 'pallo';
    pallo.style.background = p.vari;
    pallo.setAttribute('aria-hidden', 'true');
    const lyhenne = Object.assign(document.createElement('span'), { className: 'lyhenne', textContent: p.lyhenne });
    const nimi = Object.assign(document.createElement('span'), { className: 'nimi', textContent: p.nimi });
    const lkm = Object.assign(document.createElement('span'), { className: 'lkm', textContent: p.paikat });
    nappi.append(pallo, lyhenne, nimi, lkm);
    lista.append(nappi);
  }
}

function piirraVaalipiirit(vaalipiirit) {
  const valikko = $('vaalipiiri');
  for (const v of vaalipiirit) valikko.append(new Option(v, v));
}

function piirraVoimasuhteet(sali) {
  $('hallitusLkm').textContent = sali.hallitus;
  $('oppositioLkm').textContent = sali.oppositio;
  $('hallitusPalkki').style.width = `${(sali.hallitus / sali.yhteensa) * 100}%`;
  const puolueet = sali.hallituspuolueet.map((p) => p.lyhenne).join(', ');
  $('hallitusTeksti').textContent = `Hallituspuolueet: ${puolueet} · enemmistöraja ${sali.enemmistoraja}`;
}

/* ---------------- Käynnistys ---------------- */

async function kaynnista() {
  try {
    const [edustajat, puolueet, vaalipiirit, sali] = await Promise.all([
      haeEdustajat(), haePuolueet(), haeVaalipiirit(), haeSali(),
    ]);
    tila.edustajat = edustajat;
    tila.puolueet = new Map(puolueet.map((p) => [p.koodi, p]));

    piirraPuolueet();
    piirraVaalipiirit(vaalipiirit);
    piirraVoimasuhteet(sali);
    luoSali();
    kytkeSuodattimet();
    paivitaSuodatinKontrollit();
    paivitaSali();
    paivitaPaneeli();
  } catch (virhe) {
    console.error(virhe);
    const el = $('virhe');
    el.textContent = 'Tietojen haku epäonnistui. Onko Flask-palvelin käynnissä?';
    el.hidden = false;
  }

  // Yksi kuuntelija koko salille (event delegation): klikkaus ja Enter/välilyönti.
  $('salikartta').addEventListener('click', (tapahtuma) => {
    const nappi = tapahtuma.target.closest('button[data-nro]');
    if (nappi) valitse(Number(nappi.dataset.nro));
  });
}

// Muut skriptit (esim. Kassun sort-työkalu) voivat käyttää suodatusta myös
// ilman importia: window.salikartta.asetaSuodatin({ puolue: 'kok' })
window.salikartta = { asetaSuodatin, tyhjennaSuodattimet, haeSuodatus };

kaynnista();

// Datan haku. Kaksi tilaa:
//
// 1. Flask-palvelin käynnissä (flask --app app run) -> REST-rajapinta /api/...
// 2. Ei palvelinta (esim. GitHub Pages tai raw.githack -esikatselu)
//    -> luetaan mps.json ja puolueet.json suoraan repon juuresta ja lasketaan
//       samat tiedot selaimessa. Logiikka vastaa app.py:tä.
//
// Muu koodi ei tiedä, kumpi tila on käytössä: funktiot palauttavat saman muotoisen datan.

const TUNTEMATON_VARI = '#8A93A3';
const PUHEMIESPAIKKA = 0;

async function haeJson(polku) {
  const vastaus = await fetch(polku);
  if (!vastaus.ok) throw new Error(`${polku}: ${vastaus.status} ${vastaus.statusText}`);
  return vastaus.json();
}

/* ---------- Tila 2: laskenta selaimessa ---------- */

let paikallinen = null;

function paikallinenData() {
  paikallinen ??= (async () => {
    const [edustajat, puolueTaulu] = await Promise.all([
      haeJson('../mps.json'),
      haeJson('../puolueet.json'),
    ]);
    const hallitus = new Set(edustajat.filter((e) => e.minister).map((e) => e.party));
    const puolue = (koodi) => ({
      koodi,
      ...(puolueTaulu[koodi] ?? { nimi: koodi, lyhenne: koodi.toUpperCase(), vari: TUNTEMATON_VARI }),
      hallitus: hallitus.has(koodi),
    });

    const paikat = new Map();
    for (const e of edustajat) paikat.set(e.party, (paikat.get(e.party) ?? 0) + 1);
    const hallitusLkm = edustajat.filter((e) => hallitus.has(e.party)).length;

    return {
      edustajat: [...edustajat].sort((a, b) => a.seatNumber - b.seatNumber),
      puolueet: [...paikat]
        .map(([k, n]) => ({ ...puolue(k), paikat: n }))
        .sort((a, b) => b.paikat - a.paikat || a.koodi.localeCompare(b.koodi)),
      vaalipiirit: [...new Set(edustajat.map((e) => e.constituency))].sort((a, b) => a.localeCompare(b, 'fi')),
      sali: {
        yhteensa: edustajat.length,
        hallitus: hallitusLkm,
        oppositio: edustajat.length - hallitusLkm,
        enemmistoraja: Math.floor(edustajat.length / 2) + 1,
        hallituspuolueet: [...hallitus].sort().map(puolue),
        puhemies: edustajat.find((e) => e.seatNumber === PUHEMIESPAIKKA) ?? null,
      },
    };
  })();
  return paikallinen;
}

/* ---------- Tilan valinta ---------- */

let tila = null; // 'palvelin' | 'paikallinen'

async function hae(apiPolku, avain) {
  if (tila !== 'paikallinen') {
    try {
      const data = await haeJson(`api/${apiPolku}`);
      tila = 'palvelin';
      return data;
    } catch (virhe) {
      if (tila === 'palvelin') throw virhe; // palvelin oli käytössä, oikea virhe
      tila = 'paikallinen';
      console.info('Flask-rajapintaa ei löytynyt, luetaan data suoraan tiedostoista.');
    }
  }
  return (await paikallinenData())[avain];
}

export const haeEdustajat = () => hae('edustajat', 'edustajat');
export const haePuolueet = () => hae('puolueet', 'puolueet');
export const haeVaalipiirit = () => hae('vaalipiirit', 'vaalipiirit');
export const haeSali = () => hae('sali', 'sali');
export const tietolahde = () => tila;

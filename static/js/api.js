// Fetch-kutsut Flask-palvelimen REST-rajapintaan.

async function hae(polku) {
  const vastaus = await fetch(polku);
  if (!vastaus.ok) {
    throw new Error(`${polku}: ${vastaus.status} ${vastaus.statusText}`);
  }
  return vastaus.json();
}

export const haeEdustajat = () => hae('/api/edustajat');
export const haeEdustaja = (personNumber) => hae(`/api/edustajat/${personNumber}`);
export const haePuolueet = () => hae('/api/puolueet');
export const haeVaalipiirit = () => hae('/api/vaalipiirit');
export const haeSali = () => hae('/api/sali');

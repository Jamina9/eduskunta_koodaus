# eduskunta_koodaus
Ryhmän yhteinen repo, johon tallennetaan tietojärjestelmien kehittäminen kurssilla tehtävän ryhmätyön osuudet.

## Käynnistys

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run          # http://127.0.0.1:5000
python -m unittest -v        # testit
```

### REST-rajapinta

| Endpoint | Palauttaa |
|---|---|
| `GET /api/edustajat` | kaikki edustajat paikkajärjestyksessä; suodattimet `?puolue=sd&vaalipiiri=Helsinki&ministeri=1` |
| `GET /api/edustajat/<personNumber>` | yksi edustaja tai 404 |
| `GET /api/puolueet` | `koodi, nimi, lyhenne, vari, paikat, hallitus` |
| `GET /api/vaalipiirit` | vaalipiirit aakkosjärjestyksessä |
| `GET /api/sali` | hallitus/oppositio-paikat, enemmistöraja, hallituspuolueet, puhemies |

Hallitus päätellään datasta: puolue, jolla on vähintään yksi ministeri.

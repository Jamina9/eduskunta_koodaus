"""Salikartta – Flask-palvelin ja REST-rajapinta kansanedustajien dataan.

Käynnistys:  flask --app app run
"""
import json
from pathlib import Path

from flask import Flask, abort, jsonify, request

HAKEMISTO = Path(__file__).parent

app = Flask(__name__, static_folder="static", static_url_path="")
app.json.ensure_ascii = False  # ääkköset sellaisenaan JSON-vastauksiin

with open(HAKEMISTO / "mps.json", encoding="utf-8") as f:
    EDUSTAJAT = json.load(f)

# Puoluekoodi -> (nimi, lyhenne näytölle, väri)
PUOLUEET = {
    "sd":   ("Suomen Sosialidemokraattinen Puolue", "SDP",  "#E11931"),
    "ps":   ("Perussuomalaiset",                    "PS",   "#D9A400"),
    "kok":  ("Kansallinen Kokoomus",                "KOK",  "#006288"),
    "kesk": ("Suomen Keskusta",                     "KESK", "#01954B"),
    "vihr": ("Vihreä liitto",                       "VIHR", "#4CAF1F"),
    "vas":  ("Vasemmistoliitto",                    "VAS",  "#E5195E"),
    "r":    ("Ruotsalainen kansanpuolue",           "RKP",  "#FFE08A"),
    "kd":   ("Kristillisdemokraatit",               "KD",   "#1F5BC4"),
    "liik": ("Liike Nyt",                           "LIIK", "#8E5BB5"),
}
TUNTEMATON_VARI = "#8A93A3"

# Hallituspuolue = puolue, jolla on vähintään yksi ministeri.
HALLITUS = {e["party"] for e in EDUSTAJAT if e["minister"]}

PUHEMIESPAIKKA = 0
ENEMMISTORAJA = len(EDUSTAJAT) // 2 + 1


def puolue_tiedot(koodi):
    """Puolueen nimi, lyhenne ja väri. Tuntematon koodi ei kaada sovellusta."""
    nimi, lyhenne, vari = PUOLUEET.get(koodi, (koodi, koodi.upper(), TUNTEMATON_VARI))
    return {
        "koodi": koodi,
        "nimi": nimi,
        "lyhenne": lyhenne,
        "vari": vari,
        "hallitus": koodi in HALLITUS,
    }


@app.get("/")
def etusivu():
    return app.send_static_file("index.html")


@app.get("/api/edustajat")
def edustajat():
    """Kaikki edustajat paikkanumerojärjestyksessä.

    Valinnaiset suodattimet: ?puolue=sd&vaalipiiri=Helsinki&ministeri=1
    """
    tulos = EDUSTAJAT
    if puolue := request.args.get("puolue"):
        tulos = [e for e in tulos if e["party"] == puolue]
    if vaalipiiri := request.args.get("vaalipiiri"):
        tulos = [e for e in tulos if e["constituency"] == vaalipiiri]
    if request.args.get("ministeri") == "1":
        tulos = [e for e in tulos if e["minister"]]
    return jsonify(sorted(tulos, key=lambda e: e["seatNumber"]))


@app.get("/api/edustajat/<int:nro>")
def edustaja(nro):
    """Yksi edustaja personNumberin perusteella, tai 404."""
    for e in EDUSTAJAT:
        if e["personNumber"] == nro:
            return jsonify(e)
    abort(404)


@app.get("/api/puolueet")
def puolueet():
    """Puolueet paikkamäärineen suurimmasta pienimpään."""
    paikat = {}
    for e in EDUSTAJAT:
        paikat[e["party"]] = paikat.get(e["party"], 0) + 1
    tulos = [{**puolue_tiedot(k), "paikat": n} for k, n in paikat.items()]
    tulos.sort(key=lambda p: (-p["paikat"], p["koodi"]))
    return jsonify(tulos)


@app.get("/api/vaalipiirit")
def vaalipiirit():
    """Vaalipiirit aakkosjärjestyksessä (suodatinvalikkoa varten)."""
    return jsonify(sorted({e["constituency"] for e in EDUSTAJAT}))


@app.get("/api/sali")
def sali():
    """Hallitus vs. oppositio ja puhemies."""
    hallitus = sum(1 for e in EDUSTAJAT if e["party"] in HALLITUS)
    puhemies = next((e for e in EDUSTAJAT if e["seatNumber"] == PUHEMIESPAIKKA), None)
    return jsonify({
        "yhteensa": len(EDUSTAJAT),
        "hallitus": hallitus,
        "oppositio": len(EDUSTAJAT) - hallitus,
        "enemmistoraja": ENEMMISTORAJA,
        "hallituspuolueet": [puolue_tiedot(k) for k in sorted(HALLITUS)],
        "puhemies": puhemies,
    })


@app.errorhandler(404)
def ei_loydy(_virhe):
    if request.path.startswith("/api/"):
        return jsonify({"virhe": "Ei löydy"}), 404
    return "Sivua ei löydy", 404


if __name__ == "__main__":
    app.run(debug=True)

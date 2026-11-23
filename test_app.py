"""Rajapinnan testit.  Aja:  python -m unittest -v"""
import unittest

from app import app


class RajapintaTestit(unittest.TestCase):
    def setUp(self):
        self.c = app.test_client()

    def hae(self, polku, status=200):
        r = self.c.get(polku)
        self.assertEqual(r.status_code, status, polku)
        return r.get_json()

    def test_etusivu(self):
        with self.c.get("/") as r:
            self.assertEqual(r.status_code, 200)

    def test_kaikki_edustajat_paikkajarjestyksessa(self):
        d = self.hae("/api/edustajat")
        self.assertEqual(len(d), 200)
        self.assertEqual([e["seatNumber"] for e in d], list(range(200)))

    def test_suodattimet(self):
        self.assertTrue(all(e["party"] == "sd" for e in self.hae("/api/edustajat?puolue=sd")))
        self.assertEqual(len(self.hae("/api/edustajat?ministeri=1")), 19)
        d = self.hae("/api/edustajat?puolue=sd&vaalipiiri=Helsinki")
        self.assertTrue(d)
        self.assertTrue(all(e["party"] == "sd" and e["constituency"] == "Helsinki" for e in d))
        self.assertEqual(self.hae("/api/edustajat?puolue=eiole"), [])

    def test_yksi_edustaja(self):
        self.assertEqual(self.hae("/api/edustajat/1467")["last"], "Huru")
        self.assertIn("virhe", self.hae("/api/edustajat/1", status=404))

    def test_puolueet(self):
        d = self.hae("/api/puolueet")
        self.assertEqual(sum(p["paikat"] for p in d), 200)
        self.assertEqual({p["koodi"] for p in d if p["hallitus"]}, {"sd", "kesk", "vihr", "vas", "r"})
        self.assertEqual(d[0]["koodi"], "sd")  # suurin ensin
        self.assertTrue(all(p["vari"].startswith("#") for p in d))

    def test_vaalipiirit(self):
        d = self.hae("/api/vaalipiirit")
        self.assertEqual(len(d), 13)
        self.assertIn("Ahvenanmaa", d)

    def test_sali(self):
        d = self.hae("/api/sali")
        self.assertEqual(d["hallitus"] + d["oppositio"], 200)
        self.assertEqual(d["enemmistoraja"], 101)
        self.assertEqual(d["puhemies"]["last"], "Vehviläinen")


if __name__ == "__main__":
    unittest.main()

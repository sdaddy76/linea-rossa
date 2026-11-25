#!/usr/bin/env python3
"""Focused regression tests; synthetic workbooks stay in memory, never saved."""
import copy
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

import openpyxl

spec = importlib.util.spec_from_file_location(
    "verify_card_workbook", Path(__file__).with_name("verify-card-workbook.py"))
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


def fixture():
    workbook = openpyxl.Workbook()
    workbook.remove(workbook.active)
    sheets = {
        "Carte base": [
            ["ID", "Nome", "Origine", "Costo OP", "Speciale", "Sblocca speciale",
             *[f"Opz.{i} {field}" for i in range(1, 4)
               for field in ("favorita", "tracciato", "correlazione", "effetto globale")]],
            ["C001", "Carta di prova", "Iran", 3, "No", "Sì",
             *["Iran", "Economia +1", "Europa Consenso −1", "Crisi Bellica +1"] * 3],
        ],
        "Opzioni": [
            ["Carta", "Nome", "Costo OP", "N° opzione", "Fazione favorita", "Tracciato",
             "Variazione", "Correlazione fazione", "Correlazione tracciato",
             "Correlazione variazione", "Effetto globale"],
            *[["C001", "Carta di prova", 3, i, "Iran", "Economia", 1,
               "Europa", "Consenso", -1, "Crisi Bellica +1"] for i in (1, 2, 3)],
        ],
        "BOT": [
            ["ID", "Nome", "Fazione", "Tracciato", "Condizione", "Priorità 1", "Priorità 2"],
            ["BOT-01", "BOT di prova", "Iran", "Economia", "Economia ≤ 5",
             "Acquista unità", "Piazza Influenza"],
        ],
        "Eventi": [
            ["ID", "Nome", "Effetti globali", "Effetti sulle fazioni",
             "Ordine di turno", "Avanzano", "Blocca avanzamento"],
            ["EV-01", "Evento di prova", "Sanzioni −1", "Cina Diplomazia +1",
             "Iran → Coalizione → Russia → Cina → Europa", "Iran · Cina", "No"],
        ],
        "Obiettivi": [
            ["ID", "Fazione", "N°", "Nome", "Condizione", "PV", "Difficoltà"],
            ["OBJ-01", "Iran", 1, "Obiettivo di prova", "Economia ≥ 5", 3,
             '=IF(F2=3,"Facile","Difficile")'],
        ],
        "Unità": [
            ["ID", "Nome", "Fazione", "Costo OP", "Attacco", "Difesa", "Navale", "Effetto"],
            ["U-01", "Unità di prova", "Iran", 2, 1, 2, "No", "Nessun effetto"],
        ],
        "Territori": [
            ["ID", "Nome", "Riquadri",
             *[f"Allineamento {f}" for f in verifier.FACTIONS]],
            ["T-01", "Territorio di prova", 4, 2, 0, 1, 0, 1],
        ],
    }
    for name, rows in sheets.items():
        sheet = workbook.create_sheet(name)
        for row in rows:
            sheet.append(row)
    return workbook


class WorkbookTests(unittest.TestCase):
    def setUp(self):
        self.workbook = fixture()
        expected = dict.fromkeys(
            ("factionCards", "bots", "events", "objectives", "units", "territories"), 1)
        expected["options"] = 3
        self.counts = patch.object(verifier, "EXPECTED", expected)
        self.counts.start()
        self.addCleanup(self.counts.stop)
        self.addCleanup(self.workbook.close)

    def extract(self):
        return verifier.extract(self.workbook)

    def test_full_inventory_and_three_options(self):
        sections = self.extract()
        self.assertEqual(len(sections), 6)
        card = sections["factionCards"][0]
        self.assertEqual(len(card["options"]), 3)
        self.assertTrue(card["unlocksSpecial"])
        self.assertEqual(card["options"][0]["correlation"]["delta"], -1)
        self.assertEqual(sections["events"][0]["advancers"], ["Iran", "Cina"])
        self.assertEqual(sections["territories"][0]["alignment"]["Iran"], 2)
        self.assertFalse(sections["units"][0]["naval"])

    def test_matching_catalog(self):
        sections = self.extract()
        self.assertEqual(verifier.compare(sections, copy.deepcopy(sections)), {})

    def test_preserves_rulebook_fields_absent_in_excel(self):
        sections = self.extract()
        catalog = copy.deepcopy(sections)
        catalog["units"][0]["maxPerTerritory"] = 2
        self.assertEqual(verifier.compare(sections, catalog), {})

    def test_detects_changed_values_and_option(self):
        sections = self.extract()
        catalog = copy.deepcopy(sections)
        catalog["factionCards"][0]["cost"] = 4
        catalog["factionCards"][0]["options"][1]["boost"]["delta"] = 3
        changed = verifier.compare(sections, catalog)["factionCards"]["changed"][0]
        self.assertEqual(changed["id"], "C001")
        self.assertEqual(changed["excel"]["cost"], 3)

    def test_detects_missing_and_extra_ids(self):
        sections = self.extract()
        catalog = copy.deepcopy(sections)
        catalog["events"][0]["id"] = "EV-EXTRA"
        difference = verifier.compare(sections, catalog)["events"]
        self.assertEqual(difference["missing"], ["EV-01"])
        self.assertEqual(difference["extra"], ["EV-EXTRA"])

    def test_rejects_duplicate_catalog_ids(self):
        sections = self.extract()
        catalog = copy.deepcopy(sections)
        catalog["bots"].append(copy.deepcopy(catalog["bots"][0]))
        with self.assertRaisesRegex(ValueError, "ID duplicati nel catalogo"):
            verifier.compare(sections, catalog)

    def test_rejects_duplicate_workbook_ids(self):
        self.workbook["Unità"].append(
            [c.value for c in self.workbook["Unità"][2]])
        with patch.dict(verifier.EXPECTED, {"units": 2}):
            with self.assertRaisesRegex(ValueError, "ID duplicati"):
                self.extract()

    def test_rejects_disagreeing_option(self):
        self.workbook["Opzioni"]["G2"] = 2
        with self.assertRaisesRegex(ValueError, "discordanti"):
            self.extract()

    def test_rejects_duplicate_option(self):
        self.workbook["Opzioni"]["D3"] = 1
        with self.assertRaisesRegex(ValueError, "Opzione duplicata"):
            self.extract()

    def test_rejects_missing_option(self):
        self.workbook["Opzioni"].delete_rows(4)
        with self.assertRaisesRegex(ValueError, "Opzioni mancanti"):
            self.extract()

    def test_rejects_option_without_card(self):
        self.workbook["Opzioni"]["A2"] = "UNKNOWN"
        with self.assertRaisesRegex(ValueError, "Opzione senza carta"):
            self.extract()

    def test_rejects_unknown_effect_and_non_integer_cost(self):
        with self.assertRaisesRegex(ValueError, "non riconosciuto"):
            verifier.changes("Iran Fortuna +1")
        with self.assertRaisesRegex(ValueError, "non riconosciuto"):
            verifier.changes("DEFCON +1", True)
        for value in (1.5, True, "3", None):
            with self.assertRaises(ValueError):
                verifier.integer(value)

    def test_rejects_formula_in_game_data(self):
        self.workbook["Carte base"]["B2"] = "=1+1"
        with self.assertRaisesRegex(ValueError, "Formule non ammesse"):
            self.extract()

    def test_difficulty_formula_is_not_evaluated_or_imported(self):
        self.workbook["Obiettivi"]["G2"] = '=HYPERLINK("https://invalid.example","ignored")'
        objective = self.extract()["objectives"][0]
        self.assertEqual(objective["points"], 3)
        self.assertNotIn("difficulty", objective)

    def test_rejects_wrong_header_missing_sheet_and_blank_id(self):
        self.workbook["BOT"]["A1"] = "Codice"
        with self.assertRaisesRegex(ValueError, "Intestazioni diverse"):
            self.extract()
        self.workbook["BOT"]["A1"] = "ID"
        self.workbook["BOT"]["A2"] = None
        with self.assertRaisesRegex(ValueError, "Riga senza ID"):
            self.extract()
        self.workbook.remove(self.workbook["BOT"])
        with self.assertRaisesRegex(ValueError, "Foglio mancante"):
            self.extract()

    def test_rejects_invalid_event_order_and_flags(self):
        self.workbook["Eventi"]["E2"] = "Iran → Iran → Russia → Cina → Europa"
        with self.assertRaisesRegex(ValueError, "Ordine evento"):
            self.extract()
        with self.assertRaisesRegex(ValueError, "Flag non riconosciuto"):
            verifier.yes("Forse")


if __name__ == "__main__":
    unittest.main()

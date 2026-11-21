#!/usr/bin/env python3
"""Focused catalog tests; no app build, network or dependencies required."""
import copy
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = ROOT.parent / "uploaded_files"
LATEST_PDF = UPLOADS / "Linea_Rossa_Regolamento_illustrato_v3 (11)_7919-dacf60d92f86c3e8.pdf"
PREVIOUS_PDF = UPLOADS / "Linea_Rossa_Regolamento_illustrato_v3 (6)-bd3fbb532c3385aa.pdf"
LATEST_SHA256 = "cf5ba48d604be4690a26f38af8687d6e9784c1b1519febc3fb047a656a620990"
spec = importlib.util.spec_from_file_location("catalog_import", Path(__file__).with_name("import-tabletop-catalog.py"))
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class CatalogTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / "src/game-v3/catalog-data.json").read_text())

    def test_complete_counts_and_decks(self):
        importer.validate(self.data)

    def test_missing_row_fails_closed(self):
        broken = copy.deepcopy(self.data)
        broken["factionCards"].pop()
        with self.assertRaisesRegex(ValueError, "expected 347"):
            importer.validate(broken)

    def test_duplicated_option_fails_closed(self):
        broken = copy.deepcopy(self.data)
        broken["factionCards"][0]["options"][2] = broken["factionCards"][0]["options"][0]
        with self.assertRaisesRegex(ValueError, "Missing or duplicate"):
            importer.validate(broken)

    def test_irgc_and_missile_definitions_and_dummy_exclusion(self):
        units = {u["id"]: u for u in self.data["units"]}
        self.assertEqual((units["IR-U02"]["attack"], units["IR-U02"]["defense"]), (3, 2))
        self.assertEqual(units["IR-U04"]["maxPerTerritory"], 2)
        self.assertEqual(units["EU-U01"]["maxPerTerritory"], 3)
        self.assertEqual(units["IR-U07"]["name"], "Droni Shahed")
        self.assertNotIn("IR-U08", units)
        self.assertNotIn("CO-U07", units)
        self.assertNotIn("ignorano", units["IR-U04"]["effect"])
        self.assertIn("+0", units["CO-U06"]["effect"])
        self.assertEqual(units["RU-U02"]["name"], "Difesa aerea S-400")
        self.assertEqual(self.data["provenance"]["rulebookSha256"],
                         LATEST_SHA256)

    def test_latest_source_hash_page_map_and_complete_roundtrip(self):
        self.assertEqual(hashlib.sha256(LATEST_PDF.read_bytes()).hexdigest(), LATEST_SHA256)
        self.assertEqual(self.data["provenance"]["rulebook"], LATEST_PDF.name)
        self.assertEqual(self.data["provenance"]["rulebookPageCount"], 49)
        self.assertEqual(self.data["provenance"]["pages"], {
            "factionCards": "28–39", "bots": "40–44", "events": "45–46",
            "objectives": "47–49", "correlations": "9–10", "units": "18–19", "initialTracks": "5",
        })
        self.assertEqual(importer.build_catalog(LATEST_PDF), self.data)

    def test_latest_source_changes_are_explicit_and_unchanged_sections_match(self):
        previous = importer.build_catalog(PREVIOUS_PDF)
        for key in ("territories", "correlations", "initialTracks", "bots"):
            with self.subTest(section=key):
                self.assertEqual(self.data[key], previous[key])

        def changed_ids(section):
            current = {row["id"]: row for row in self.data[section]}
            old = {row["id"]: row for row in previous[section]}
            self.assertEqual(set(current), set(old), section)
            return {row_id for row_id in current if current[row_id] != old[row_id]}

        self.assertEqual(changed_ids("factionCards"), {"NI12"})
        self.assertEqual(changed_ids("events"), {
            "E01", "E02", "E05", "E06", "E07", "E08", "E09", "E10", "E11",
            "E12", "E13", "E14", "E15", "E17", "E20", "E21", "E23", "E25",
            "E26", "E30", "E31", "E32", "E36", "E38", "E39", "E40", "E41",
            "E42", "E43", "E44", "E46", "E48", "E49", "E53", "E55", "E61",
            "E62", "E68", "E70",
        })
        self.assertEqual(changed_ids("objectives"), {
            "OBJ-IR-04", "OBJ-IR-05", "OBJ-IR-11", "OBJ-IR-14",
            "OBJ-CO-12", "OBJ-CO-13", "OBJ-RU-11", "OBJ-RU-12", "OBJ-RU-14",
            "OBJ-CN-06", "OBJ-CN-15", "OBJ-EU-12", "OBJ-EU-13",
        })
        self.assertEqual(changed_ids("units"), {"CO-U05", "RU-U01", "RU-U03"})

    def test_bot_influence_territories_remain_source_gap_not_guessed(self):
        self.assertTrue(any("Influence territories for all 120 BOT cards are absent" in gap
                            for gap in self.data["provenance"]["gaps"]))
        for bot in self.data["bots"]:
            self.assertEqual(set(bot), {"id", "name", "faction", "track", "condition", "priority1", "priority2"})

    def test_wrapped_unit_names_and_effects_do_not_include_prose_before_table(self):
        units = {u["id"]: u for u in self.data["units"]}
        self.assertEqual(units["IR-U01"]["name"], "Forze convenzionali")
        self.assertEqual(units["IR-U05"]["name"], "Flotta veloce del Golfo")
        self.assertEqual(units["CO-U04"]["name"], "Carrier Strike Group")
        self.assertEqual(units["RU-U04"]["name"], "Flotta nel Mediterraneo")
        self.assertEqual(units["EU-U02"]["name"], "Missione navale UE")
        self.assertEqual(units["IR-U04"]["effect"],
                         "Solo attacco; max 2 per territorio. Valgono +0 se nel territorio c'è uno Scudo Missilistico.")

    def test_source_verbatim_first_card_and_wrapped_cells(self):
        cards = {c["id"]: c for c in self.data["factionCards"]}
        self.assertEqual(cards["C073C"]["name"], "Veto ONU Cina")
        self.assertEqual(cards["C073C"]["options"], [
            {"boost": {"faction": "Cina", "track": "Diplomazia", "delta": 2},
             "correlation": {"faction": "Europa", "track": "Diplomazia", "delta": 1}, "globals": []},
            {"boost": {"faction": "Iran", "track": "Diplomazia", "delta": 2},
             "correlation": {"faction": "Russia", "track": "Diplomazia", "delta": 1}, "globals": []},
            {"boost": {"faction": "Europa", "track": "Diplomazia", "delta": 2},
             "correlation": {"faction": "Iran", "track": "Diplomazia", "delta": 1}, "globals": []},
        ])
        self.assertEqual(cards["C088C"]["options"][0]["globals"], [{"track": "Crisi Bellica", "delta": 1}])
        self.assertEqual(cards["NN25"]["options"][1]["globals"], [{"track": "Nucleare", "delta": 1}])
        self.assertEqual(cards["NN25"]["options"][2]["globals"], [{"track": "Nucleare", "delta": -1}])

    def test_events_new_effects_legacy_order_only(self):
        events = {e["id"]: e for e in self.data["events"]}
        self.assertEqual(events["E01"]["order"], ["Europa", "Iran", "Cina", "Coalizione", "Russia"])
        self.assertEqual(events["E01"]["advancers"], ["Cina"])
        self.assertIn({"track": "Opinione", "delta": 1}, events["E01"]["globals"])
        self.assertEqual([e["id"] for e in self.data["events"] if e["blocksRound"]], ["E71", "E74"])
        self.assertEqual(events["E75"]["changes"], [{"faction": "Iran", "track": "Consenso", "delta": 3}])

    def test_all_event_turns_use_the_source_verified_snapshot(self):
        turns = importer.verified_turn_metadata()
        self.assertEqual(sorted(turns), [f"E{n:02}" for n in range(1, 76)])
        for event in self.data["events"]:
            self.assertEqual([event["order"], event["advancers"]], turns[event["id"]])
        self.assertEqual(self.data["provenance"]["eventTurnVerifiedIds"], sorted(turns))

    def test_specials_unlock_provenance_and_initial_values(self):
        cards = self.data["factionCards"]
        self.assertEqual(sum(c["special"] for c in cards), 15)
        self.assertTrue(next(c for c in cards if c["id"] == "C032")["unlocksSpecial"])
        self.assertEqual(self.data["provenance"]["unmatchedLegacyUnlockIds"], [])
        self.assertEqual(self.data["provenance"]["sourceVerifiedUnlockIds"], ["C004", "C006", "C015"])
        self.assertEqual(self.data["provenance"]["legacyOnlyUnlockIds"], ["C032", "C045", "NI34"])
        self.assertEqual(self.data["initialTracks"]["Iran"],
                         {"Economia": 4, "Militare": 7, "Diplomazia": 4, "Consenso": 5})

    def test_last_objective_and_correlations(self):
        obj = self.data["objectives"][-1]
        self.assertEqual((obj["faction"], obj["number"], obj["points"]), ("Europa", 15, 3))
        self.assertEqual(obj["condition"], "Termina con il Consenso di Europa e Coalizione entrambi a 6 o più.")
        self.assertEqual(self.data["correlations"]["Cina"]["Consenso"], [
            {"faction": "Europa", "track": "Economia", "delta": 1},
            {"faction": "Coalizione", "track": "Economia", "delta": 1},
        ])


if __name__ == "__main__":
    unittest.main()

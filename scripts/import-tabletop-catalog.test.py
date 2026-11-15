#!/usr/bin/env python3
"""Focused catalog tests; no app build, network or dependencies required."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
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
                         "5c20f82d2616d1562b2b00b733fa57020fd27122cf93aad6b84dfc826e35ec4d")

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

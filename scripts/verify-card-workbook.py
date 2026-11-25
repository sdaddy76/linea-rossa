#!/usr/bin/env python3
"""Read-only, fail-closed comparison of the supplied XLSX with the live catalog.

Probe an unknown workbook with the Skywork Excel safety helper before using
this script. No eval, formula execution, mutation of uploads, or guessed option
is permitted. The expanded Opzioni sheet must agree with Carte base.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
FACTIONS = ("Iran", "Coalizione", "Russia", "Cina", "Europa")
TRACKS = ("Economia", "Militare", "Diplomazia", "Consenso")
GLOBALS = ("Nucleare", "Sanzioni", "Crisi Bellica", "Opinione")
EXPECTED = {"factionCards": 347, "options": 1041, "bots": 120, "events": 75,
            "objectives": 75, "units": 31, "territories": 16}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(value):
    require(isinstance(value, str), f"Testo mancante/non valido: {value!r}")
    require(not value.startswith("="), "Formule non ammesse nei dati di gioco")
    return " ".join(value.split())


def integer(value):
    require(isinstance(value, (int, float)) and not isinstance(value, bool)
            and int(value) == value, f"Intero richiesto: {value!r}")
    return int(value)


def yes(value):
    require(value in ("Sì", "No"), f"Flag non riconosciuto: {value!r}")
    return value == "Sì"


def changes(value, global_only=False):
    if value is None or value == "—":
        return []
    result = []
    for piece in text(value).replace("−", "-").split(" · "):
        if global_only:
            match = re.fullmatch(r"(Nucleare|Sanzioni|Crisi Bellica|Opinione) ([+-]\d+)", piece)
            require(match, f"Effetto globale non riconosciuto: {piece!r}")
            result.append({"track": match[1], "delta": int(match[2])})
        else:
            match = re.fullmatch(r"(Iran|Coalizione|Russia|Cina|Europa) (Economia|Militare|Diplomazia|Consenso) ([+-]\d+)", piece)
            require(match, f"Effetto fazione non riconosciuto: {piece!r}")
            result.append({"faction": match[1], "track": match[2], "delta": int(match[3])})
    return result


def one_change(value):
    rows = changes(value)
    require(len(rows) == 1, f"Richiesto un effetto esplicito: {value!r}")
    return rows[0]


def sheet_rows(workbook, title, headers):
    require(title in workbook.sheetnames, f"Foglio mancante: {title}")
    sheet = workbook[title]
    require(tuple(c.value for c in sheet[1]) == headers, f"Intestazioni diverse: {title}")
    rows = list(sheet.iter_rows(min_row=2, values_only=True))
    require(all(r[0] for r in rows), f"Riga senza ID in {title}")
    return rows


def extract(workbook):
    base = sheet_rows(workbook, "Carte base", (
        "ID", "Nome", "Origine", "Costo OP", "Speciale", "Sblocca speciale",
        *[f"Opz.{i} {field}" for i in range(1, 4)
          for field in ("favorita", "tracciato", "correlazione", "effetto globale")]))
    cards = []
    for r in base:
        require(r[2] in (*FACTIONS, "Neutrale"), f"Origine non valida: {r[0]}")
        options = []
        for start in (6, 10, 14):
            options.append({"boost": one_change(f"{r[start]} {r[start+1]}"),
                            "correlation": one_change(r[start+2]),
                            "globals": changes(r[start+3], True)})
        cards.append({"id": text(r[0]), "name": text(r[1]), "origin": r[2],
                      "cost": integer(r[3]), "special": yes(r[4]),
                      "unlocksSpecial": yes(r[5]), "options": options})
    expanded = sheet_rows(workbook, "Opzioni", (
        "Carta", "Nome", "Costo OP", "N° opzione", "Fazione favorita", "Tracciato",
        "Variazione", "Correlazione fazione", "Correlazione tracciato",
        "Correlazione variazione", "Effetto globale"))
    by_id = {c["id"]: c for c in cards}
    seen = set()
    for r in expanded:
        cid, number = text(r[0]), integer(r[3])
        require(cid in by_id and number in (1, 2, 3), f"Opzione senza carta: {cid}/{number}")
        require((cid, number) not in seen, f"Opzione duplicata: {cid}/{number}")
        seen.add((cid, number))
        c = by_id[cid]
        o = {"boost": {"faction": r[4], "track": r[5], "delta": integer(r[6])},
             "correlation": {"faction": r[7], "track": r[8], "delta": integer(r[9])},
             "globals": changes(r[10], True)}
        require(c["name"] == text(r[1]) and c["cost"] == integer(r[2])
                and c["options"][number-1] == o, f"Opzioni e Carte base discordanti: {cid}/{number}")
    require(len(seen) == len(cards)*3, "Opzioni mancanti")
    bots = [{"id": text(r[0]), "name": text(r[1]), "faction": text(r[2]),
             "track": text(r[3]), "condition": text(r[4]),
             "priority1": text(r[5]), "priority2": text(r[6])}
            for r in sheet_rows(workbook, "BOT", (
                "ID", "Nome", "Fazione", "Tracciato", "Condizione", "Priorità 1", "Priorità 2"))]
    events = []
    for r in sheet_rows(workbook, "Eventi", (
            "ID", "Nome", "Effetti globali", "Effetti sulle fazioni",
            "Ordine di turno", "Avanzano", "Blocca avanzamento")):
        order = text(r[4]).split(" → ")
        advancers = re.split(r"\s*(?:→|·|,)\s*", text(r[5]))
        require(len(order) == 5 and set(order) == set(FACTIONS), f"Ordine evento: {r[0]}")
        require(all(f in FACTIONS for f in advancers), f"Avanzano: {r[0]} {advancers}")
        events.append({"id": text(r[0]), "name": text(r[1]), "globals": changes(r[2], True),
                       "changes": changes(r[3]), "order": order, "advancers": advancers,
                       "blocksRound": yes(r[6])})
    objectives = [{"id": text(r[0]), "faction": text(r[1]), "number": integer(r[2]),
                   "name": text(r[3]), "condition": text(r[4]), "points": integer(r[5])}
                  for r in sheet_rows(workbook, "Obiettivi", (
                      "ID", "Fazione", "N°", "Nome", "Condizione", "PV", "Difficoltà"))]
    # Difficoltà is a display-only formula, not executed or imported as a rule.
    units = [{"id": text(r[0]), "name": text(r[1]), "faction": text(r[2]),
              "cost": integer(r[3]), "attack": integer(r[4]), "defense": integer(r[5]),
              "naval": yes(r[6]), "effect": text(r[7])}
             for r in sheet_rows(workbook, "Unità", (
                 "ID", "Nome", "Fazione", "Costo OP", "Attacco", "Difesa", "Navale", "Effetto"))]
    territories = [{"id": text(r[0]), "name": text(r[1]), "capacity": integer(r[2]),
                    "alignment": {f: integer(r[i+3]) for i, f in enumerate(FACTIONS)}}
                   for r in sheet_rows(workbook, "Territori", (
                       "ID", "Nome", "Riquadri", *[f"Allineamento {f}" for f in FACTIONS]))]
    sections = {"factionCards": cards, "bots": bots, "events": events,
                "objectives": objectives, "units": units, "territories": territories}
    for section, rows in sections.items():
        require(len(rows) == EXPECTED[section], f"Conteggio {section}: {len(rows)}")
        require(len({r["id"] for r in rows}) == len(rows), f"ID duplicati: {section}")
    return sections


def compare(sections, catalog):
    differences = {}
    for section, rows in sections.items():
        current = {r["id"]: r for r in catalog[section]}
        require(len(current) == len(catalog[section]), f"ID duplicati nel catalogo: {section}")
        ids = {r["id"] for r in rows}
        missing = sorted(ids - current.keys())
        extra = sorted(current.keys() - ids)
        changed = []
        for row in rows:
            if row["id"] in current:
                # Fields absent from the workbook (e.g. maxPerTerritory) remain
                # governed by their existing rulebook provenance.
                before = {k: current[row["id"]].get(k) for k in row}
                if before != row:
                    changed.append({"id": row["id"], "before": before, "excel": row})
        if missing or extra or changed:
            differences[section] = {"missing": missing, "extra": extra, "changed": changed}
    return differences


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--catalog", type=Path, default=ROOT / "src/game-v3/catalog-data.json")
    args = parser.parse_args()
    workbook = openpyxl.load_workbook(args.source, data_only=False)
    try:
        sections = extract(workbook)
        catalog = json.loads(args.catalog.read_text())
        differences = compare(sections, catalog)
        print(json.dumps({"source": args.source.name,
                          "sha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
                          "counts": EXPECTED, "matches": not differences,
                          "differences": differences}, ensure_ascii=False, indent=2))
        if differences:
            raise SystemExit(1)
    finally:
        workbook.close()


if __name__ == "__main__":
    main()

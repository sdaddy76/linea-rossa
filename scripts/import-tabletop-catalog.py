#!/usr/bin/env python3
"""Bounded, fail-closed import from the supplied 46/47/48-page tabletop rulebooks.

Requires only Python's stdlib and Poppler pdftotext. No OCR or generated card
formula is used: PDF word coordinates preserve each printed table cell.
Run from the project root: python3 scripts/import-tabletop-catalog.py --pdf FILE
The board transcription is visual, in Iran/Coalizione/Russia/Cina/Europa order.
Source-verified event turn metadata and legacy unlock flags have separate provenance.
"""
import argparse
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

FACTIONS = ["Iran", "Coalizione", "Russia", "Cina", "Europa"]
TRACKS = ["Economia", "Militare", "Diplomazia", "Consenso"]
CODES = dict(zip(FACTIONS, ["IR", "CO", "RU", "CN", "EU"]))
ABBR = dict(zip(["Eco", "Mil", "Dip", "Cons"], TRACKS))
NS = "{http://www.w3.org/1999/xhtml}"
CARD_ID = re.compile(r"(?:C\d{3}[A-Z]?\d?|N[ICRENT]\d{2}|S[EC]_[A-Z]+\d{2})$")

# Independently checked against ALL 75 original supplied event fronts. Each row:
# ID: five order icons / printed Avanzano names (not inferred from icon order).
# These explicit source values deliberately do not depend on legacy eventi.ts.
VERIFIED_EVENT_TURNS = [
    "E01:EU IR CN CO RU/CN",
    "E02:RU EU IR CN CO/CN",
    "E03:CN CO RU EU IR/RU EU",
    "E04:IR CN CO RU EU/IR RU",
    "E05:CO RU EU IR CN/RU",
    "E06:CO RU IR EU CN/CO CN",
    "E07:RU IR EU CN CO/EU",
    "E08:IR EU CN CO RU/EU",
    "E09:EU CN CO RU IR/EU",
    "E10:CN CO RU IR EU/IR CN",
    "E11:RU IR CO EU CN/IR",
    "E12:CN RU IR CO EU/IR CO",
    "E13:EU CN RU IR CO/EU",
    "E14:IR CO EU CN RU/CO",
    "E15:CO EU CN RU IR/RU",
    "E16:EU CO CN IR RU/IR",
    "E17:CO CN IR RU EU/IR",
    "E18:CN IR RU EU CO/RU",
    "E19:IR RU EU CO CN/RU",
    "E20:RU EU CO CN IR/CN EU",
    "E21:CO EU CN IR RU/IR",
    "E22:IR RU CO EU CN/CO",
    "E23:CN IR RU CO EU/RU",
    "E24:EU CN IR RU CO/CN",
    "E25:RU CO EU CN IR/IR RU",
    "E26:IR RU EU CN CO/RU",
    "E27:RU EU CN CO IR/IR",
    "E28:CO IR RU EU CN/CO",
    "E29:CN CO IR RU EU/RU",
    "E30:EU CN CO IR RU/EU",
    "E31:RU EU IR CO CN/CN",
    "E32:IR CO CN RU EU/CO",
    "E33:CN RU EU IR CO/RU CN",
    "E34:CO CN RU EU IR/IR CN",
    "E35:EU IR CO CN RU/IR",
    "E36:CO IR RU EU CN/CO RU",
    "E37:CN CO IR RU EU/CN",
    "E38:IR RU EU CN CO/RU",
    "E39:RU EU CN CO IR/CO CN",
    "E40:EU CN CO IR RU/RU EU",
    "E41:EU CO IR RU CN/CN",
    "E42:RU CN EU CO IR/CO EU",
    "E43:CN EU CO IR RU/CN EU",
    "E44:CO IR RU CN EU/RU",
    "E45:IR RU CN EU CO/IR",
    "E46:CN EU RU CO IR/CO",
    "E47:RU CO IR CN EU/CN",
    "E48:IR CN EU RU CO/IR CO",
    "E49:CO IR CN EU RU/IR CO",
    "E50:EU RU CO IR CN/CO",
    "E51:RU CO EU IR CN/EU",
    "E52:CO EU IR CN RU/IR",
    "E53:EU IR CN RU CO/CN EU",
    "E54:CN RU CO EU IR/CO",
    "E55:IR CN RU CO EU/RU CN",
    "E56:RU CN CO EU IR/CO RU",
    "E57:EU IR RU CN CO/CO",
    "E58:CO EU IR RU CN/CO EU",
    "E59:IR RU CN CO EU/CO CN",
    "E60:CN CO EU IR RU/EU",
    "E61:RU CO IR EU CN/IR",
    "E62:EU CN RU CO IR/RU",
    "E63:IR EU CN RU CO/CO",
    "E64:CN RU CO IR EU/IR RU",
    "E65:CO IR EU CN RU/CN",
    "E66:EU IR CO RU CN/IR EU",
    "E67:CN EU IR CO RU/EU",
    "E68:IR CO RU CN EU/CN",
    "E69:CO RU CN EU IR/CO",
    "E70:RU CN EU IR CO/IR",
    "E71:IR CO RU CN EU/CN",
    "E72:CO RU CN EU IR/IR EU",
    "E73:CN EU IR CO RU/RU EU",
    "E74:EU IR CO RU CN/EU",
    "E75:RU CN EU IR CO/EU",
]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def words(page):
    return [
        {"x": float(w.attrib["xMin"]), "y": float(w.attrib["yMin"]), "s": w.text or ""}
        for w in page.iter(f"{NS}word")
    ]


def text(ws):
    # The triangle is printed 2.3pt lower than its surrounding words.
    lines = []
    for w in sorted(ws, key=lambda a: (a["y"], a["x"])):
        if not lines or w["y"] - lines[-1][0] > 3.5:
            lines.append((w["y"], []))
        lines[-1][1].append(w)
    return " ".join(" ".join(w["s"] for w in sorted(line, key=lambda a: a["x"]))
                    for _, line in lines)


def cells(ws, starts, y, end):
    band = [w for w in ws if y - .5 <= w["y"] < end - .5]
    return [text([w for w in band if left - .5 <= w["x"] < right - .5])
            for left, right in zip(starts, starts[1:] + [1000])]


def change(value):
    m = re.fullmatch(r"(Iran|Coalizione|Russia|Cina|Europa) (Eco|Mil|Dip|Cons|Economia|Militare|Diplomazia|Consenso) ([+−-]\d+)", value)
    require(m, f"Unparsed faction change: {value!r}")
    return {"faction": m[1], "track": ABBR.get(m[2], m[2]), "delta": int(m[3].replace("−", "-"))}


def global_change(value):
    m = re.fullmatch(r"(Nuc|Sanz|Opin|Nucleare|Sanzioni|Opinione|Crisi Bellica) ([+−-]\d+)", value)
    require(m, f"Unparsed global change: {value!r}")
    return {"track": {"Nuc": "Nucleare", "Sanz": "Sanzioni", "Opin": "Opinione"}.get(m[1], m[1]),
            "delta": int(m[2].replace("−", "-"))}


def option(value):
    parts = value.split(" · ")
    pair = parts.pop(0).split(" ▸ ")
    require(len(pair) == 2, f"Missing option arrow: {value}")
    return {"boost": change(pair[0]), "correlation": change(pair[1]),
            "globals": [global_change(p) for p in parts]}


def faction_cards(pages, unlocks, numbers):
    result = []
    for number in numbers:
        ws = words(pages[number - 1])
        ids = sorted([w for w in ws if w["x"] < 90 and CARD_ID.fullmatch(w["s"])], key=lambda w: w["y"])
        require(ids, f"No faction cards on page {number}")
        first = ids[0]
        line = sorted([w for w in ws if abs(w["y"] - first["y"]) < 3.5], key=lambda w: w["x"])
        costs = [i for i, w in enumerate(line) if re.fullmatch("[1-4]", w["s"])]
        require(costs, f"No OP column on page {number}: {text(line)}")
        ci = costs[0]
        origin_x = line[ci - 1]["x"]
        option_starts = [w["x"] for i, w in enumerate(line[:-3])
                         if w["s"] in FACTIONS and line[i + 1]["s"] in ABBR
                         and re.fullmatch(r"\+\d+", line[i + 2]["s"])
                         and line[i + 3]["s"] == "▸"]
        require(len(option_starts) == 3, f"Option columns page {number}: {option_starts}")
        starts = [first["x"], line[1]["x"], origin_x, line[ci]["x"], *option_starts]
        for i, row in enumerate(ids):
            end = ids[i + 1]["y"] if i + 1 < len(ids) else 795
            c = cells(ws, starts, row["y"], end)
            require(c[0] == row["s"] and c[2] in FACTIONS + ["Neutrale"], f"Bad row p{number}: {c}")
            result.append({"id": c[0], "name": c[1], "origin": c[2], "cost": int(c[3]),
                           "options": [option(v) for v in c[4:]],
                           "special": c[0].startswith(("SE_", "SC_")),
                           "unlocksSpecial": c[0] in unlocks})
    return result


def bots(pages, numbers):
    result = []
    for number in numbers:
        ws = words(pages[number - 1])
        ids = sorted([w for w in ws if w["x"] < 80 and w["s"].startswith("BOT-")], key=lambda w: w["y"])
        # Column starts are the first word in each first-row cell. They vary by page.
        # Repeated row starts identify name, condition and both priorities reliably.
        # Explicit source coordinates avoid matching words within wrapped prose.
        starts = BOT_COLUMNS
        for i, row in enumerate(ids):
            c = cells(ws, starts, row["y"], ids[i + 1]["y"] if i + 1 < len(ids) else 795)
            cid = c[0].replace(" ", "")
            m = re.fullmatch(r"BOT-(IR|CO|RU|CN|EU)-([EMDC])([1-6])", cid)
            require(m and all(c), f"Bad BOT row p{number}: {c}")
            result.append({"id": cid, "name": c[1], "faction": dict(zip(CODES.values(), FACTIONS))[m[1]],
                           "track": dict(zip("EMDC", TRACKS))[m[2]], "condition": c[2],
                           "priority1": c[3], "priority2": c[4]})
    return result


def events(pages, turns, numbers):
    result = []
    for number in numbers:
        ws = words(pages[number - 1])
        rows = sorted([w for w in ws if w["x"] < 70 and re.fullmatch(r"E\d{2}", w["s"])], key=lambda w: w["y"])
        first = rows[0]
        same = sorted([w for w in ws if abs(w["y"] - first["y"]) < .5], key=lambda w: w["x"])
        effect_x = next(w["x"] for w in same if w["s"] in ["Nucleare", "Sanzioni", "Crisi", "Opinione", "Iran", "Coalizione"] and w["x"] > 180)
        starts = [first["x"], same[1]["x"], effect_x]
        for i, row in enumerate(rows):
            c = cells(ws, starts, row["y"], rows[i + 1]["y"] if i + 1 < len(rows) else 795)
            gl, changes, blocked = [], [], False
            for effect in c[2].split(" · "):
                if effect == "Blocca avanzamento":
                    blocked = True
                elif effect.split(" ")[0] in FACTIONS:
                    changes.append(change(effect))
                else:
                    gl.append(global_change(effect))
            order, advancers = turns[c[0]]
            result.append({"id": c[0], "name": c[1], "globals": gl, "changes": changes,
                           "order": order, "advancers": advancers, "blocksRound": blocked})
    return result


def objectives(pages, numbers):
    result = []
    for number in numbers:
        ws = words(pages[number - 1])
        rows = sorted([w for w in ws if w["x"] < 80 and w["s"] in FACTIONS], key=lambda w: w["y"])
        starts = OBJECTIVE_COLUMNS
        for i, row in enumerate(rows):
            c = cells(ws, starts, row["y"], rows[i + 1]["y"] if i + 1 < len(rows) else 795)
            m = re.fullmatch(r"(?:Facile|Media|Difficile) · \+([346])", c[4])
            require(m and re.fullmatch(r"\d{2}", c[1]) and all(c), f"Bad objective p{number}: {c}")
            result.append({"id": f"OBJ-{CODES[c[0]]}-{c[1]}", "faction": c[0], "number": int(c[1]),
                           "name": c[2], "condition": c[3], "points": int(m[1])})
    return result


def correlations(pdf):
    result = {f: {t: [] for t in TRACKS} for f in FACTIONS}
    pattern = r"^(Iran|Coalizione|Russia|Cina|Europa)\s+(Economia|Militare|Diplomazia|Consenso)\s+(Iran|Coalizione|Russia|Cina|Europa)\s+(Economia|Militare|Diplomazia|Consenso)\s+([+−-]\d+)\s+"
    for number in [9, 10]:
        raw = subprocess.check_output(["pdftotext", "-f", str(number), "-l", str(number), "-layout", str(pdf), "-"], text=True)
        for line in raw.splitlines():
            m = re.match(pattern, line.strip())
            if m:
                result[m[1]][m[2]].append(change(f"{m[3]} {m[4]} {m[5]}"))
    require(all(len(result[f][t]) == 2 for f in FACTIONS for t in TRACKS), "Not exactly 40 correlations")
    return result


def units(pages):
    result = []
    # Reflowed editions shift the Effect column. Read its actual
    # header rather than allowing the first effect word into the Defense cell.
    header_pages = [
        page for page in pages
        if all(any(w["s"] == label for w in words(page))
               for label in ("Fazione", "Unità", "Attacco", "Difesa", "Effetto"))
    ]
    require(header_pages, "Unit Effect column header not found")
    headers = [w for w in words(header_pages[0]) if w["s"] == "Effetto" and 300 < w["x"] < 380]
    require(len(headers) == 1, "Unit Effect column header not uniquely identified")
    effect_x = headers[0]["x"]
    first_page = pages.index(header_pages[0]) + 1
    for number in [first_page, first_page + 1]:
        ws = words(pages[number - 1])
        # The latest p17 also has Iran in preceding Influence/control prose.
        # Only faction cells below the actual table header start unit rows.
        table_top = headers[0]["y"] if number == 17 else 0
        rows = sorted([w for w in ws if w["x"] < 80 and w["s"] in FACTIONS and w["y"] > table_top], key=lambda w: w["y"])
        for i, row in enumerate(rows):
            starts = [*UNIT_COLUMNS[:-1], effect_x]
            c = cells(ws, starts, row["y"], rows[i + 1]["y"] if i + 1 < len(rows) else 795)
            require(len(c) == 6 and all(c), f"Bad unit p{number}: {c}")
            f = c[0]
            c[1] = re.sub(r"S-\s+400", "S-400", c[1])
            n = 1 + sum(u["faction"] == f for u in result)
            effect = c[5]
            require(not (f == "Iran" and c[1] == "Missili balistici" and "ignorano" in effect),
                    "Outdated contradictory missile rule: use the latest corrected rulebook")
            u = {"id": f"{CODES[f]}-U{n:02}", "name": c[1], "faction": f, "cost": int(c[2]),
                 "attack": int(c[3]), "defense": int(c[4]), "naval": "Solo navale" in effect, "effect": effect}
            limit = re.search(r"max (\d+) per territorio", effect)
            if limit:
                u["maxPerTerritory"] = int(limit[1])
            result.append(u)
    return result


def verified_turn_metadata():
    lookup = {code: f for f, code in CODES.items()}
    result = {}
    for row in VERIFIED_EVENT_TURNS:
        eid, value = row.split(":")
        result[eid] = [[lookup[code] for code in part.split()] for part in value.split("/")]
    require(len(result) == 75, "Incomplete source-verified event turn metadata")
    return result


def legacy_unlocks(root):
    decks = (root / "src/data/mazzi.ts").read_text()
    unlocks = set()
    for m in re.finditer(r"card_id:\s*'([^']+)'(.*?)(?=card_id:|\Z)", decks, re.S):
        if re.search(r"unlocks_special:\s*true", m[2]):
            unlocks.add(m[1])
    return unlocks


def validate(data):
    for key, count in [("factionCards", 347), ("bots", 120), ("events", 75), ("objectives", 75), ("units", 31), ("territories", 16)]:
        rows = data[key]
        require(len(rows) == count, f"{key}: expected {count}, got {len(rows)}")
        require(len({r["id"] for r in rows}) == count, f"{key}: duplicate IDs")
    require(sum(c["special"] for c in data["factionCards"]) == 15, "Expected 15 specials")
    require(all(len(c["options"]) == 3 and len({o["boost"]["faction"] for o in c["options"]}) == 3
                for c in data["factionCards"]), "Missing or duplicate favored faction options")
    require(all(sorted(e["order"]) == sorted(FACTIONS) and 1 <= len(e["advancers"]) <= 2
                and all(f in FACTIONS for f in e["advancers"]) for e in data["events"]), "Invalid event turn metadata")
    require(all(sum(1 for b in data["bots"] if b["faction"] == f and b["track"] == t) == 6
                for f in FACTIONS for t in TRACKS), "Incomplete BOT decks")
    require(all(sorted(o["number"] for o in data["objectives"] if o["faction"] == f) == list(range(1, 16))
                for f in FACTIONS), "Incomplete objective deck")
    require(all(sum(data["initialTracks"][f].values()) == 20 for f in FACTIONS), "Invalid initial tracks")
    require(all(set(t["alignment"]) == set(FACTIONS) and all(v in [0, 1, 2] for v in t["alignment"].values())
                for t in data["territories"]), "Invalid board alignments")


# Source x-coordinates are audited below, then fixed for reproducible extraction.
BOT_COLUMNS = [48.96, 85.38, 163.25, 295.03, 446.67]
# In the current 48-page edition the condition column starts at x≈242.1
# (the previous editions used a slightly wider gap). Keep the boundary just
# before that first word so the objective title is not polluted by "Termina",
# "Hai" or "Controlli".
OBJECTIVE_COLUMNS = [53.5, 107.67, 124.91, 240.0, 507.63]
UNIT_COLUMNS = [55.2, 112.77, 210, 250, 295, 339.55]

# Board circles: friendly 0, neutral 1, hostile 2; visually transcribed from the
# exact supplied corrected board. The order is explicitly FACTIONS above.
BOARD = [
    ("turchia", "Turchia", 4, [1, 0, 2, 1, 0]),
    ("siria", "Siria", 4, [0, 2, 0, 1, 2]),
    ("libano", "Libano", 4, [0, 2, 1, 1, 0]),
    ("iran", "Iran", 6, [0, 2, 0, 0, 2]),
    ("iraq", "Iraq", 3, [0, 1, 0, 0, 1]),
    ("israele", "Israele", 6, [2, 0, 2, 2, 0]),
    ("giordania", "Giordania", 2, [1, 0, 1, 1, 0]),
    ("egitto", "Egitto", 4, [1, 0, 1, 1, 0]),
    ("arabia-saudita", "Arabia Saudita", 4, [2, 0, 1, 0, 1]),
    ("kuwait", "Kuwait", 2, [2, 0, 1, 1, 1]),
    ("bahrein", "Bahrein", 2, [2, 0, 1, 1, 1]),
    ("qatar", "Qatar", 2, [2, 0, 1, 0, 1]),
    ("emirati", "Emirati", 2, [2, 0, 1, 0, 1]),
    ("oman", "Oman", 2, [0, 0, 1, 0, 0]),
    ("yemen", "Yemen", 4, [0, 2, 1, 1, 2]),
    ("hormuz", "Stretto di Hormuz", 2, [1, 0, 0, 0, 0]),
]


def read_pdf(pdf):
    xml = subprocess.check_output(["pdftotext", "-bbox-layout", str(pdf), "-"])
    pages = ET.fromstring(xml).findall(f".//{NS}page")
    require(len(pages) in (46, 47, 48), f"Expected 46, 47 or 48 pages, got {len(pages)}")
    return pages


def source_pages(pages):
    # The 47-page edition adds a BOT-rule continuation at p23. The 48-page
    # edition adds one more illustrated rule page before the appendices.
    # Correlations, units and preparation remain at their printed positions.
    offset = len(pages) - 46
    result = {
        "factionCards": list(range(25 + offset, 37 + offset)),
        "bots": list(range(37 + offset, 42 + offset)),
        "events": [42 + offset, 43 + offset],
        "objectives": [44 + offset, 45 + offset, 46 + offset],
        "correlations": [9, 10], "units": [17, 18], "initialTracks": [5],
    }
    for key, letter in [("factionCards", "A"), ("bots", "B"), ("events", "C"), ("objectives", "D")]:
        number = result[key][0]
        header = text([w for w in words(pages[number - 1]) if w["y"] < 100])
        require(f"APPENDICE{letter}" in re.sub(r"\s+", "", header),
                f"Missing Appendix {letter} header on page {number}")
    return result


def build_catalog(pdf, root=None, pages=None):
    pdf = Path(pdf)
    root = Path(root) if root is not None else Path(__file__).resolve().parents[1]
    pages = read_pdf(pdf) if pages is None else pages
    numbers = source_pages(pages)
    page_labels = {key: str(value[0]) if len(value) == 1 else f"{value[0]}–{value[-1]}"
                   for key, value in numbers.items()}
    turns, unlocks = verified_turn_metadata(), legacy_unlocks(root)
    cards = faction_cards(pages, unlocks, numbers["factionCards"])
    initial = dict(zip(FACTIONS, [dict(zip(TRACKS, values)) for values in [(4, 7, 4, 5), (5, 7, 4, 4), (6, 6, 4, 4), (7, 4, 5, 4), (6, 4, 6, 4)]]))
    data = {
        "provenance": {
            "rulebook": pdf.name, "rulebookSha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
            "rulebookPageCount": len(pages), "pages": page_labels,
            "extraction": "pdftotext -bbox-layout; printed cells verbatim, whitespace normalized",
            "eventTurns": "All 75 supplied Mazzo_Eventi/fronti original images, order icons AND printed Avanzano names visually verified; explicit source table VERIFIED_EVENT_TURNS in importer, independent of legacy eventi.ts.",
            "eventTurnVerifiedIds": [f"E{n:02}" for n in range(1, 76)],
            "eventTurnSource": "LineaRossa_Mazzo_Eventi-f05d663e27bdf92e.zip",
            "eventTurnVerification": "375 order positions and all 75 Avanzano fields checked on diagnostic contact sheets; no discrepancies with legacy values.",
            "unlockFlags": "src/data/mazzi.ts unlocks_special matched by exact ID; appendix A omits these flags",
            "unlockRule": "Rulebook p13: draw one special only if the printed card has Sblocca carta speciale.",
            "sourceVerifiedUnlockIds": ["C004", "C006", "C015"],
            "unlockGraphicAudit": "All 78 supplied ZIP faction fronts checked by OCR AND visually at the fixed unlock-banner region; only C004/C006/C015 have a banner. These three complete fronts also visually verified.",
            "legacyOnlyUnlockIds": ["C032", "C045", "NI34"],
            "unmatchedLegacyUnlockIds": sorted(unlocks - {c["id"] for c in cards}),
            "board": "Linea_Rossa_Tabellone_corretto (2)-911f6aba85683265.jpg; visual transcription",
            "rulings": ["Corrected rulebook p17/p19: one defending Scudo Missilistico cancels all attacking Missili balistici bonuses. No override of the latest PDF is required."],
            "gaps": [
                "Unlock flags C032/C045/NI34 are inherited by exact ID, not independently graphic-verified: corresponding original fronts are absent from the supplied faction ZIPs. Appendix A does not list unlock flags. No additional flags are invented.",
                *([
                    "Rulebook p22 specifies an Influence-at-end-of-round State printed in each BOT card header, but Appendix B supplies only ID, title, condition P1, priority 1 and priority 2. Influence territories for all 120 BOT cards are absent from this source and are not inferred from deployment priorities."
                ] if len(pages) >= 47 else []),
            ],
        },
        "factionCards": cards, "bots": bots(pages, numbers["bots"]), "events": events(pages, turns, numbers["events"]),
        "objectives": objectives(pages, numbers["objectives"]), "units": units(pages),
        "territories": [{"id": tid, "name": name, "capacity": capacity, "alignment": dict(zip(FACTIONS, values))} for tid, name, capacity, values in BOARD],
        "correlations": correlations(pdf), "initialTracks": initial,
    }
    validate(data)
    return data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=Path("src/game-v3/catalog-data.json"))
    parser.add_argument("--inspect", action="store_true", help="Print first row word coordinates, do not write")
    parser.add_argument("--check", action="store_true", help="Verify checked-in JSON matches the complete source import")
    args = parser.parse_args()
    pages = read_pdf(args.pdf)
    numbers = source_pages(pages)
    if args.inspect:
        for number in [n for key in ["factionCards", "bots", "events", "objectives", "units"] for n in numbers[key]]:
            ws = words(pages[number - 1])
            candidates = [w for w in ws if w["x"] < 90 and (CARD_ID.fullmatch(w["s"]) or w["s"].startswith("BOT-") or w["s"] in FACTIONS or re.fullmatch(r"E\d{2}", w["s"]))]
            first = min(candidates, key=lambda w: w["y"])
            print(number, [(round(w["x"], 2), w["s"]) for w in sorted(ws, key=lambda w: w["x"]) if abs(w["y"] - first["y"]) < 3.5])
        raise SystemExit(0)
    data = build_catalog(args.pdf, pages=pages)
    serialized = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        require(args.output.read_text() == serialized, "Checked-in catalog differs from source import")
    else:
        args.output.write_text(serialized)
    print(json.dumps({"output": str(args.output), "checked": args.check, "counts": {k: len(data[k]) for k in ["factionCards", "bots", "events", "objectives", "units", "territories"]}, "unmatchedLegacyUnlockIds": data["provenance"]["unmatchedLegacyUnlockIds"]}, ensure_ascii=False))

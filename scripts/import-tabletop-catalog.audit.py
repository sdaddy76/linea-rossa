#!/usr/bin/env python3
"""Source-image diagnostic contact sheets; not an artwork/deliverable generator."""
import argparse
import importlib.util
import io
import json
import re
import subprocess
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument("--events-zip", type=Path)
parser.add_argument("--faction-zip", action="append", type=Path, default=[])
parser.add_argument("--out-dir", type=Path)
parser.add_argument("--pdf", type=Path, help="Audit the checked-in catalog against this rulebook")
parser.add_argument("--compare-pdf", type=Path, help="Also report exact semantic differences against an older rulebook")
args = parser.parse_args()
if args.compare_pdf and not args.pdf:
    parser.error("--compare-pdf requires --pdf")
if (args.events_zip or args.faction_zip) and not args.out_dir:
    parser.error("source-image audits require --out-dir")
data = json.loads((Path(__file__).resolve().parents[1] / "src/game-v3/catalog-data.json").read_text())
if args.pdf:
    spec = importlib.util.spec_from_file_location("catalog_import", Path(__file__).with_name("import-tabletop-catalog.py"))
    importer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(importer)
    latest = importer.build_catalog(args.pdf)
    sections = [key for key in latest if key != "provenance"]
    counts = {key: len(latest[key]) for key in sections}
    counts["correlations"] = sum(len(links) for tracks in latest["correlations"].values() for links in tracks.values())
    differences = {}
    if args.compare_pdf:
        previous = importer.build_catalog(args.compare_pdf)
        for key in sections:
            if latest[key] == previous[key]:
                continue
            if isinstance(latest[key], list):
                old_rows = {row["id"]: row for row in previous[key]}
                new_rows = {row["id"]: row for row in latest[key]}
                differences[key] = [{"id": row_id, "before": old_rows.get(row_id), "after": new_rows.get(row_id)}
                                    for row_id in sorted(old_rows.keys() | new_rows.keys())
                                    if old_rows.get(row_id) != new_rows.get(row_id)]
            else:
                differences[key] = {"before": previous[key], "after": latest[key]}
    print(json.dumps({"rulebook": latest["provenance"]["rulebook"],
                      "rulebookSha256": latest["provenance"]["rulebookSha256"],
                      "pages": latest["provenance"]["pages"],
                      "checkedCatalogMatches": latest == data,
                      "semanticSections": {key: {"count": counts[key], "matchesChecked": latest[key] == data[key]}
                                           for key in sections},
                      "comparedRulebook": args.compare_pdf.name if args.compare_pdf else None,
                      "semanticDifferences": differences, "sourceGaps": latest["provenance"]["gaps"]},
                     ensure_ascii=False, indent=2))
    if latest != data:
        raise SystemExit("Checked-in catalog differs from source import")
events = {e["id"]: e for e in data["events"]}
codes = {"Iran": "IR", "Coalizione": "CO", "Russia": "RU", "Cina": "CN", "Europa": "EU"}
font = ImageFont.load_default(size=18)
def audit_banner(item):
    archive_path, name, blob = item
    image = Image.open(io.BytesIO(blob)).convert("RGB")
    w, h = image.size
    banner = image.crop((int(w * .59), int(h * .37), w, int(h * .46)))
    encoded = io.BytesIO()
    banner.save(encoded, format="PNG")
    ocr = subprocess.check_output(["tesseract", "stdin", "stdout", "--psm", "6"],
                                  input=encoded.getvalue(), stderr=subprocess.DEVNULL).decode().strip()
    return {"archive": archive_path.name, "image": name, "ocr": ocr,
            "unlocks": bool(re.search(r"SBLOCCA|CARTA SPECIALE", ocr, re.I))}


if args.faction_zip:
    inputs = []
    for archive_path in args.faction_zip:
        with zipfile.ZipFile(archive_path) as archive:
            inputs.extend((archive_path, name, archive.read(name)) for name in archive.namelist()
                          if name.endswith("_fronte.jpg"))
    with ThreadPoolExecutor(max_workers=6) as pool:
        result = list(pool.map(audit_banner, inputs))
    for start in range(0, len(inputs), 39):
        canvas = Image.new("RGB", (1290, 1430), "white")
        draw = ImageDraw.Draw(canvas)
        for index, (_, name, blob) in enumerate(inputs[start:start + 39]):
            image = Image.open(io.BytesIO(blob)).convert("RGB")
            w, h = image.size
            banner = image.crop((int(w * .59), int(h * .37), w, int(h * .46))).resize((430, 90))
            x, y = index % 3 * 430, index // 3 * 110
            draw.text((x + 3, y), Path(name).stem.replace("_fronte", ""), fill="black", font=font)
            canvas.paste(banner, (x, y + 20))
        output = args.out_dir / f"unlock-source-{start + 1:02}-{min(start + 39, len(inputs)):02}.png"
        canvas.save(output)
    print(json.dumps({"checkedFronts": len(result), "positiveBanners": [r for r in result if r["unlocks"]],
                      "allOcr": result}, ensure_ascii=False, indent=2))


if not args.events_zip:
    raise SystemExit(0)
with zipfile.ZipFile(args.events_zip) as archive:
    fronts = sorted(n for n in archive.namelist() if re.search(r"/fronti/E\d{2}_.*\.jpg$", n))
    assert len(fronts) == 75
    for start in range(0, 75, 15):
        canvas = Image.new("RGB", (1360, 15 * 120), "#ffffff")
        draw = ImageDraw.Draw(canvas)
        for index, name in enumerate(fronts[start:start + 15]):
            image = Image.open(io.BytesIO(archive.read(name))).convert("RGB")
            assert image.size == (900, 1260), (name, image.size)
            eid = re.search(r"/(E\d{2})_", name)[1]
            event = events[eid]
            y = index * 120
            draw.text((3, y + 2), eid, fill="black", font=font)
            draw.text((3, y + 28), "JSON", fill="black", font=font)
            draw.text((75, y + 2), " ".join(codes[f] for f in event["order"]), fill="black", font=font)
            draw.text((740, y + 2), " ".join(codes[f] for f in event["advancers"]), fill="black", font=font)
            canvas.paste(image.crop((210, 1010, 850, 1110)), (75, y + 20))
            canvas.paste(image.crop((240, 1130, 850, 1230)), (740, y + 20))
        output = args.out_dir / f"event-turn-source-{start + 1:02}-{start + 15:02}.png"
        canvas.save(output)
        print(output)

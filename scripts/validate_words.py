import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "js", "data")

with open(os.path.join(BASE, "sprites", "sprite-library.json"), encoding="utf-8") as f:
    sprite_ids = {s["id"] for s in json.load(f)["sprites"]}

with open(os.path.join(BASE, "sprites", "palettes.json"), encoding="utf-8") as f:
    palette_names = set(json.load(f).keys())

with open(os.path.join(BASE, "words", "manifest.json"), encoding="utf-8") as f:
    manifest = json.load(f)

errors = []
total = 0

for cat in manifest["categories"]:
    ja_path = os.path.join(BASE, "words", cat["files"]["ja"])
    en_path = os.path.join(BASE, "words", cat["files"]["en"])
    with open(ja_path, encoding="utf-8") as f:
        ja_list = json.load(f)
    with open(en_path, encoding="utf-8") as f:
        en_list = json.load(f)

    total += len(ja_list) + len(en_list)

    ja_ids = set()
    for w in ja_list:
        if w["conceptId"] in ja_ids:
            errors.append(f"duplicate conceptId in {cat['id']}.ja: {w['conceptId']}")
        ja_ids.add(w["conceptId"])
        if w["spriteId"] not in sprite_ids:
            errors.append(f"unknown spriteId {w['spriteId']} in {w['id']}")
        pal = w["spriteVariant"]["palette"]
        if pal not in palette_names:
            errors.append(f"unknown palette {pal} in {w['id']}")
        if "kana" not in w["typing"] or "romajiCanonical" not in w["typing"]:
            errors.append(f"missing typing fields in {w['id']}")

    en_ids = set()
    for w in en_list:
        if w["conceptId"] in en_ids:
            errors.append(f"duplicate conceptId in {cat['id']}.en: {w['conceptId']}")
        en_ids.add(w["conceptId"])
        if w["spriteId"] not in sprite_ids:
            errors.append(f"unknown spriteId {w['spriteId']} in {w['id']}")
        pal = w["spriteVariant"]["palette"]
        if pal not in palette_names:
            errors.append(f"unknown palette {pal} in {w['id']}")
        if "targetText" not in w["typing"]:
            errors.append(f"missing typing.targetText in {w['id']}")

    missing_en = ja_ids - en_ids
    missing_ja = en_ids - ja_ids
    if missing_en:
        print(f"[info] {cat['id']}: JA concepts with no EN pair (OK if intentional): {sorted(missing_en)}")
    if missing_ja:
        errors.append(f"{cat['id']}: EN concepts with no JA pair: {sorted(missing_ja)}")

if errors:
    print(f"FOUND {len(errors)} ERRORS:")
    for e in errors:
        print(" -", e)
else:
    print(f"OK: {total} word entries validated, no errors.")

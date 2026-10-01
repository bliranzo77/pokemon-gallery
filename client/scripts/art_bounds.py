"""Measure the visible (non-transparent) box of every artwork.

Writes src/data/artBounds.json: { slug: [top, bottom, left, right] } as
fractions of the image size, so to-scale figures stand on the floor line and
reach their true height. Re-run after adding images:

    python client/scripts/art_bounds.py
"""
import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
bounds = {}
for path in sorted((root / "public" / "pokemon_assets").glob("*.png")):
    image = Image.open(path).convert("RGBA")
    box = image.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if not box:
        continue
    w, h = image.size
    bounds[path.stem] = [round(box[1] / h, 3), round(box[3] / h, 3), round(box[0] / w, 3), round(box[2] / w, 3)]

out = root / "src" / "data" / "artBounds.json"
out.write_text(json.dumps(bounds, separators=(",", ":")) + "\n")
print(f"Wrote {len(bounds)} entries to {out.relative_to(root)}")

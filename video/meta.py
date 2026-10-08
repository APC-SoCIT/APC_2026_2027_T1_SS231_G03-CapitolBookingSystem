"""Dump SFX cue list and duration from the page -> out/meta.json"""
import json, pathlib
from playwright.sync_api import sync_playwright
url = pathlib.Path("index.html").resolve().as_uri() + "?render"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.goto(url); pg.wait_for_function("window.READY === true", timeout=60000)
    meta = pg.evaluate("({duration: window.DURATION, sfx: window.SFX, cues: window.CUES})")
    b.close()
pathlib.Path("out").mkdir(exist_ok=True)
json.dump(meta, open("out/meta.json", "w"), indent=1)
print(meta["duration"], len(meta["sfx"]), "sfx", len(meta["cues"]), "captions")
from collections import Counter; print(Counter(x["kind"] for x in meta["sfx"]))

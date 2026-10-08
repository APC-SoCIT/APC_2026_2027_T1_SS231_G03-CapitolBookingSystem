"""Usage: python snap.py t1 t2 ...  -> shots/t_<t>.jpg (half-res contact images)."""
import sys, pathlib
from playwright.sync_api import sync_playwright
url = pathlib.Path("index.html").resolve().as_uri() + "?render"
out = sys.argv[1]; pathlib.Path(f"shots/{out}").mkdir(parents=True, exist_ok=True)
ts = [float(a) for a in sys.argv[2:]]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    logs = []
    pg.on("console", lambda m: logs.append(m.text))
    pg.on("pageerror", lambda e: logs.append("ERROR " + str(e)))
    pg.goto(url); pg.wait_for_function("window.READY === true", timeout=60000)
    for t in ts:
        pg.evaluate(f"seek({t})")
        pg.screenshot(path=f"shots/{out}/t_{t:06.2f}.jpg", type="jpeg", quality=70)
    for l in logs: print(l)
    b.close()

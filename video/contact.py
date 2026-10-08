import json, io, requests, time
from PIL import Image, ImageDraw
S = requests.Session(); S.headers["User-Agent"] = "CapitolBookingVideo/1.0 (student project)"
c = json.load(open("assets/photos-candidates.json"))
keys = list(c)
for sheet in range(0, len(keys), 5):
    ks = keys[sheet:sheet+5]
    W, H = 300, 200
    img = Image.new("RGB", (W*8, H*len(ks)), "white"); d = ImageDraw.Draw(img)
    for r, k in enumerate(ks):
        for i, x in enumerate(c[k][:8]):
            url = x["thumb"].replace("1600px-", "330px-")
            for attempt in range(3):
                try:
                    b = S.get(url, timeout=30); im = Image.open(io.BytesIO(b.content)).convert("RGB"); break
                except Exception: time.sleep(2); im = None
            if im is None: continue
            im.thumbnail((W-6, H-24)); img.paste(im, (i*W+3, r*H+3))
            d.rectangle([i*W, r*H+H-20, i*W+W, r*H+H], fill="black"); d.text((i*W+4, r*H+H-17), f"{k}[{i}] {x['license'][:14]}", fill="white")
    img.save(f"assets/sheet{sheet//5}.jpg", quality=80)
    print("sheet", sheet//5, ks)

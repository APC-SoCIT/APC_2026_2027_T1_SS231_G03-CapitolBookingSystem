import json, re, sys, requests, pathlib
S = requests.Session(); S.headers["User-Agent"] = "CapitolBookingVideo/1.0 (student project; mariasopheabalidio@gmail.com)"
API = "https://commons.wikimedia.org/w/api.php"
queries = {
 "pancit_canton": "pancit canton", "pancit_bilao": "pancit bilao", "palabok": "pancit palabok",
 "lumpia": "lumpiang shanghai", "crispy_pata": "crispy pata", "chopsuey": "chop suey filipino",
 "sweet_sour": "sweet and sour fish fillet", "sisig": "sisig sizzling", "fried_chicken": "filipino fried chicken",
 "yangchow": "yang chow fried rice", "lechon_kawali": "lechon kawali", "calamares": "calamares",
 "buffet": "filipino buffet food", "banquet": "banquet hall tables chairs", "restaurant": "chinese restaurant interior round table",
 "packed_meal": "packed meal lunch box food", "rider": "motorcycle delivery rider philippines", "pasay": "Pasay City street",
 "kare": "filipino food spread", "celebration": "birthday party banquet",
}
out = {}
for key, q in queries.items():
    r = S.get(API, params=dict(action="query", format="json", generator="search", gsrsearch=f"filetype:bitmap {q}", gsrnamespace=6, gsrlimit=8,
        prop="imageinfo", iiprop="url|extmetadata|size", iiurlwidth=1600)).json()
    pages = sorted(r.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    out[key] = []
    for p in pages:
        ii = p["imageinfo"][0]; md = ii.get("extmetadata", {})
        lic = md.get("LicenseShortName", {}).get("value", "")
        artist = re.sub("<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip()
        if ii["width"] < 900: continue
        out[key].append(dict(title=p["title"], thumb=ii.get("thumburl"), w=ii["width"], h=ii["height"], license=lic, artist=artist, page=ii["descriptionurl"]))
json.dump(out, open("assets/photos-candidates.json", "w"), indent=1)
for k, v in out.items(): print(k, len(v), [x["title"][5:45] for x in v[:6]])

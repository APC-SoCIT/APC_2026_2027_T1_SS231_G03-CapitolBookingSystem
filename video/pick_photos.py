import json, requests, time, pathlib
S = requests.Session(); S.headers["User-Agent"] = "CapitolBookingVideo/1.0 (student project)"
c = json.load(open("assets/photos-candidates.json"))
picks = {"pancit_canton":("pancit_canton",0),"pancit_bilao":("pancit_bilao",1),"palabok":("palabok",2),"lumpia":("lumpia",2),
 "lumpia2":("lumpia",0),"crispy_pata":("crispy_pata",3),"chopsuey":("chopsuey",1),"sisig":("sisig",2),"fried_chicken":("fried_chicken",5),
 "yangchow":("yangchow",1),"lechon_kawali":("lechon_kawali",0),"catering_spread":("kare",2),"banquet":("banquet",0),"banquet2":("banquet",3),
 "dining":("restaurant",0),"dining2":("restaurant",7),"packed":("packed_meal",4),"packed2":("packed_meal",0),"sweet_sour":("sweet_sour",0),"pasay":("pasay",2)}
credits = []
pathlib.Path("assets/photos").mkdir(exist_ok=True)
for name,(k,i) in picks.items():
    x = c[k][i]
    for a in range(4):
        r = S.get(x["thumb"], timeout=60)
        if r.ok: break
        time.sleep(3)
    open(f"assets/photos/{name}.jpg","wb").write(r.content)
    credits.append(dict(file=f"{name}.jpg", title=x["title"], artist=x["artist"], license=x["license"], source=x["page"]))
    print(name, r.status_code, len(r.content))
json.dump(credits, open("assets/photos/CREDITS.json","w"), indent=1)

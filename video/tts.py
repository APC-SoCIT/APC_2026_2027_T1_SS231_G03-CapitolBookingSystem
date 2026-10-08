"""Generate per-scene narration with edge-tts and write timeline.json (scene starts, VO offsets, word timings)."""
import asyncio, json, re, subprocess, imageio_ffmpeg, edge_tts
FF = imageio_ffmpeg.get_ffmpeg_exe()
cfg = json.load(open("script.json", encoding="utf8"))

def duration(path):
    out = subprocess.run([FF, "-i", path, "-f", "null", "-"], capture_output=True, text=True).stderr
    h, m, s = re.findall(r"time=(\d+):(\d+):([\d.]+)", out)[-1]
    return int(h) * 3600 + int(m) * 60 + float(s)

async def gen(scene):
    words = []
    comm = edge_tts.Communicate(scene["vo"], cfg["voice"], rate=cfg["rate"], boundary="WordBoundary")
    with open(f"audio/{scene['id']}.mp3", "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio": f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary": words.append([round(chunk["offset"] / 1e7, 3), chunk["text"]])
    return words

async def main():
    t, scenes = 0.0, []
    for sc in cfg["scenes"]:
        words, dur = [], 0.0
        if sc["vo"]:
            words = await gen(sc); dur = duration(f"audio/{sc['id']}.mp3")
        length = sc["lead"] + dur + sc["pad"]
        scenes.append(dict(id=sc["id"], start=round(t, 3), length=round(length, 3), vo_at=round(t + sc["lead"], 3), vo_dur=round(dur, 3), words=words))
        print(f"{sc['id']:16s} start {t:7.2f}  vo {dur:5.2f}  len {length:5.2f}")
        t += length
    json.dump(dict(total=round(t, 3), scenes=scenes), open("timeline.json", "w"), indent=1)
    print("TOTAL", round(t, 2), "s =", f"{int(t//60)}:{t%60:04.1f}")
asyncio.run(main())
open("timeline.js", "w", encoding="utf8").write("window.TIMELINE = " + open("timeline.json").read() + ";\nwindow.SCRIPT_TEXT = "
    + json.dumps({s["id"]: s["vo"] for s in cfg["scenes"]}, ensure_ascii=False) + ";\n")

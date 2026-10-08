"""Frame-accurate render of index.html to MP4.

Usage: python render.py [--workers 4] [--fps 30] [--start 0 --end <sec>] [--out out/Capitol_Booking_System.mp4] [--cc 0]
Each worker opens the page headless, seeks every frame deterministically and pipes JPEG frames into ffmpeg.
Segments are concatenated and muxed with out/soundtrack.m4a.
"""
import argparse, json, math, pathlib, subprocess, sys, time
from multiprocessing import Process
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()


def worker(idx, f0, f1, fps, cc, tag):
    from playwright.sync_api import sync_playwright
    url = pathlib.Path("index.html").resolve().as_uri() + f"?render&cc={cc}"
    seg = f"out/seg_{tag}_{idx:02d}.mp4"
    enc = subprocess.Popen([FF, "-y", "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-r", str(fps), "-i", "-",
                            "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-threads", "2", "-x264-params", "rc-lookahead=20",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", str(fps), seg],
                           stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", args=["--allow-file-access-from-files", "--force-color-profile=srgb"])
        pg = b.new_page(viewport={"width": 1920, "height": 1080})
        pg.goto(url)
        pg.wait_for_function("window.READY === true", timeout=120000)
        t0 = time.time()
        for f in range(f0, f1):
            pg.evaluate(f"seek({f / fps})")
            enc.stdin.write(pg.screenshot(type="jpeg", quality=93))
            if (f - f0) % 300 == 0:
                done = f - f0
                rate = done / max(1e-6, time.time() - t0)
                print(f"[w{idx}] {done}/{f1 - f0} frames ({rate:.1f} fps)", flush=True)
        b.close()
    enc.stdin.close(); enc.wait()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--cc", default="1")
    ap.add_argument("--out", default="out/Capitol_Booking_System.mp4")
    a = ap.parse_args()
    dur = json.load(open("out/meta.json"))["duration"]
    end = a.end if a.end is not None else dur
    F0, F1 = int(a.start * a.fps), int(math.ceil(end * a.fps))
    tag = f"cc{a.cc}"
    per = math.ceil((F1 - F0) / a.workers)
    procs = []
    for i in range(a.workers):
        s, e = F0 + i * per, min(F1, F0 + (i + 1) * per)
        if s >= e: continue
        pr = Process(target=worker, args=(i, s, e, a.fps, a.cc, tag)); pr.start(); procs.append((i, pr))
    for _, pr in procs: pr.join()
    lst = pathlib.Path(f"out/segs_{tag}.txt")
    lst.write_text("".join(f"file 'seg_{tag}_{i:02d}.mp4'\n" for i, _ in procs))
    video_only = f"out/video_{tag}.mp4"
    subprocess.run([FF, "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", video_only], check=True)
    subprocess.run([FF, "-y", "-v", "error", "-i", video_only, "-ss", str(a.start), "-i", "out/soundtrack.m4a",
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", a.out], check=True)
    print("wrote", a.out)

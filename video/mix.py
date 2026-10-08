"""Builds the full soundtrack: original synthesized score + UI sound effects + narration.

Output: out/soundtrack.wav and out/soundtrack.m4a
Inputs: timeline.json (narration timing), out/meta.json (SFX cues from the page), audio/*.mp3
"""
import json, subprocess, wave
import numpy as np
import imageio_ffmpeg

SR = 44100
FF = imageio_ffmpeg.get_ffmpeg_exe()
rng = np.random.default_rng(7)
TL = json.load(open("timeline.json"))
META = json.load(open("out/meta.json"))
DUR = TL["total"] + 0.5
N = int(DUR * SR)
S = {s["id"]: s for s in TL["scenes"]}


def decode(path):
    raw = subprocess.run([FF, "-v", "quiet", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def lp(x, cutoff):
    """One-pole low-pass (vectorised via cumulative recursion in blocks)."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    # scipy-free IIR: process in python loop over blocks of the filtered signal
    for i in range(0, len(x), 4096):
        blk = x[i:i + 4096]
        out = np.empty_like(blk)
        for j, v in enumerate(blk):
            acc = (1 - a) * v + a * acc
            out[j] = acc
        y[i:i + 4096] = out
    return y


def hp_noise(n):
    w = rng.standard_normal(n).astype(np.float32)
    return np.diff(w, prepend=0) * 0.5


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    if i < 0:
        sig = sig[-i:]; i = 0
    sig = sig[: len(buf) - i]
    l = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2) / 2 * 1.414
    r = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2) / 2 * 1.414
    buf[i:i + len(sig), 0] += sig * gain * l
    buf[i:i + len(sig), 1] += sig * gain * r


def env(n, a, d_tau=None, release=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if d_tau:
        e *= np.exp(-t / d_tau)
    if release:
        rel_n = int(release * SR)
        if rel_n < n:
            e[-rel_n:] *= np.linspace(1, 0, rel_n)
    return e.astype(np.float32)


# ---------------- instruments ----------------
def pad_note(m, dur, bright=1.0):
    n = int((dur + 1.2) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    sig = np.zeros(n, np.float32)
    for det in (-0.12, 0.0, 0.11):
        ff = f * 2 ** (det / 12)
        for k in range(1, 7):
            sig += (np.sin(2 * np.pi * ff * k * t + rng.random() * 6) / k ** (1.6 - 0.3 * bright)).astype(np.float32)
    e = np.minimum(1, t / 0.9) * np.where(t > dur, np.exp(-(t - dur) / 0.45), 1)
    return sig * e.astype(np.float32) / 9


def keys_note(m, vel=1.0, tau=0.55):
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.25) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.12)
    return (sig * env(n, 0.004, tau) * vel).astype(np.float32)


def bass_note(m, dur):
    n = int((dur + 0.2) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    sig = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return (sig * env(n, 0.01, 0.9, 0.15)).astype(np.float32)


def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 85 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t / 0.18)).astype(np.float32)


def hat(tau=0.03):
    n = int(0.12 * SR)
    return (hp_noise(n) * env(n, 0.001, tau)).astype(np.float32)


def clap():
    n = int(0.25 * SR)
    x = hp_noise(n) * env(n, 0.002, 0.07)
    return np.convolve(x, np.ones(8) / 8, "same").astype(np.float32)


# ---------------- harmony ----------------
CH = {
    "D": ([50, 54, 57, 62], 38), "A/C#": ([49, 52, 57, 61], 37), "Bm": ([47, 50, 54, 59], 47), "G": ([47, 50, 55, 59], 43),
    "A": ([49, 52, 57, 61], 45), "Em": ([47, 52, 55, 59], 40), "F#": ([49, 54, 58, 61], 42), "D/F#": ([50, 54, 57, 62], 42),
    "Gmaj7": ([47, 50, 54, 59], 43), "F#m": ([49, 54, 57, 61], 42),
}

music = np.zeros((N, 2), np.float32)
padbus = np.zeros((N, 2), np.float32)


def section(t0, t1, prog, chord_dur, *, arp=None, bass=False, drums=None, bright=0.8, pad_gain=0.5, keys_gain=0.32):
    t = t0
    i = 0
    beat = chord_dur / 4
    while t < t1 - 0.05:
        name = prog[i % len(prog)]
        notes, root = CH[name]
        d = min(chord_dur, t1 - t)
        for k, m in enumerate(notes):
            place(padbus, pad_note(m, d, bright), t, pad_gain, pan=(k - 1.5) * 0.35)
        if bass:
            for b in range(4):
                bt = t + b * beat
                if bt < t1 and b in (0, 2):
                    place(music, bass_note(root, beat * 1.6), bt, 0.42)
        if arp:
            steps = {"quarter": 4, "eighth": 8}[arp]
            pat = [0, 1, 2, 3, 2, 1, 2, 3] if steps == 8 else [0, 2, 1, 3]
            for s in range(steps):
                st = t + s * chord_dur / steps
                if st >= t1:
                    break
                m = notes[pat[s % len(pat)]] + 12
                vel = 0.85 if s % (steps // 2) == 0 else 0.6
                place(padbus, keys_note(m, vel), st, keys_gain, pan=0.35 * np.sin(s))
        if drums:
            for b in range(8):
                bt = t + b * beat / 2
                if bt >= t1:
                    break
                if b % 4 == 0 and "kick" in drums:
                    place(music, kick(), bt, 0.55)
                if b % 4 == 2 and "clap" in drums:
                    place(music, clap(), bt, 0.10, pan=0.1)
                if "hat" in drums:
                    place(music, hat(), bt, 0.05 if b % 2 else 0.035, pan=-0.3)
                if "hat16" in drums:
                    place(music, hat(0.02), bt + beat / 4, 0.03, pan=0.3)
                if "heart" in drums and b in (0, 1):
                    place(music, kick(), t + b * 0.28, 0.38 if b == 0 else 0.25)
        t += chord_dur
        i += 1


s1, s2, s3, s4 = S["s01_open"], S["s02_problem"], S["s03_reveal"], S["s04_signin"]
s17, s18, s19 = S["s17_platform"], S["s18_close"], S["s19_credits"]
BAR = 2.5  # 96 BPM
section(0.0, s2["start"], ["D", "A/C#", "Bm", "G"], 3.6, arp="quarter", bright=0.7, pad_gain=0.55, keys_gain=0.3)
section(s2["start"], s3["start"], ["Bm", "G", "Em", "F#"], 3.68, drums={"heart"}, bright=0.35, pad_gain=0.5)
reveal_drums = s3["start"] + 3.5
section(s3["start"], reveal_drums, ["D", "A"], 1.75, arp="eighth", bright=0.8, pad_gain=0.5)
section(reveal_drums, s4["start"], ["D", "A", "Bm", "G"], BAR, arp="eighth", bass=True, drums={"kick", "hat"}, bright=1.0)
# product demo: alternate two progressions every 8 bars
t = s4["start"]
blk = 0
while t < s17["start"] - 0.01:
    t_end = min(t + BAR * 8, s17["start"])
    prog = ["D", "Bm", "G", "A"] if blk % 2 == 0 else ["G", "D/F#", "Em", "A"]
    section(t, t_end, prog, BAR, arp="eighth", bass=True, drums={"kick", "hat", "clap"}, bright=0.9, pad_gain=0.42, keys_gain=0.28)
    t = t_end; blk += 1
section(s17["start"], s18["start"], ["Bm", "G", "D", "A"], BAR, arp="eighth", bass=True, drums={"kick", "hat", "clap", "hat16"}, bright=1.1, pad_gain=0.48)
final_hit = s18["start"] + 8.0
section(s18["start"], final_hit, ["D", "A", "Bm", "G"], 2.0, arp="eighth", bass=True, drums={"kick", "hat", "clap"}, bright=1.2, pad_gain=0.55)
section(final_hit, DUR, ["D"], DUR - final_hit, arp="quarter", bright=0.9, pad_gain=0.6, keys_gain=0.25)
# cymbal swell into the reveal and the close
for tt in (s3["start"] - 1.6, s18["start"] - 1.4):
    n = int(1.6 * SR)
    sw = hp_noise(n) * np.linspace(0, 1, n) ** 2.5
    place(music, sw.astype(np.float32), tt, 0.12)
crash_n = int(2.5 * SR)
place(music, (hp_noise(crash_n) * env(crash_n, 0.002, 0.7)).astype(np.float32), final_hit, 0.10)


def reverb(x, seconds=2.2, wet=0.28):
    n_ir = int(seconds * SR)
    ir = (rng.standard_normal(n_ir) * np.exp(-np.arange(n_ir) / SR / (seconds / 5))).astype(np.float32)
    ir /= np.sqrt(np.sum(ir ** 2))
    out = np.zeros_like(x)
    B = 1 << 17
    nfft = 1 << int(np.ceil(np.log2(B + n_ir)))
    IR = np.fft.rfft(ir, nfft)
    for c in range(x.shape[1]):
        acc = np.zeros(len(x) + nfft, np.float32)
        for i in range(0, len(x), B):
            seg = np.fft.irfft(np.fft.rfft(x[i:i + B, c], nfft) * IR, nfft)
            acc[i:i + nfft] += seg.astype(np.float32)
        out[:, c] = acc[: len(x)]
    return x * (1 - wet) + out * wet * 2.2


music += reverb(padbus)
# fade in/out
fi = int(1.5 * SR)
music[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(5.0 * SR)
music[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

# ---------------- narration ----------------
vo = np.zeros(N, np.float32)
for sc in TL["scenes"]:
    if sc["vo_dur"] > 0:
        a = decode(f"audio/{sc['id']}.mp3")
        i = int(sc["vo_at"] * SR)
        vo[i:i + len(a)] += a[: N - i]
vo /= max(1e-6, np.abs(vo).max())
vo *= 0.78

# ducking envelope from narration
blk = 441
rms = np.sqrt(np.convolve(vo ** 2, np.ones(blk) / blk, "same"))
gate = (rms > 0.02).astype(np.float32)
# smooth: fast attack, slow release
k_att, k_rel = 1 - np.exp(-1 / (0.06 * SR / blk)), 1 - np.exp(-1 / (0.5 * SR / blk))
g = gate[::blk]
sm = np.zeros_like(g)
acc = 0.0
for i, v in enumerate(g):
    acc += (v - acc) * (k_att if v > acc else k_rel)
    sm[i] = acc
duck = np.repeat(sm, blk)[:N]
duck = np.pad(duck, (0, N - len(duck)))
music_gain = 0.34 * (1 - 0.6 * duck)
music *= music_gain[:, None]

# ---------------- sound effects ----------------
def sfx(kind):
    if kind == "click":
        n = int(0.05 * SR); x = hp_noise(n) * env(n, 0.0005, 0.006) * 0.9
        t = np.arange(n) / SR; x += np.sin(2 * np.pi * 2400 * t) * env(n, 0.0005, 0.01) * 0.25
        return x, 0.33
    if kind == "tick":
        n = int(0.12 * SR); t = np.arange(n) / SR
        return np.sin(2 * np.pi * 1760 * t) * env(n, 0.001, 0.03), 0.16
    if kind == "pop":
        n = int(0.16 * SR); t = np.arange(n) / SR
        f = 520 + 520 * (1 - np.exp(-t / 0.03)); ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * env(n, 0.002, 0.045), 0.20
    if kind in ("whoosh", "send"):
        dur = 0.45 if kind == "whoosh" else 0.3; n = int(dur * SR)
        x = rng.standard_normal(n).astype(np.float32)
        x = np.convolve(x, np.ones(14) / 14, "same") * np.sin(np.linspace(0, np.pi, n)) ** 2
        return x, 0.22 if kind == "whoosh" else 0.16
    if kind == "ding":
        n = int(1.4 * SR); t = np.arange(n) / SR
        x = (np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1975.5 * t) * np.exp(-t / 0.3)) * env(n, 0.002, 0.45)
        x2 = np.sin(2 * np.pi * 1760 * t) * env(n, 0.002, 0.5)
        sh = int(0.09 * SR); x[sh:] += x2[:-sh] * 0.8
        return x, 0.13
    if kind == "boom":
        n = int(2.4 * SR); t = np.arange(n) / SR
        f = 38 + 50 * np.exp(-t / 0.08); ph = 2 * np.pi * np.cumsum(f) / SR
        x = np.sin(ph) * env(n, 0.003, 0.9) + np.convolve(rng.standard_normal(n), np.ones(40) / 40, "same") * env(n, 0.002, 0.25) * 0.6
        return x, 0.55
    if kind == "rise":
        n = int(1.0 * SR); x = hp_noise(n) * np.linspace(0, 1, n) ** 2
        return x, 0.12
    if kind == "stamp":
        n = int(0.6 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (70 + 60 * np.exp(-t / 0.03)) * t) * env(n, 0.001, 0.15) + np.convolve(rng.standard_normal(n), np.ones(6) / 6, "same") * env(n, 0.001, 0.05)
        return x, 0.55
    if kind == "ring":
        n = int(1.5 * SR); t = np.arange(n) / SR
        trem = (np.sin(2 * np.pi * 20 * t) > 0).astype(np.float32)
        x = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * trem * ((t % 0.7) < 0.45)
        return x * env(n, 0.01, None, 0.1), 0.06
    if kind == "paper":
        n = int(0.7 * SR); x = hp_noise(n) * (0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 18, n)))) * np.sin(np.linspace(0, np.pi, n))
        return x, 0.12
    return np.zeros(10), 0


fx = np.zeros((N, 2), np.float32)
for c in META["sfx"]:
    x, gain = sfx(c["kind"])
    place(fx, np.asarray(x, np.float32), c["t"], gain, pan=0.0)

mix = music + fx + np.stack([vo, vo], 1)
peak = np.abs(mix).max()
mix = np.tanh(mix / max(peak, 1e-6) * 1.15) / np.tanh(1.15) * 0.89  # gentle limiter to about -1 dBFS
pcm = (mix * 32767).astype(np.int16)
with wave.open("out/soundtrack.wav", "wb") as wv:
    wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes(pcm.tobytes())
subprocess.run([FF, "-y", "-v", "error", "-i", "out/soundtrack.wav", "-c:a", "aac", "-b:a", "192k", "out/soundtrack.m4a"], check=True)
print("soundtrack", round(len(pcm) / SR, 2), "s, peak", round(float(np.abs(mix).max()), 3))

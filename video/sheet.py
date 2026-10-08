"""Tile shots/*.jpg (sorted) into shots/sheet_N.jpg, 2 columns, 960px wide each."""
import glob, sys
from PIL import Image, ImageDraw
D = sys.argv[1]; fs = sorted(glob.glob(f"shots/{D}/t_*.jpg")); per = 6
for n in range(0, len(fs), per):
    grp = fs[n:n+per]; rows = (len(grp)+1)//2
    S = Image.new("RGB", (1920, rows*540), "black"); d = ImageDraw.Draw(S)
    for i, f in enumerate(grp):
        im = Image.open(f).resize((960, 540)); S.paste(im, ((i%2)*960, (i//2)*540))
        d.rectangle([(i%2)*960, (i//2)*540, (i%2)*960+110, (i//2)*540+26], fill="yellow"); d.text(((i%2)*960+6, (i//2)*540+6), f.split("t_")[-1][:-4], fill="black")
    S.save(f"shots/{D}/sheet_{n//per}.jpg", quality=80)
print((len(fs)+per-1)//per, "sheets")

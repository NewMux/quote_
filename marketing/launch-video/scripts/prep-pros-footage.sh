#!/usr/bin/env bash
# Cuts the footage for the "Pros" edit (src/pros) into public/pros/clips: each shot trimmed to
# the moment it uses, cropped to the 3:2 band (1080×720) and, where `slow` < 1, slowed down with
# motion interpolation so short moments play smoothly.
#
#   scripts/prep-pros-footage.sh <oceans.mp4> <advance-1.mp4> <advance-2.mp4> <bond.mp4>
#
# The four files are the TikTok reference edits (in the order they were shared). The clips are
# third-party footage, so they are not committed (see .gitignore).
set -euo pipefail
[ $# -eq 4 ] || { sed -n '2,9p' "$0"; exit 1; }
cd "$(dirname "$0")/.."
OCEANS=$1 ADV1=$2 ADV2=$3 BOND=$4
OUT=public/pros/clips
mkdir -p "$OUT"

# cut <input> <start> <source seconds> <slow> <crop> <name> [extra filters]
cut() {
  local slow=$4 speed=""
  [ "$slow" != 1 ] && speed=",setpts=PTS/$slow,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"
  ffmpeg -hide_banner -loglevel error -y -ss "$2" -t "$3" -i "$1" -an -filter_complex \
    "[0:v]$5,scale=1080:720:flags=lanczos,setsar=1,fps=30$speed${7:+,$7}" \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -g 10 "$OUT/$6.mp4"
}

# Ocean's (720×576): the TikTok watermark sits at the left edge (x < 120, y 330–380) until
# 5.6 s and at the bottom right (y > 510) after, so each window avoids it.
cut "$OCEANS" 0.00 0.55 0.66 crop=600:400:120:40 film-tux
cut "$OCEANS" 3.95 1.05 1 crop=600:400:120:60 film-lean
cut "$OCEANS" 2.80 0.85 1 crop=600:400:120:100 film-dice
cut "$OCEANS" 1.95 0.60 1 crop=600:400:120:60 film-hand
cut "$OCEANS" 7.97 0.50 0.45 crop=720:480:0:20 film-jet
cut "$OCEANS" 5.75 0.45 0.45 crop=720:480:0:0 film-smile
cut "$OCEANS" 11.70 0.60 1 crop=720:480:0:0 film-drink
cut "$OCEANS" 12.22 0.50 0.42 crop=720:480:0:0 film-car

# "ADVANCE" edits (576×1024, footage band y 317–707, "ADVANCE" mark at y ≈ 640, TikTok
# watermark at x < 140 early on). Only the instants between their animated words are used.
cut "$ADV2" 2.48 0.26 0.22 crop=416:277:160:325 adv-gym
cut "$ADV1" 1.88 0.34 0.24 crop=277:185:215:440 adv-kneel
cut "$ADV2" 9.74 0.24 0.27 crop=462:308:57:317 adv-boxer
cut "$ADV2" 5.98 0.24 0.45 crop=462:308:57:317 adv-sunset

# Bond edit (576×1024, band y 332–693): its caption covers x ≈ 145–450, y ≈ 455–565 in every
# frame (x 255–870, y 255–465 once cropped and scaled), so that block is blurred and darkened
# under a feathered rounded rectangle; the subtitles sit on top of it. Its TikTok watermark is
# inside the band before 5.5 s, so only later shots are used.
SOFT="split[base][b];[b]gblur=sigma=30,eq=brightness=-0.14[blur];color=black:s=1080x720,format=gray,geq=lum='255*clip(min((370-abs(X-562))/70\,(150-abs(Y-360))/45)\,0\,1)'[mask];[blur][mask]alphamerge[bm];[base][bm]overlay=shortest=1"
cut "$BOND" 7.55 1.05 1 crop=541:361:17:332 bond-shades "$SOFT"
cut "$BOND" 5.60 0.65 1 crop=541:361:17:332 bond-aston "$SOFT"
cut "$BOND" 10.15 1.45 1 crop=541:361:17:332 bond-rolls "$SOFT"

ls -1 "$OUT"

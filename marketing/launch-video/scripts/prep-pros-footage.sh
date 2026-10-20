#!/usr/bin/env bash
# Cuts the footage for the "Pros" edit (src/pros) into public/pros/clips: every shot trimmed to
# the source time it plays and cropped to the 3:2 band (1080×720).
#
#   scripts/prep-pros-footage.sh [path/to/oceans-reference.mp4]
#
# Stock shots come from Mixkit (free for commercial use, https://mixkit.co/license/#videoFree)
# and are downloaded on demand. The film shots are cut from the Ocean's reference edit you pass
# in; they are skipped when no path is given, and are not committed (see .gitignore).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/pros/clips
CACHE=.cache/mixkit
mkdir -p "$OUT" "$CACHE"

encode() { # <input> <start> <duration> <crop filter> <output name>
  ffmpeg -hide_banner -loglevel error -y -ss "$2" -i "$1" -t "$3" -an \
    -vf "$4,scale=1080:720:flags=lanczos,setsar=1,fps=30" \
    -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -g 10 "$OUT/$5.mp4"
}

# Crop a centered 3:2 window out of any frame size (x/y bias 0..1, zoom ≥ 1).
crop32() { # <x bias> <y bias> <zoom>
  echo "crop='min(iw,ih*1.5)/$3':'min(iw,ih*1.5)/1.5/$3':'(iw-min(iw,ih*1.5)/$3)*$1':'(ih-min(iw,ih*1.5)/1.5/$3)*$2'"
}

stock() { # <mixkit id> <start> <duration> <name> [x bias] [y bias] [zoom]
  local src="$CACHE/$1.mp4"
  [ -f "$src" ] || curl -sSfL -o "$src" "https://assets.mixkit.co/videos/$1/$1-720.mp4"
  encode "$src" "$2" "$3" "$(crop32 "${5:-0.5}" "${6:-0.5}" "${7:-1}")" "$4"
}

stock 5601 2.0 1.0 stressed-desk 0.5 0.4
stock 45922 0.5 1.4 overwhelmed 0.5 0.3
stock 33029 1.0 1.1 watch-on 0.5 0.5
stock 28888 4.0 0.8 watch-bw 0.5 0.5
stock 4526 6.0 0.9 paperwork-thrown 0.5 0.4
stock 4832 1.0 1.1 suit-street 0.5 0.4
stock 30013 1.5 1.0 handshake 0.5 0.5
stock 40733 6.0 0.6 city-night 0.5 0.5

# Film shots, from the 720×576 reference. Its TikTok watermark sits at the left edge (x < 120,
# y 330–380) until 5.6 s and at the bottom right (y > 510) after, so each window avoids it.
if [ $# -ge 1 ]; then
  FILM="$1"
  early() { encode "$FILM" "$1" "$2" "crop=600:400:120:$3" "$4"; }
  late() { encode "$FILM" "$1" "$2" "crop=720:480:0:$3" "$4"; }
  early 0.00 0.55 40 film-tux
  early 3.95 1.05 60 film-lean
  early 2.80 0.85 100 film-dice
  early 1.95 0.60 60 film-hand
  late 7.97 0.50 20 film-jet
  late 11.72 0.50 0 film-drink
  late 12.22 0.50 0 film-car
fi

ls -1 "$OUT"

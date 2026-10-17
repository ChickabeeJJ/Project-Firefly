#!/usr/bin/env bash
# Repeatable reference study: samples the footage and tiles numbered contact sheets.
# Usage: tools/contact-sheet.sh <video> <out-dir> [overview-fps] [battle-start-s] [battle-len-s]
set -euo pipefail
VIDEO="${1:?video path}"
OUT="${2:?output dir}"
FPS="${3:-0.4}"          # 0.4 fps = one frame every 2.5 s (frame n is at n*2.5 s)
BSTART="${4:-128}"       # dense pass over the battle segment
BLEN="${5:-38}"
mkdir -p "$OUT/overview" "$OUT/battle"
ffmpeg -v error -y -i "$VIDEO" -vf "fps=${FPS},scale=960:-1" -q:v 3 "$OUT/overview/f_%03d.jpg"
ffmpeg -v error -y -i "$OUT/overview/f_%03d.jpg" \
  -vf "scale=480:-1,drawtext=text='%{n}':x=5:y=5:fontsize=24:fontcolor=yellow:box=1:boxcolor=black,tile=3x3" \
  -q:v 3 "$OUT/overview/sheet_%02d.jpg"
ffmpeg -v error -y -ss "$BSTART" -t "$BLEN" -i "$VIDEO" -vf "fps=1,scale=1280:-1" -q:v 3 "$OUT/battle/b_%03d.jpg"
ffmpeg -v error -y -i "$OUT/battle/b_%03d.jpg" \
  -vf "scale=640:-1,drawtext=text='%{n}':x=5:y=5:fontsize=28:fontcolor=yellow:box=1:boxcolor=black,tile=2x3" \
  -q:v 3 "$OUT/battle/sheet_%02d.jpg"
echo "Contact sheets written to $OUT (overview frame n = n/${FPS} s; battle frame k = ${BSTART}+k s)"

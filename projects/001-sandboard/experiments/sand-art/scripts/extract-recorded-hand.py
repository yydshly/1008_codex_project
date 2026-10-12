"""Extract a real filmed pour gesture, retaining source RGB. Requires cv2 + ffmpeg.

Source: CC BY 3.0, Телеканал КРТ, 2019. This is a silhouette matte trial,
not generated anatomy. A dark-foreground mask removes the illuminated table.
"""
import argparse
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
args.destination.mkdir(parents=True, exist_ok=True)
cap = cv2.VideoCapture(str(args.source))
cap.set(cv2.CAP_PROP_POS_MSEC, 135000)
width, height, fps, frames = 800, 720, 25, 35
encoder = subprocess.Popen([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
    '-pix_fmt', 'rgba', '-s', f'{width}x{height}', '-r', str(fps), '-i', '-',
    '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0',
    '-crf', '25', '-auto-alt-ref', '0', str(args.destination / 'recorded-pour.webm')
], stdin=subprocess.PIPE)
anchors = []
for n in range(frames):
    ok, frame = cap.read()
    if not ok:
        raise RuntimeError('Source footage ended unexpectedly')
    frame = frame[:, :width]
    dark = (frame.max(axis=2) < 82).astype(np.uint8) * 255
    b, g, r = [frame[:, :, i].astype(np.float32) for i in range(3)]
    # Saturated flowers / foliage can touch the hand; retain the recorded brown skin.
    dark[(r > g * 2.2 + 10) | (g > r * 1.35 + 10)] = 0
    # Fine drawn lines and isolated sand grains are narrower than the filmed arm.
    mask = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((17, 17), np.uint8))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    candidates = [i for i in range(1, count) if stats[i, cv2.CC_STAT_AREA] > 2500
                  and stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] > height - 15]
    mask[:] = 0
    if candidates:
        part = max(candidates, key=lambda i: stats[i, cv2.CC_STAT_AREA])
        core = (labels == part).astype(np.uint8) * 255
        mask = cv2.bitwise_and(dark, cv2.dilate(core, np.ones((9, 9), np.uint8)))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        ys, xs = np.where(mask > 0)
        top = int(ys.min())
        fingertip = xs[ys < top + 16]
        # Record the top contact area, not a fixed point in a moving clip.
        anchors.append({'progress': n / (frames - 1), 'x': float((np.median(fingertip) + 45) / width), 'y': (top + 45) / height})
    alpha = cv2.GaussianBlur(mask, (5, 5), .8)
    rgba = np.dstack((cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), alpha))
    encoder.stdin.write(rgba.tobytes())
    if n == 12:
        # Diagnostic video frame: source pixels composited over a plain light table.
        a = alpha[:, :, None] / 255
        preview = frame * a + np.full_like(frame, (214, 228, 238)) * (1 - a)
        cv2.imwrite(str(args.destination / 'matte-diagnostic.png'), preview.astype(np.uint8))
cap.release()
encoder.stdin.close()
if encoder.wait() != 0:
    raise RuntimeError('Video encoding failed')
if not anchors:
    raise RuntimeError('No real arm found')
calibration = {'key': 'alpha', 'width': .5, 'start': 0, 'end': 1.36, 'anchors': anchors}
(args.destination / 'pour-calibration.json').write_text(json.dumps(calibration, indent=2), encoding='utf8')
print(json.dumps({'frames': frames, 'anchors': len(anchors), 'duration': frames / fps}))


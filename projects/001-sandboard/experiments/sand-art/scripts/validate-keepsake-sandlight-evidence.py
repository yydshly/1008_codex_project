"""Validate the actual v35 browser exports; no source media or target images rendered."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import subprocess
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg-dir', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
directory = root.parents[1] / 'assets' / 'keepsake-sandlight-v35'
ffmpeg = str(Path(args.ffmpeg_dir) / 'ffmpeg.exe')
ffprobe = str(Path(args.ffmpeg_dir) / 'ffprobe.exe')
video = directory / 'actual-film.webm'

def run(command):
    return subprocess.run(command, check=True, capture_output=True).stdout

info = json.loads(run([ffprobe, '-v', 'error', '-show_format', '-show_streams',
                      '-show_frames', '-select_streams', 'v:0', '-of', 'json', str(video)]))
frames = info['frames']
assert frames and len(frames) > 700
dimensions = {(f['width'], f['height']) for f in frames}
assert dimensions == {(1920, 1080)}, dimensions
duration = float(info['format']['duration'])
assert 45 <= duration < 75, duration
run([ffmpeg, '-v', 'error', '-i', str(video), '-f', 'null', '-'])
last = max(float(f.get('best_effort_timestamp_time', 0)) for f in frames)
for name, time in [('intro', 2), ('pour', 9), ('gather', 20), ('final', last-.12)]:
    data = run([ffmpeg, '-v', 'error', '-ss', str(time), '-i', str(video),
                '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-'])
    assert data, name
    (directory / ('film-' + name + '.jpg')).write_bytes(data)
poster = directory / 'actual-poster.png'
assert Image.open(poster).size == (1920, 1080)
a = Image.open(directory / 'film-final.jpg').convert('RGB').resize((128, 72))
b = Image.open(poster).convert('RGB').resize((128, 72))
error = sum(abs(x-y) for p, q in zip(a.getdata(), b.getdata()) for x, y in zip(p, q)) / (128*72*3*255)
assert error < .02, error
html = (directory / 'gift.html').read_text(encoding='utf-8-sig')
encoded = re.search(r'src="data:video/webm;base64,([A-Za-z0-9+/=]+)"', html)
assert encoded and base64.b64decode(encoded.group(1)) == video.read_bytes()
project = json.loads((directory / 'sample.sandmemory.json').read_text(encoding='utf-8-sig'))
assert project['photo'] not in html, 'Original photograph included without opting in'
for name in ['title', 'recipient', 'story', 'dedication']:
    assert project[name] in html, name
assert '<script' not in html.lower()
result = {
    'width': 1920, 'height': 1080, 'duration': duration, 'frames': len(frames),
    'codec': info['streams'][0]['codec_name'], 'bytes': video.stat().st_size,
    'fullDecode': True, 'lastFramePTS': last, 'endPosterMeanRGBError': error,
    'giftVideoMatchesDownload': True, 'sourcePhotoExcludedByDefault': True,
    'inputKind': 'existing AI rain-window sample; story is fictional',
    'arbitraryRealPhotoArtQualityVerified': False,
}
(directory / 'media-validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))


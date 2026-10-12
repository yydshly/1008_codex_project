"""核对本机网页导出的 v31 媒体；Python + Pillow，指定现有 FFmpeg 目录。"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

parser = argparse.ArgumentParser()
parser.add_argument("--ffmpeg-dir", required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
assets = root.parents[1] / "assets" / "cup-action-v31"
ffmpeg = Path(args.ffmpeg_dir) / "ffmpeg.exe"
ffprobe = Path(args.ffmpeg_dir) / "ffprobe.exe"
movie = assets / "actual-process.webm"
probe = json.loads(subprocess.check_output([
    str(ffprobe), "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_frames",
    "-show_entries", "frame=width,height,best_effort_timestamp_time:stream=codec_name,width,height,nb_read_frames:format=duration,size",
    "-of", "json", str(movie),
], text=True))
sizes = sorted({(f["width"], f["height"]) for f in probe["frames"]})
assert len(sizes) == 1, sizes
duration = float(probe["format"]["duration"])
assert 30 <= duration < 40, duration
subprocess.run([str(ffmpeg), "-v", "error", "-i", str(movie), "-f", "null", "-"], check=True)
last_timestamp = max(float(f["best_effort_timestamp_time"]) for f in probe["frames"])
for seconds, name in [(8.9, "process-push.jpg"), (last_timestamp - .06, "process-end.jpg")]:
    pixels = subprocess.check_output([str(ffmpeg), "-v", "error", "-ss", str(seconds), "-i", str(movie),
                    "-frames:v", "1", "-q:v", "2", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"])
    assert len(pixels) > 500, (seconds, "没有输出帧，不能沿用历史截图")
    (assets / name).write_bytes(pixels)
actual = Image.open(assets / "actual-cup.png").convert("RGB")
last = Image.open(assets / "process-end.jpg").convert("RGB")
assert actual.size == last.size == tuple(sizes[0]), (actual.size, last.size, sizes)
def resize(im):
    return im.resize((96, 64), Image.Resampling.LANCZOS)
error = sum(ImageStat.Stat(ImageChops.difference(resize(actual), resize(last))).mean) / 3 / 255
assert error < .015, error
inspection = json.loads((assets / "inspection-validation.json").read_text(encoding="utf-8"))
assert inspection[0]["out"] == inspection[1]["out"]
assert float(inspection[2]["out"].strip("%")) > float(inspection[1]["out"].strip("%")) + 10
record = {"codec": probe["streams"][0]["codec_name"], "dimensions": sizes[0],
          "seconds": duration, "frames": int(probe["streams"][0]["nb_read_frames"]),
          "bytes": int(probe["format"]["size"]), "allFramesSameSize": True,
          "fullDecodePassed": True, "endVsPNGMeanRGBError96x64": error,
          "lastDecodedFrameTimestamp": last_timestamp,
          "gatherInspectionPassed": True}
(assets / "media-validation.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
# 核对历史 v30 产物全部校验值；没有覆写历史目录。
old = assets.parent / "no-hand-photo-v30"
for line in (old / "SHA256SUMS").read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    expected, filename = line.split(maxsplit=1)
    path = old / filename.strip().lstrip("*")
    assert hashlib.sha256(path.read_bytes()).hexdigest() == expected, filename
print(json.dumps({**record, "v30AllSavedHashesUnchanged": True}, indent=2))

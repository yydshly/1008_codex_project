"""本项目原创：获取固定提交的文本源码供离线研究，不获取凭证或媒体文件。"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import hashlib
import json
import time
import urllib.request

COMMIT = "fb80ae6dd6fc26f5553efcb293ee6d93ef253f02"
ROOT = Path(__file__).resolve().parent
DEST = ROOT / "upstream"
HEADERS = {"User-Agent": "Easel-source-research/1.0"}

def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=40) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(attempt + 1)

tree = json.loads(get(f"https://api.github.com/repos/ZJU-REAL/Easel/git/trees/{COMMIT}?recursive=1"))
paths = [item["path"] for item in tree["tree"] if item["type"] == "blob" and (
    item["path"] in ["README.md", "LICENSE", "pyproject.toml", "WECHAT_OA_INTEGRATION.md"]
    or item["path"].startswith(("skills/", "profiles/", "docs/", "easel/", "openclaw/", "web/frontend/src/"))
    or item["path"] == "web/app.py"
) and Path(item["path"]).suffix.lower() in [".md", ".py", ".ts", ".tsx", ".toml", ".sh", ".json5", ""]]

def fetch(path):
    target = DEST / path
    if not target.exists():
        data = get(f"https://raw.githubusercontent.com/ZJU-REAL/Easel/{COMMIT}/{path}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    data = target.read_bytes()
    return {"path": path, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}

records = []
with ThreadPoolExecutor(max_workers=12) as executor:
    pending = {executor.submit(fetch, path): path for path in paths}
    for future in as_completed(pending):
        records.append(future.result())
        if len(records) % 50 == 0:
            print(f"已获取 {len(records)}/{len(paths)} 个文本文件", flush=True)
manifest = {"repository": "https://github.com/ZJU-REAL/Easel", "commit": COMMIT,
            "date": "2026-10-09", "files": sorted(records, key=lambda item: item["path"])}
(ROOT / "upstream-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"完成：{len(records)} 个文件，{COMMIT}")

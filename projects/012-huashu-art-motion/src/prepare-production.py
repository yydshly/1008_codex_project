"""读取生成素材尺寸/alpha并登记取帧区域；不修改图片像素，不做生图或抠图。"""
from PIL import Image
from pathlib import Path
import json, hashlib

root = Path(__file__).resolve().parents[1] / 'assets' / 'production'
names = ['traveler-atlas', 'history-worlds', 'life-worlds', 'travel-worlds', 'emotion-worlds', 'garden-museum', 'foliage-atlas']
assets = {}
for name in names:
    p = root / (name + '.png')
    im = Image.open(p)
    info = {'file': name + '.png', 'width': im.width, 'height': im.height, 'mode': im.mode, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    if im.mode == 'RGBA':
        hist = im.getchannel('A').histogram()
        info['transparentFraction'] = hist[0] / (im.width * im.height)
    assets[name] = info

im = Image.open(root / 'traveler-atlas.png')
assert im.mode == 'RGBA' and assets['traveler-atlas']['transparentFraction'] > .2
frames = []
for i in range(16):
    col, row = i % 4, i // 4
    x0, x1 = round(col * im.width / 4), round((col+1) * im.width / 4)
    y0, y1 = round(row * im.height / 4), round((row+1) * im.height / 4)
    cell = im.crop((x0,y0,x1,y1))
    bbox = cell.getchannel('A').point(lambda v: 255 if v > 140 else 0).getbbox()
    assert bbox is not None
    l,t,r,b = bbox
    frames.append({'index':i, 'source':[x0+l,y0+t,r-l,b-t], 'anchor':[im.width/8-l,b-t], 'cellHeight':im.height/4, 'visibleHeight':b-t})

manifest = {'date':'2026-10-09','route':'生成美术素材与透明动作帧 → 分层合成与场景动画 → 1080p逐帧出片', 'assets':assets, 'frames':frames, 'imageEdits':'无程序改图；只读取alpha和尺寸，画布按来源区域取帧。'}
(root/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
print('登记7个生成素材和16个动作区域；角色真实透明alpha比例',round(assets['traveler-atlas']['transparentFraction'],3))

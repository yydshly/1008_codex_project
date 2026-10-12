"""原创研究整理脚本：逐项读取固定提交的 Skill、引用和程序路径。"""
from pathlib import Path
from collections import Counter
import json
import re
from mechanisms import MECHANISMS

ROOT = Path(__file__).resolve().parent
UP = ROOT / "upstream"
COMMIT = "fb80ae6dd6fc26f5553efcb293ee6d93ef253f02"
WEB = ROOT.parent / "web"

def clean(text):
    return re.sub(r"\s+", " ", re.sub(r"[*_`]", "", text)).strip()

def header(text):
    front = text.split("---", 2)[1] if text.startswith("---") else ""
    values = {}
    key = None
    for line in front.splitlines():
        m = re.match(r"^([\w-]+):\s*(.*)$", line)
        if m:
            key, value = m.groups()
            values[key] = "" if value in [">", "|-", ">-", "|"] else value.strip().strip('"')
        elif key and line.strip():
            values[key] += " " + line.strip()
    return values

items = []
display_text = (UP / "web/frontend/src/lib/skillDisplayNames.ts").read_text(encoding="utf-8")
display_names = dict(re.findall(r"'([^']+)':\s*'([^']+)'", display_text))
for file in sorted((UP / "skills/openclaw").glob("*/SKILL.md")):
    text = file.read_text(encoding="utf-8-sig")
    meta = header(text)
    body = text.split("---", 2)[-1] if text.startswith("---") else text
    title = re.search(r"^#\s+(.+)$", body, re.M)
    sections = []
    matches = list(re.finditer(r"^##\s+(.+)$", body, re.M))
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        sections.append({"title": clean(match.group(1)), "text": body[match.end():end].strip()})
    scripts = [p.relative_to(UP).as_posix() for p in sorted((file.parent / "scripts").rglob("*")) if p.is_file()]
    refs = set()
    for path in re.findall(r"\]\(([^)#]+)(?:#[^)]*)?\)", text):
        resolved = (file.parent / path).resolve()
        if resolved.is_file() and resolved.is_relative_to(UP.resolve()):
            refs.add(resolved.relative_to(UP).as_posix())
    for path in re.findall(r"skills/[\w./-]+\.(?:py|md|sh|ts)", text):
        if (UP / path).is_file():
            refs.add(path)
    # 同名共享工具只作「文档提及」，不把提及误写为已执行。
    for basename in set(re.findall(r"\b([a-z][a-z_]+\.py)\b", text)):
        shared = UP / "skills/shared/scripts" / basename
        if shared.is_file():
            refs.add(shared.relative_to(UP).as_posix())
    workflow = [s for s in sections if re.search(r"步骤|流程|工作流|执行|原理|实现|模式|设计|Step|Pipeline|Workflow|How|Generation|Process", s["title"], re.I)]
    description = clean(meta.get("description", ""))
    description = re.split(r"当用户|当需要|When |Use when", description, maxsplit=1)[0].strip()
    # 保留完整路径：共享资料、../跨技能资料、card-design/... 均不能误判为本技能缺失。
    missing = []
    for path in sorted(set(re.findall(r"(?<![\w./-])([\w./-]*references/[\w./-]+\.md)", text))):
        if path.startswith("skills/"):
            resolved = UP / path
        elif path.startswith(("../", "./", "references/")):
            resolved = file.parent / path
        else:
            resolved = UP / "skills/openclaw" / path
        resolved = resolved.resolve()
        if resolved.is_file() and resolved.is_relative_to(UP.resolve()):
            refs.add(resolved.relative_to(UP).as_posix())
        else:
            missing.append(path)
    if file.parent.name not in MECHANISMS:
        raise ValueError("缺少机制说明: " + file.parent.name)
    items.append({"id": file.parent.name, "title": display_names.get(file.parent.name, clean(title.group(1)) if title else file.parent.name),
                  "layer": meta.get("layer", "general"), "description": description,
                  "mechanism": MECHANISMS[file.parent.name], "missingReferences": missing,
                  "path": file.relative_to(UP).as_posix(), "scripts": scripts, "references": sorted(refs),
                  "sections": sections, "workflow": workflow, "document": body.strip()})

WEB.mkdir(exist_ok=True)
(WEB / "capabilities.json").write_text(json.dumps({"commit": COMMIT, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("技能总数:", len(items), "层级:", dict(Counter(item["layer"] for item in items)))
for item in items:
    print(item["id"], "|", item["title"], "|", item["layer"], "|", len(item["scripts"]), "|", len(item["workflow"]))

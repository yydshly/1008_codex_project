#!/usr/bin/env python3
"""独立实验：只请求公开 Feed，记录当前环境中的响应与 XML 字段。

仅使用 Python 标准库，不调用 AIHOT 后端、模型或付费 API。
用法：python projects/013-aihot/src/check-feeds.py --client-date 2026-10-12
结果不是站点可用性监控；访问失败不等同于信源失效。
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
import gzip
import io
import json
from pathlib import Path
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET


TIMEZONE = timezone(timedelta(hours=8))
TIMEOUT_SECONDS = 15
MAX_RESPONSE_BYTES = 2 * 1024 * 1024
MAX_WORKERS = 6
ATOM_NAMESPACE = "http://www.w3.org/2005/Atom"
CONTENT_NAMESPACE = "http://purl.org/rss/1.0/modules/content/"
USER_AGENT = (
    "AIHOTResearchFeedCheck/1.0 "
    "(+https://github.com/KKKKhazix/AIHOT; public-feed-only)"
)


def timestamp():
    """使用实测时钟，统一转换为明确的 +08:00 时间。"""
    return datetime.now(TIMEZONE).isoformat(timespec="seconds")


def local_name(tag):
    return tag.rsplit("}", 1)[-1]


def inspect_feed(payload):
    root = ET.fromstring(payload)
    root_name = local_name(root.tag).lower()
    if root.tag == "{" + ATOM_NAMESPACE + "}feed":
        feed_format = "Atom"
        items = root.findall("{" + ATOM_NAMESPACE + "}entry")
    elif root_name == "rss":
        feed_format = "RSS"
        channel = next((e for e in root if local_name(e.tag) == "channel"), None)
        if channel is None:
            raise ValueError("RSS XML 中未找到 channel 元素。")
        items = [e for e in channel if local_name(e.tag) == "item"]
    elif root_name == "rdf":
        feed_format = "RSS"
        items = [e for e in root if local_name(e.tag) == "item"]
    else:
        raise ValueError("响应是 XML，但根元素不是支持的 RSS/Atom Feed。")

    field_tags = {
        "description": "description",
        "content:encoded": "{" + CONTENT_NAMESPACE + "}encoded",
        "summary": "{" + ATOM_NAMESPACE + "}summary",
        "content": "{" + ATOM_NAMESPACE + "}content",
    }
    body_fields = {}
    for label, tag in field_tags.items():
        lengths = []
        for item in items:
            field = item.find(tag)
            if field is not None:
                lengths.append(len("".join(field.itertext()).strip()))
        body_fields[label] = {
            "entriesWithField": len(lengths),
            "entriesWithNonemptyField": sum(length > 0 for length in lengths),
            "maximumCharacters": max(lengths, default=0),
        }
    return feed_format, len(items), body_fields


def probe(source):
    started = time.monotonic()
    result = {
        "id": source["id"],
        "name": source["name"],
        "url": source["feedUrl"],
        "checkedAt": timestamp(),
        "status": "network_error",
        "httpStatus": None,
        "finalUrl": None,
        "format": None,
        "expectedFormat": source["format"],
        "itemCount": None,
        "bodyFields": {},
    }
    request = urllib.request.Request(
        source["feedUrl"],
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
            "Accept-Encoding": "identity",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            result["httpStatus"] = response.status
            result["finalUrl"] = response.geturl()
            result["contentType"] = response.headers.get("Content-Type", "")
            payload = response.read(MAX_RESPONSE_BYTES + 1)
            result["responseBytes"] = len(payload)
            if len(payload) > MAX_RESPONSE_BYTES:
                result["status"] = "response_too_large"
                result["error"] = "响应超过 2 MiB 检查上限，未继续下载或解析。"
                return result
            if response.headers.get("Content-Encoding", "").lower() == "gzip":
                with gzip.GzipFile(fileobj=io.BytesIO(payload)) as compressed:
                    payload = compressed.read(MAX_RESPONSE_BYTES + 1)
                if len(payload) > MAX_RESPONSE_BYTES:
                    result["status"] = "response_too_large"
                    result["error"] = "解压后的响应超过 2 MiB 检查上限，未解析。"
                    return result
                result["decodedBytes"] = len(payload)

        try:
            feed_format, count, fields = inspect_feed(payload)
        except (ET.ParseError, ValueError) as error:
            result["status"] = "parse_error"
            result["error"] = str(error)
            result["note"] = "当前响应未能解析为支持的 Feed，不能据此判断站点或信源已失效。"
        else:
            result.update(
                status="ok", format=feed_format, itemCount=count, bodyFields=fields,
                formatMatchesCatalog=feed_format == source["format"],
            )
    except urllib.error.HTTPError as error:
        result.update(
            status="http_error", httpStatus=error.code, finalUrl=error.geturl(),
            error="HTTP " + str(error.code) + ": " + str(error.reason),
            note="当前请求收到 HTTP 错误；访问策略、请求特征或环境均可能影响结果，不代表信源失效。",
        )
        error.close()
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        result["error"] = str(error)
        result["note"] = "当前环境请求失败；DNS、证书、网络或超时均可能影响结果，不代表信源失效。"
    finally:
        result["durationSeconds"] = round(time.monotonic() - started, 3)
    return result


def main():
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client-date", required=True, type=date.fromisoformat,
                        help="用户上下文中的日期 YYYY-MM-DD；与实测时钟分开记录。")
    parser.add_argument("--sources", type=Path, default=script_dir / "source-list.json")
    parser.add_argument("--output", type=Path, default=script_dir / "feed-verification.json")
    args = parser.parse_args()
    catalog = json.loads(args.sources.read_text(encoding="utf-8-sig"))
    sources = catalog["sources"]
    started_at = timestamp()
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        results = list(executor.map(probe, sources))
    checked_at = timestamp()
    matches_client_date = date.fromisoformat(checked_at[:10]) == args.client_date
    statuses = sorted({result["status"] for result in results})
    report = {
        "meta": {
            "commit": catalog["meta"]["commit"],
            "clientDate": args.client_date.isoformat(),
            "timezone": "Asia/Shanghai (+08:00)",
            "startedAt": started_at,
            "checkedAt": checked_at,
            "measuredTime": checked_at,
            "clientDateMatchesMeasuredDate": matches_client_date,
            "sourceCount": len(sources),
            "statusCounts": {status: sum(r["status"] == status for r in results) for status in statuses},
            "method": "Python 标准库 urllib + ElementTree；只访问公开 Feed，无模型或付费 API 调用。",
            "requestLimits": {
                "timeoutSeconds": TIMEOUT_SECONDS, "maxResponseBytes": MAX_RESPONSE_BYTES,
                "maxWorkers": MAX_WORKERS, "attemptsPerFeed": 1,
            },
            "timeNote": (
                "用户日期与实测的 +08:00 日期一致。" if matches_client_date else
                "用户日期与实测时钟日期不同；保留 clientDate 与实际 measuredTime，未伪造日期或时间。"
            ),
            "limitations": [
                "单次检查只说明此环境在记录时间收到的结果；失败不等于信源失效。",
                "itemCount 是当前响应中的条目数，不是该信源的历史总量。",
                "bodyFields 仅统计字段出现和字符数；可能包含 HTML，不能证明字段是完整正文，也不代表再发布许可。",
            ],
        },
        "results": results,
    }
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "checkedAt": checked_at,
                      "statusCounts": report["meta"]["statusCounts"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()

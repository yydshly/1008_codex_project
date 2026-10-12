"""原创离线核验：调用上游自检与真实 RSS 处理函数；不登录、不发布、不调用付费 API。"""
from pathlib import Path
import argparse
import ast
import contextlib
import importlib.util
import io
import json
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

ROOT = Path(__file__).resolve().parent
UP = ROOT / 'upstream'
results = []

def load(path):
    spec = importlib.util.spec_from_file_location('audit_rss', str(UP/path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

for name,path in [
 ('跨平台派发约束与路由','skills/openclaw/skill-cross-platform-publish/scripts/publish_dispatch.py'),
 ('排期队列导入、到期计算与状态','skills/openclaw/skill-publish-scheduler/scripts/publish_queue.py'),
 ('农历换算锚点','skills/openclaw/skill-event-calendar/scripts/lunar.py'),
 ('上游 RSS 原始自检（Windows）','skills/openclaw/skill-rss-aggregator/scripts/rss_digest.py')]:
    proc = subprocess.run([sys.executable,'-X','utf8',str(UP/path),'selftest'],capture_output=True,text=True,encoding='utf-8',timeout=45)
    detail=(proc.stdout+'\n'+proc.stderr).strip()[-4000:]
    detail=detail.replace(str(UP),'upstream').replace(str(Path.home()),'<USER_HOME>')
    results.append(dict(name=name,path=path,status='pass' if proc.returncode==0 else 'fail',exitCode=proc.returncode,detail=detail))

rss_path='skills/openclaw/skill-rss-aggregator/scripts/rss_digest.py'
rss=load(rss_path)
# 修改实验输入的 URI，不修改上游文件；加摘要命中、重复、过期和日期缺失样本。
with tempfile.TemporaryDirectory(prefix='easel-rss-audit-') as td:
    td=Path(td)
    recent=(datetime.now(timezone.utc)-timedelta(hours=1)).strftime('%a, %d %b %Y %H:%M:%S %z')
    feed=f'''<rss version="2.0"><channel><title>离线实验样本</title>
    <item><title>标题没有主题词</title><link>https://example.test/summary</link><description>AI 在摘要中</description><pubDate>{recent}</pubDate></item>
    <item><title>重复的 AI 链接</title><link>https://example.test/summary</link><description>duplicate</description><pubDate>{recent}</pubDate></item>
    <item><title>AI 旧文章</title><link>https://example.test/old</link><pubDate>Mon, 01 Jan 2001 10:00:00 +0000</pubDate></item>
    <item><title>AI 日期缺失</title><link>https://example.test/unknown</link></item>
    <item><title>美食</title><link>https://example.test/food</link><description>本周探店</description></item>
    </channel></rss>'''
    file=td/'feed.xml';file.write_text(feed,encoding='utf-8')
    out=td/'digest.json'
    log=io.StringIO()
    with contextlib.redirect_stdout(log):
        rss.cmd_fetch(argparse.Namespace(url=[file.as_uri()],feeds=None,keyword='AI,大模型',since=2,limit=10,output=str(out),format='json'))
    data=json.loads(out.read_text(encoding='utf-8'))
    assert [x['link'] for x in data['items']]==['https://example.test/summary','https://example.test/unknown']
    results.append(dict(name='RSS 正确 Windows URI＋摘要命中／时间窗／去重／缺日期保留',path=rss_path,status='pass',exitCode=0,
     detail='调用原 cmd_fetch，以 Path.as_uri() 提供本地 feed。5 条输入 → 2 条输出：摘要命中保留；重复链接、过期与无关键词排除；缺日期保留。原文件未修改。'))

news_path='skills/openclaw/skill-news-intelligence/scripts/fetch_news.py'
tree=ast.parse((UP/news_path).read_text(encoding='utf-8'))
funcs=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['filter_items','filter_by_hours']]
namespace=dict(re=re,datetime=datetime,timezone=timezone,timedelta=timedelta,parsedate_to_datetime=parsedate_to_datetime)
exec(compile(ast.Module(body=funcs,type_ignores=[]),news_path,'exec'),namespace)
items=[dict(title='AI 标题',summary=''),dict(title='无关键词标题',summary='AI 摘要'),dict(title='ai+ 工具',summary='')]
assert len(namespace['filter_items'](items,'AI'))==2
assert namespace['filter_items'](items,'AI+')[0]['title']=='ai+ 工具'
assert len(namespace['filter_by_hours']([dict(time='unknown'),dict(time='Mon, 01 Jan 2001 10:00:00 +0000')],24))==1
results.append(dict(name='资讯真实过滤函数：只匹配标题、转义关键词、日期 fail-open',path=news_path,status='pass',exitCode=0,
 detail='AST 原样提取 filter_items/filter_by_hours 并运行；AI 摘要命中不能使标题过滤通过；AI+ 被当成字面子串；无效日期保留、过期日期排除。未运行联网抓取器。'))

report={'date':datetime.now(timezone.utc).isoformat(),'platform':sys.platform,'python':sys.version.split()[0],
 'commit':'fb80ae6dd6fc26f5553efcb293ee6d93ef253f02','results':results,
 'scope':'已读取全部 114 个 SKILL 文档并核对核心调用路径。上述为离线实验；未实时探测各资讯／热榜源，未端到端运行全部技能，未调用付费模型，未登录账号或真实发布。',
 'rssFailure':'上游自检将 Windows 路径拼为 file://C:\\...，urlopen 拉取失败，导致后续断言失败。正确 Path.as_uri() 的原创实验通过；不能将该自检失败等同网络 RSS 核心过滤失败。'}
(ROOT.parent/'web/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for x in results:print(x['status'],x['name'])

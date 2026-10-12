'use client';

import { loadPlugin } from '@pascal-app/core';
import { Editor } from '@pascal-app/editor';
import { builtinPlugin } from '@pascal-app/nodes';
import { useViewer } from '@pascal-app/viewer';
import { Armchair, BookOpen, Boxes, ExternalLink, Hammer, Layers, RotateCcw, Settings2 } from 'lucide-react';
import { type ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import { BuildTools, DemoToolbar, FurniturePanel, focusEditorScene, ViewControlsPanel } from './editor-panels';

type SceneGraph = NonNullable<Awaited<ReturnType<NonNullable<ComponentProps<typeof Editor>['onLoad']>>>>;
type Example = 'house' | 'demo_1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const examples: Record<Example, { title: string; description: string }> = {
  house: { title: '住宅样板', description: '原创住宅布局 · Pascal 构件与真实家具' },
  demo_1: { title: '官方示例', description: '上游 demo_1 · 家具、门窗与双层构件展示' },
};
const emptyPanel = () => null;
const tabs = [
  { id: 'site', label: '场景', icon: <Layers size={23} />, mobileIcon: <Layers size={20} />, component: emptyPanel },
  { id: 'build', label: '建造', icon: <Hammer size={23} />, mobileIcon: <Hammer size={20} />, component: BuildTools },
  { id: 'items', label: '家具', icon: <Armchair size={23} />, mobileIcon: <Armchair size={20} />, component: FurniturePanel },
  { id: 'views', label: '视图', icon: <Boxes size={23} />, mobileIcon: <Boxes size={20} />, component: ViewControlsPanel },
  { id: 'settings', label: '设置', icon: <Settings2 size={23} />, mobileIcon: <Settings2 size={20} />, component: emptyPanel },
];
let pluginReady: Promise<void> | undefined;

function preparePlugin() {
  pluginReady ??= loadPlugin(builtinPlugin).then(() => undefined);
  return pluginReady;
}

function GuidePanel({ onClose }: { onClose: () => void }) {
  return <aside className="study-guide" aria-label="操作说明">
    <button className="guide-close" onClick={onClose} aria-label="关闭说明">×</button>
    <p className="guide-kicker">直接体验开源编辑器</p>
    <h2>从一个房间开始</h2>
    <ol>
      <li><strong>观察空间</strong><span>拖动旋转，滚轮缩放；上方可切换平面图与分屏。</span></li>
      <li><strong>编辑构件</strong><span>点击墙、门窗或家具，在原生属性面板修改尺寸和材质。</span></li>
      <li><strong>继续建造</strong><span>左侧选择楼层，进入「建造」或「家具」放置新构件。Esc 结束工具。</span></li>
      <li><strong>保存方案</strong><span>修改自动保存在当前浏览器。设置面板可导出模型或 JSON。</span></li>
    </ol>
    <p className="guide-source">住宅样板是本项目制作的场景数据。建模、开洞、渲染与编辑由 Pascal 原库提供。</p>
    <a href="https://editor.pascal.app/next" target="_blank" rel="noreferrer">查看官方 Next 预览 <ExternalLink size={13} /></a>
    <p className="guide-footnote">Next 的完整住宅体验尚未包含在开源发布版中。</p>
  </aside>;
}

export default function Showroom() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [example, setExample] = useState<Example>('house');
  const [revision, setRevision] = useState(0);
  const [guide, setGuide] = useState(false);
  const [saveStatus, setSaveStatus] = useState('加载场景');
  const [saved, setSaved] = useState(false);
  const freshScene = useRef(false);
  const frameTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const storageKey = `pascal-study-003:scene:${example}:v1`;

  useEffect(() => {
    let active = true;
    preparePlugin().then(() => active && setReady(true)).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : '编辑器初始化失败');
    });
    return () => { active = false; frameTimers.current.forEach(clearTimeout); };
  }, []);

  const onLoad = useCallback(async (): Promise<SceneGraph | null> => {
    const stored = freshScene.current ? null : localStorage.getItem(storageKey);
    freshScene.current = false;
    if (stored) {
      try { const scene = JSON.parse(stored); if (scene.nodes && scene.rootNodeIds) return scene; }
      catch { /* A damaged local draft must not block the reference example. */ }
    }
    const response = await fetch(`${basePath}/demos/${example}.json`);
    if (!response.ok) throw new Error(`示例加载失败（${response.status}）`);
    return response.json();
  }, [example, storageKey]);

  const onSave = useCallback(async (scene: SceneGraph) => {
    localStorage.setItem(storageKey, JSON.stringify(scene));
    setSaved(true);
  }, [storageKey]);

  const onLoaderChange = useCallback((visible: boolean) => {
    if (visible) { setSaveStatus('加载场景'); return; }
    setSaveStatus('可交互');
    useViewer.getState().setShading('rendered');
    useViewer.getState().setTextures(true);
    useViewer.getState().setWallMode('cutaway');
    frameTimers.current.forEach(clearTimeout);
    frameTimers.current = [setTimeout(focusEditorScene, 300), setTimeout(focusEditorScene, 1500)];
  }, []);

  function changeExample(next: Example) {
    setSaved(false);
    setExample(next);
    setSaveStatus('加载场景');
  }

  function resetExample() {
    freshScene.current = true;
    localStorage.removeItem(storageKey);
    setSaved(false);
    setRevision(value => value + 1);
  }

  if (error) return <main className="boot-screen"><h1>编辑器暂时无法打开</h1><p>{error}</p><button onClick={() => location.reload()}>重新加载</button></main>;
  if (!ready) return <main className="boot-screen"><span className="boot-mark">P</span><h1>Pascal 3D 建筑编辑器</h1><p>正在注册建筑构件…</p></main>;

  return <main className="showroom-root">
    <Editor
      key={`${example}:${revision}`}
      layoutVersion="v2"
      projectId={`study-003-${example}`}
      sidebarTabs={tabs}
      onLoad={onLoad}
      onSave={onSave}
      onLoaderChange={onLoaderChange}
      navbarSlot={<header className="study-header">
        <div className="study-brand"><span className="project-number">003</span><span>PASCAL <em>空间实验室</em></span></div>
        <div className="example-picker"><label htmlFor="example-select">示例</label><select id="example-select" value={example} onChange={event => changeExample(event.target.value as Example)}>{Object.entries(examples).map(([id, info]) => <option value={id} key={id}>{info.title}</option>)}</select></div>
        <span className="study-status">{saved ? '已保存到此浏览器' : saveStatus}</span>
        <div className="header-actions"><a href={`${basePath}/overview/`} aria-label="项目理解总结"><Layers size={14} /><span>项目理解</span></a><button onClick={resetExample} title="还原当前示例的初始场景" aria-label="还原示例"><RotateCcw size={14} /><span>还原示例</span></button><button aria-label="操作说明" aria-pressed={guide} onClick={() => setGuide(value => !value)}><BookOpen size={14} /><span>操作说明</span></button><a href="https://github.com/pascalorg/editor" target="_blank" rel="noreferrer" aria-label="Pascal 原仓库"><ExternalLink size={15} /></a></div>
      </header>}
      viewerToolbarLeft={<DemoToolbar />}
      viewerBanner={<div className="scene-caption"><span>{examples[example].description}</span><span>拖动旋转 · 滚轮缩放 · 单击编辑</span></div>}
    />
    {guide && <GuidePanel onClose={() => setGuide(false)} />}
  </main>;
}

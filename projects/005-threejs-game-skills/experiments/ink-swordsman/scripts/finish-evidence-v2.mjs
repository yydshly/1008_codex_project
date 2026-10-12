// Read completed real-input tests and declared GPU reports; do not synthesize evidence.
import {readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const assets=path.resolve(root,'../../assets'),upstream=path.resolve(root,'../../upstream');
const read=async name=>JSON.parse(await readFile(path.join(root,'artifacts',name),'utf8'));
const bot=await read('bot-playtest.json'),mobile=await read('mobile-input.json'),failure=await read('fail-retry.json'),manifest=await read('evidence.json');
const reports=[];for(const c of manifest.captures){const r=JSON.parse(await readFile(path.join(root,c.report),'utf8'));if(r.runId!==manifest.runId||!r.result.ok||!r.result.diagnostics.art.ready)throw new Error('报告不是当前成功画面');reports.push({capture:c,report:r,d:r.result.diagnostics});}
for(const [source,target]of [['pass-3/desktop-windup.png','ink-active.png'],['pass-3/mobile-active-play.png','ink-mobile.png'],['pass-3/desktop-counter.png','ink-counter.png'],['pass-3/desktop-late-run.png','ink-heavy.png'],['input-win.png','ink-won.png'],['pass-3/desktop-attack.png','ink-attack.png']])await copyFile(path.join(root,'artifacts',source),path.join(assets,target));
for(const [source,target]of [
  ['test-results/ink-真实键盘读势接招、反击，完成三轮；暂停冻结-desktop-chrome/video.webm',path.join(assets,'ink-input-run.webm')],
  ['test-results/ink-真实动作周期：移动停步、出剑收招、格挡、闪避-desktop-chrome/video.webm',path.join(root,'artifacts/motion-cycle.webm')],
]){const from=path.join(root,source);if((await stat(from)).size<10000)throw new Error('实际录屏未完成');await copyFile(from,target);}
const usage=await read('skill-usage.json');
for(const source of [
  'skills/threejs-aaa-graphics-builder/references/visual-scorecard.md',
  'skills/threejs-aaa-graphics-builder/references/shader-cookbook.md',
  'skills/threejs-image-generator/SKILL.md',
  'skills/threejs-game-director/references/asset-recovery.md',
]){if(!usage.loaded.some(r=>r.source===source))usage.loaded.push({skill:source.split('/')[1],source,sha256:createHash('sha256').update(await readFile(path.join(upstream,source))).digest('hex')});}
usage.notInvoked=['threejs-3d-generator','threejs-audio-generator'];
delete usage.externalApiCalls;usage.upstreamServiceCalls=0;
usage.assetGeneration={provider:'Codex built-in image_gen',calls:6,prompts:'../../assets/ink-art/prompts.json',runtimeFiles:['scene-v2.png','hero-atlas-v3.png','enemy-atlas-v3.png','hero-attack-v4.png'],upstreamGeminiApiInvoked:false,upstreamCredentialProbe:'未执行：使用内置图像工具，未推断 Gemini/Tripo/ElevenLabs 凭据是否存在'};
usage.scope='首版读取六个制作技能；第二版补读图像素材方法并使用内置生成工具；脚手架、画布脚本和证据检查实际执行。哈希和评分不证明模型开发收益。';
await writeFile(path.join(root,'artifacts/skill-usage.json'),JSON.stringify(usage,null,2)+'\n');
const maxCalls=Math.max(...reports.map(r=>r.d.renderer.calls));
const before=JSON.parse(await readFile(path.join(root,'artifacts/pass-1/desktop-active-play.json'),'utf8'));
const after=reports.find(r=>r.capture.mode==='desktop'&&r.capture.state==='active-play').report;
const totalPng=await Promise.all(usage.assetGeneration.runtimeFiles.map(async name=>(await stat(path.join(assets,'ink-art',name))).size));
const rows=reports.map(({capture:c,d})=>`| ${c.mode} / ${c.state} | ${d.canvas.clientWidth}×${d.canvas.clientHeight} | ${d.renderer.calls} | ${d.renderer.triangles} | ${d.renderer.geometries} | ${d.renderer.textures} |`).join('\n');
const md=`# 竹影问剑第二版实测证据

2026-10-09，Windows / Three.js 0.184 / Vite 8.3.4。研究上游 MIT 固定提交 8286774b22a2566bf894dbc825825c16921866af。用户反馈首版简单、风格不明显，第二版改为山水绘画、完整人物姿态、笔触特效与楷体题款。原三轮规则保持。

## 实际素材与修正

内置 image_gen 共六次生成或编辑，四份最终素材见 [生成来源](../../assets/ink-art/README.md)和[prompts.json](../../assets/ink-art/prompts.json)。读取上游 threejs-image-generator 的素材方法；未调用其 Gemini API，也未验证上游生成服务。两次图集仍出现跨格刀尖，最后将英雄出剑独立生成。PNG alpha、逐姿态实际 UV、脚底和身体尺寸已检查；透明底不等于任意图集布局可直接使用。

Game 等待四项 PNG ready 后允许开始；资源失败展示刷新提示，QA 状态钩子等待同一 ready。实际诊断包含加载 URL、尺寸、姿态和 UV。程序保留单一主循环，绘画背景在石台 y=0 对齐并适应手机画幅；轻微衣摆、落叶、笔触刀弧、格挡和受击读实际战斗状态。最终敌人击败后完成淡出，避免模拟停止时留下站立敌人。

独立检查实际八张状态图，未见串帧、黑框、裁剑、明显漂脚和手机裁切；发现底部文字对比弱后增加局部纸色衬底与 13 px 键位提示。主按钮 SVG 默认等比缩放导致底色压成线，已用独立可伸展墨刷底修正。

## 真实输入与动作

| 检查 | 实际结果 | 文件 |
| --- | --- | --- |
| 三阵通关与暂停 | 真实键盘，${bot.scoreAfter}/3，接招 ${bot.parries} 次，生命 ${bot.hp}/5，余时 ${bot.remaining.toFixed(2)} 秒，推进 ${bot.framesAdvanced} 渲染帧，错误 ${bot.errors.length} | bot-playtest.json、input-win.png、../../assets/ink-input-run.webm |
| 受击失败与重开 | 敌人自主靠近和攻击，模拟 ${failure.timeToFail.toFixed(2)} 秒后归零；重开生命 ${failure.retry.hp}、进度 ${failure.retry.score}、气息 ${failure.retry.energy} | fail-retry.json |
| 手机按钮 | 实际指针从 x=${mobile.before.x.toFixed(2)} 移至 ${mobile.after.x.toFixed(2)}；闪避气息 ${mobile.dodge.energy.toFixed(2)}，释放速度 ${mobile.releasedSpeed.toFixed(4)}；设置与无溢出通过 | mobile-input.json |
| 动作周期 | 实际按键记录待机、移动、停步、出剑、收招、格挡、闪避和恢复；持续模拟，无截图冻结或预置进度 | motion-cycle.json、motion/*.png、motion-cycle.webm |
| 战斗模拟 | 同一生产 Simulation 的十项机制检查通过 | simulation-tests.json |

最终输入套件四项通过、四项按设备跳过。动作周期图与通关录屏结合检查：出剑完整姿态覆盖 .13 秒命中时刻，中段刀弧衰减后收招；格挡和闪避使用不同姿态，脚底保持在石台附近。只有有限姿态切换和衣摆变形，步伐仍有离散切换，尚无连续骨骼动画。真实指针操作移动布局不等于真机多指触控。

## 最终 GPU 画布

runId ${manifest.runId}，${reports.length} 份当前报告均 PASS，四份实际 PNG 已加载；Intel UHD / ANGLE Direct3D11、softwareRendered=false，错误为零。状态截图预置并冻结，仅证明布局与素材；真实通关由上方按键证据证明。

| 状态 | CSS 视口 | Calls | Triangles | Geometry | Texture |
| --- | --- | --- | --- | --- | --- |
${rows}

所查状态最大 ${maxCalls} 次调用，默认预算均通过，不代表完整游戏上限或 FPS。桌面 active-play：调用 ${before.result.diagnostics.renderer.calls}→${after.result.diagnostics.renderer.calls}，三角形 ${before.result.diagnostics.renderer.triangles}→${after.result.diagnostics.renderer.triangles}；贴图 ${before.result.diagnostics.renderer.textures}→${after.result.diagnostics.renderer.textures}。图片熵 ${before.result.metrics.colorEntropyBits}→${after.result.metrics.colorEntropyBits}、对比 ${before.result.metrics.luminance.contrast}→${after.result.metrics.luminance.contrast}，只作辅助指标，不直接代表审美。

四份 PNG 合计 ${(totalPng.reduce((a,b)=>a+b,0)/1e6).toFixed(2)} MB；完整 RGBA 加 mipmap 约 34 MB，上传与网络成本上升。降低 draw call 不表示图像内存和首次加载同样降低。资源加载完后开局，哈希资源路径随独立构建与 ink/ 子路径复制；真实手机性能、Safari、音频听感和线上加载尚未验证。

## 视觉评分与边界

查看上游三张校准图，并比较第一版实际桌面/手机截图与最终声明状态集。此为内部人工评分，非自动结论。

| 类别 / 本游戏对应物 | 首版 | 第二版 | 依据 |
| --- | --- | --- | --- |
| 美术方向 | 1.5 | 3 | 干笔山水、衣袍、墨刷 UI、题款与朱砂贯穿 |
| 玩家 | 1 | 2.5 | 完整斗笠人物、独立攻防姿态、身体尺度与脚锚 |
| 敌人 | 1.5 | 2.5 | 竹间客、破阵者、墨影轮廓与蓄力不同 |
| 交互 / 反击机会 | 1.5 | 2 | 朱红蓄力与失衡反馈、强反击提示和过阵印记 |
| 环境 | 1.5 | 3 | 写意山水层次、近竹、石台与可读战斗走廊 |
| 材质 / 纹理 | 1 | 2.5 | 真实干笔细节、共享图集、显式资源与内存策略 |
| 光照 / 渲染 | 1.5 | 2 | 以绘画浓淡表达深度，人物清晰、接地墨影；有意无灯光 |
| 特效 / 动作 | 1.5 | 2 | 事件笔触、完整攻防和恢复；有限姿态限制保留 |
| UI | 2 | 2.5 | 楷体题款、朱砂印、笔刷状态与手机布局 |
| 性能证据 | 2 | 2.5 | 前后 GPU 统计、输入录像、资源加载和预算；未测真机 FPS |

平均 1.5→2.45，十项均 ≥2；修正后未发现评分表的自动失败项。这个分数不证明连续动画质量、好玩程度或技能相对同模型直接开发的收益。

TypeScript / Vite 独立构建通过。三份高价值画面建立并复跑截图基线，保护实际人物、攻击 UV 和后期 HUD；只在本机 Chromium 使用 0.6% 差异阈值，不承诺跨 GPU 像素相同。十一份 GPU 检查与上游 check_evidence 当前清单检查通过。v1、首轮 v2 问题截图保留，最终报告不重新标记历史图。

同一技能包继续提供工作顺序、素材检查和验收工具；这次风格变好来自具体绘画资产、相机与脚锚、动作状态和 UI 的实现。没有修改模型参数，没有进行同模型 A/B。模板的 MIT 署名保持；生成图与截图来源分别记录。
`;
await writeFile(path.join(root,'artifacts/final-evidence.md'),md);
console.log(`已汇总 ${reports.length} 份当前 GPU 报告、真实输入和两段录屏。maxCalls=${maxCalls}`);

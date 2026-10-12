// 汇总已完成的报告与录屏；不生成测试结果或合成截图。
import {readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const assets=path.resolve(root,'../../assets');
const read=async name=>JSON.parse(await readFile(path.join(root,'artifacts',name),'utf8'));
const bot=await read('bot-playtest.json'),mobile=await read('mobile-input.json'),failure=await read('fail-retry.json'),manifest=await read('evidence.json');
const rows=[];
for(const c of manifest.captures){const r=JSON.parse(await readFile(path.join(root,c.report),'utf8')),d=r.result.diagnostics;rows.push(`| ${c.mode} / ${c.state} | ${d.canvas.clientWidth}×${d.canvas.clientHeight} | ${d.renderer.calls} | ${d.renderer.triangles} | ${d.renderer.geometries} | ${d.renderer.textures} | ${d.canvas.dpr} |`);}
for(const [source,target]of [['pass-1/desktop-windup.png','ink-active.png'],['pass-1/mobile-active-play.png','ink-mobile.png'],['pass-1/desktop-counter.png','ink-counter.png'],['pass-1/desktop-late-run.png','ink-heavy.png'],['input-win.png','ink-won.png']])await copyFile(path.join(root,'artifacts',source),path.join(assets,target));
const video=path.join(root,'test-results/ink-真实键盘读势接招、反击，完成三轮；暂停冻结-desktop-chrome/video.webm');
if((await stat(video)).size<10000)throw new Error('录屏缺失');await copyFile(video,path.join(assets,'ink-input-run.webm'));
const md=`# 竹影问剑实测证据

2026-10-09，Windows / Node.js 22.15.0 / Three.js 0.184 / Vite 8.3.4。原库固定提交 8286774b22a2566bf894dbc825825c16921866af。制作时读取六个技能；实际脚手架、画布脚本与证据检查器已经运行，来源见 skill-usage.json。

## 实际输入与行为

| 项目 | 实际结果 | 证据 |
| --- | --- | --- |
| 真实键盘通关 | 从卷首开始，经暂停恢复，接招 ${bot.parries} 次、完成 ${bot.scoreAfter}/3；推进 ${bot.framesAdvanced} 帧，首阵模拟 ${bot.timeToFirstScore.toFixed(2)} 秒，余时 ${bot.remaining.toFixed(2)} 秒，生命 ${bot.hp}/5，错误 ${bot.errors.length} | bot-playtest.json、input-win.png、项目 assets/ink-input-run.webm |
| 实际受击与重开 | 不输入防御，敌人靠近并攻击，模拟 ${failure.timeToFail.toFixed(2)} 秒后生命归零；重开恢复生命 ${failure.retry.hp}、进度 ${failure.retry.score}、接招 ${failure.retry.parries}、气息 ${failure.retry.energy} | fail-retry.json |
| 手机按钮 | 指针按住右移，从 x=${mobile.before.x.toFixed(2)} 到 ${mobile.after.x.toFixed(2)}；闪避动作 ${mobile.dodge.action}，气息 ${mobile.dodge.energy.toFixed(2)}；释放后速度 ${mobile.releasedSpeed.toFixed(4)} | mobile-input.json、mobile-input.png |
| 暂停与设置 | 计时冻结、继续有效；静音与减少动态切换；菜单可滚动，内容无横向溢出 | ink.spec.ts、mobile-settings.png |
| 模拟检查 | 十项全部通过：响应 / 边界 / 暂停、早格挡受伤、格挡反击、蓄力防住攻击、闪避 / 冷却、气息、整轮通关、延迟接招失败、失败重开、超时 | simulation-tests.json |

通关机器人只读取诊断并发送真实键盘事件，没有调用 setState 或设置进度。手机使用真实鼠标指针操作移动布局，非真实触摸硬件。模拟测试运行生产同一个 Simulation；局部机制检查预置双方距离，只有超时分支预置剩余时间，整轮通关不注入进度。

第一轮浏览器全套 **3 passed、3 按设备跳过**，42.8 秒。镜头和美术修正后再次通过手机按钮及桌面真实通关，使用最终构建录屏。快节奏模拟接招六次通关，300ms 延迟接招版本在第一阵失败；此比较验证动作窗口影响结果，不是模型开发质量 A/B。

## 最终实际画布

runId ink-swordsman-pass-1，七份报告均 PASS。上游 check_evidence.py 对同一清单确认七项。GPU 为 Intel UHD / ANGLE Direct3D11，softwareRendered=false，控制台和页面错误为零。

| 状态 | CSS 视口 | Calls | Triangles | Geometry | Texture | DPR |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

报告读取当前 renderer.info，数字不是整个游戏绝对上界，也未测量 FPS。符合默认起点预算只证明所检查指标与画布契约。截图状态由 QA hook 设定并冻结，证明可见布局；实际通关另由输入记录证明。seed 42 是证据协议标记，玩法不使用随机数；纸纹和装饰使用独立固定种子。

人工查看蓄力、格挡、重斩、手机、实际胜利截图，并通过浏览器实际开始、闪避和暂停。首版手机人物偏小，近距离 halfWidth 改为 6.5 并按双方距离扩大；闲置刀改低位斜持，格挡光圈从主角胸前移至双方中点。图形 worker 的 900 帧有限矩阵与重复释放检查通过；CPU 场景统计不替代此处 GPU 报告。

## 构建、来源与边界

严格 TypeScript / Vite 生产构建通过，主 JS 约 572 kB、gzip 150 kB。新工程 npm audit fix 后审计为零漏洞，修正构建链；已有游戏依赖未改。事件音效 WebAudio 合成，没有外部付费 API；画面为 Three.js 程序化几何和贴图，没有人物动画资产、真实阴影或后处理。

完整子路径 ink/ 使用 base './' 和 ../ 返回研究页；与 starter/、play/ 保留独立入口。研究页提供实际录屏、制作过程和本报告；本机整合验证记录见 assets/ink-research.png 与 ink-integrated.png。

尚未验证同模型开发收益 A/B、真实手机 GPU / Safari / 多指触控、声音听感和在线部署。结论范围是：同一技能包能够实际用于另一种风格和玩法的小游戏，并取得行为、输入和画面证据。
`;
await writeFile(path.join(root,'artifacts/final-evidence.md'),md);console.log('已汇总实测记录、截图和完成的键盘录屏。');

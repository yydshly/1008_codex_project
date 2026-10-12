// 本实验的来源核对：记录制作时实际读取的文件，不把哈希当作执行证明。
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const experiment=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const upstream=path.resolve(experiment,'../../upstream');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const groups=[
  ['threejs-game-director',['SKILL.md','references/evidence-manifest.md']],
  ['threejs-gameplay-systems',['SKILL.md','references/game-feel.md','references/genre-design.md','references/physics-engine-selection.md']],
  ['threejs-aaa-graphics-builder',['SKILL.md','references/authoring-recipes.md','references/technical-art.md']],
  ['threejs-game-ui-designer',['SKILL.md','references/ui-patterns.md']],
  ['threejs-debug-profiler',['SKILL.md','references/debug-playbook.md']],
  ['threejs-qa-release',['SKILL.md','references/release-checks.md','references/playtest-bot.md','references/visual-test-harness.md']],
];
const loaded=[];
for(const [skill,files] of groups)for(const file of files){const source=`skills/${skill}/${file}`;loaded.push({skill,source,sha256:sha(await readFile(path.join(upstream,source)))});}
const retained=[];
for(const local of ['src/main.ts','src/core/Loop.ts','src/core/Renderer.ts','src/utils/random.ts','scripts/inspect-threejs-canvas.mjs']){
  const source=`skills/threejs-gameplay-systems/assets/threejs-vite-game/${local}`;
  const sourceSha=sha(await readFile(path.join(upstream,source))),localSha=sha(await readFile(path.join(experiment,local)));
  if(sourceSha!==localSha)throw new Error(`保留文件发生变更，应更新改动说明：${local}`);
  retained.push({local,source,sha256:localSha,modified:false});
}
const invoked=['skills/threejs-gameplay-systems/scripts/create_threejs_game.py','skills/threejs-game-director/scripts/check_evidence.py'];
const executed=[];
for(const source of invoked)executed.push({source,sha256:sha(await readFile(path.join(upstream,source)))});
await writeFile(path.join(experiment,'artifacts/skill-usage.json'),JSON.stringify({date:'2026-10-09',repo:'https://github.com/majidmanzarpour/threejs-game-skills',commit:'8286774b22a2566bf894dbc825825c16921866af',license:'MIT / Majid Manzarpour',scope:'制作时实际读取六个技能；脚手架、画布检查与证据检查实际执行；哈希核对证明来源一致，不单独证明遵循质量或净收益',loaded,retained,executed,newOrRewritten:['Game','Simulation','level','contracts','HarborWorld','HarborUI','HarborInput','HarborAudio','index.html','styles.css','harbor.spec.ts','test-simulation.mjs'],notInvoked:['threejs-3d-generator','threejs-image-generator','threejs-audio-generator'],externalApiCalls:0},null,2)+'\n');
console.log(`来源已记录：${groups.length} 个技能、${loaded.length} 份读取文件、${retained.length} 个逐字保留模块。`);

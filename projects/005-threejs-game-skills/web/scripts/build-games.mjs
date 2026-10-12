// 用每个游戏自己的锁定依赖进行独立构建，不把依赖提升到仓库根。
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const project=fileURLToPath(new URL('../../',import.meta.url));
for(const game of ['scaffold','storm-harbor','ink-swordsman']){
  const directory=path.join(project,'experiments',game);
  for(const [script,args] of [['node_modules/typescript/bin/tsc',[]],['node_modules/vite/bin/vite.js',['build']]]){
    await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[path.join(directory,script),...args],{cwd:directory,stdio:'inherit',windowsHide:true});
      child.on('error',reject);
      child.on('exit',code=>code===0?resolve():reject(new Error(`${game} 独立构建失败 (${code})`)));
    });
  }
}

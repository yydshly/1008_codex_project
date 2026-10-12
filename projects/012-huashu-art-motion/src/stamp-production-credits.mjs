// 补充独立MP4内的许可链接与音乐剪辑说明；流复制，核对音视频内容SHA不变。
import {readFile,writeFile,rename,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../assets/production/',import.meta.url));
const ffmpeg=process.env.FFMPEG_BIN||'D:/26project/26audio_and_video_project/ffmpeg-n6.1.3-win64-gpl-shared-6.1/bin/ffmpeg.exe';
const credit='Music: Dreamer by Kevin MacLeod (incompetech.com). CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Adapted: 20-50s excerpt, normalized loudness and fades. New visual scenes and compositing by this research project.';
const run=args=>execFileSync(ffmpeg,args,{windowsHide:true,encoding:'utf8'});
const hash=(file,stream)=>run(['-loglevel','error','-i',file,'-map','0:'+stream+':0','-c','copy','-f','hash','-hash','sha256','pipe:1']).trim();
const reportFile=path.join(out,'render-report.json'),report=JSON.parse(await readFile(reportFile,'utf8'));
for(const s of report.results){
  const file=path.join(out,s.id+'.mp4'),tmp=path.join(out,s.id+'.credited.mp4'),before={video:hash(file,'v'),audio:hash(file,'a')};
  run(['-y','-loglevel','error','-i',file,'-map','0','-c','copy','-metadata','title='+s.title,'-metadata','comment='+credit,'-movflags','+faststart',tmp]);
  const after={video:hash(tmp,'v'),audio:hash(tmp,'a')};if(JSON.stringify(before)!==JSON.stringify(after))throw new Error(s.id+'音视频流发生变化');
  await rename(tmp,file);s.bytes=(await stat(file)).size;s.attribution=credit;s.creditsRemuxStreamHashes=after;
}
await writeFile(reportFile,JSON.stringify(report,null,2)+'\n');console.log('七片音乐许可元数据已补全，音视频流SHA核对保持不变。');

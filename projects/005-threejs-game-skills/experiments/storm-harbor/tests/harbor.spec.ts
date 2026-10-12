import {expect,test,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

// 从上游 bot-playtest.template.ts 的输入/进度/软锁/错误指标契约改写。
const artifact=(name:string)=>path.join(process.cwd(),'artifacts',name);
async function sample(page:Page){return page.evaluate(()=>{const d=window.__THREE_GAME_DIAGNOSTICS__;if(!d)throw new Error('QA diagnostics missing');return d;});}
async function release(page:Page){for(const key of ['KeyW','KeyA','KeyS','KeyD'])await page.keyboard.up(key);}
async function start(page:Page){await page.goto('/?qa=1');await page.getByRole('button',{name:/开始救援/}).click();await expect(page.locator('#app')).toHaveAttribute('data-mode','playing');}
async function drive(page:Page,x:number,z:number,metrics:{distance:number;softlocks:number;firstScore:number}){
  let prev=await sample(page);let stuck=0;
  for(let i=0;i<200;i++){
    const d=await sample(page);if(d.complete){await release(page);return;}expect(d.fail,'正常路线提前失败').toBeFalsy();
    const dx=x-d.player.position.x,dz=z-d.player.position.z;if(Math.hypot(dx,dz)<.8){await release(page);return;}
    const keys=new Set<string>();if(Math.abs(dx)>.45)keys.add(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>.45)keys.add(dz>0?'KeyS':'KeyW');
    for(const key of ['KeyW','KeyA','KeyS','KeyD']){if(keys.has(key))await page.keyboard.down(key);else await page.keyboard.up(key);}
    if(i%65===0)await page.keyboard.press('Space');await page.waitForTimeout(120);
    const now=await sample(page),moved=Math.hypot(now.player.position.x-prev.player.position.x,now.player.position.z-prev.player.position.z);metrics.distance+=moved;
    if(moved<.06&&now.frame>prev.frame)stuck++;else stuck=0;if(stuck===10)metrics.softlocks++;
    if(now.score>0&&metrics.firstScore<0)metrics.firstScore=now.elapsed;prev=now;
  }
  const last=await sample(page);const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,visibility:document.visibilityState}));
  await writeFile(artifact('route-failure.json'),JSON.stringify({target:{x,z},last,focus,metrics},null,2));
  throw new Error(`航线目标无法到达：${x},${z}; ${JSON.stringify({player:last.player,mode:last.mode,elapsed:last.elapsed,focus})}`);
}
test('真实键盘完成三次往返，暂停恢复和六枚交付',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chrome','此项核验桌面键盘完整航线');test.setTimeout(150000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await start(page);const initial=await sample(page);
  await page.keyboard.press('Escape');await expect(page.locator('#app')).toHaveAttribute('data-mode','paused');const paused=(await sample(page)).remaining;await page.waitForTimeout(350);expect((await sample(page)).remaining).toBe(paused);
  await page.getByRole('button',{name:/继续出航/}).click();
  const metrics={distance:0,softlocks:0,firstScore:-1};
  for(const [x,z] of [[-16,2],[-15,-6],[-17,10],[-17,-7],[1,-9],[15,-7],[8,-7],[8,9],[-17,10],[0,9],[9,8],[-17,10]])await drive(page,x,z,metrics);
  await expect(page.locator('#app')).toHaveAttribute('data-mode','won');const final=await sample(page);
  expect(final.score).toBe(6);expect(final.frame-initial.frame).toBeGreaterThan(100);expect(metrics.distance).toBeGreaterThan(120);expect(metrics.softlocks).toBe(0);expect(errors).toEqual([]);
  await mkdir(artifact(''),{recursive:true});await writeFile(artifact('bot-playtest.json'),JSON.stringify({seed:42,input:'real keyboard; no progression hooks',framesAdvanced:final.frame-initial.frame,scoreBefore:initial.score,scoreAfter:final.score,complete:final.complete,distanceTravelled:Number(metrics.distance.toFixed(2)),timeToFirstScore:metrics.firstScore,softlockWindows:metrics.softlocks,remaining:final.remaining,hull:final.hull,errors},null,2));
  await page.screenshot({path:artifact('input-win.png'),animations:'disabled',timeout:10000});
  // Playwright owns context teardown. Export its completed video after the CLI
  // finishes; waiting on saveAs here can deadlock against that teardown.
});
test('追撞确实失败，按钮重开清理状态',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chrome','此项核验桌面危险与重开');test.setTimeout(65000);await start(page);
  const initial=await sample(page);
  for(let i=0;i<350;i++){
    const d=await sample(page);if(d.fail)break;const h=d.hazards![0],p=d.player.position,dx=h.x-p.x,dz=h.z-p.z;
    for(const key of ['KeyW','KeyA','KeyS','KeyD']){const held=key===(dx>0?'KeyD':'KeyA')||key===(dz>0?'KeyS':'KeyW');if(held)await page.keyboard.down(key);else await page.keyboard.up(key);}
    await page.waitForTimeout(120);
  }
  await release(page);await expect(page.locator('#app')).toHaveAttribute('data-mode','lost');const failed=await sample(page);expect(failed.hull).toBe(0);await page.getByRole('button',{name:/再次出航/}).click();const retry=await sample(page);expect(retry.hull).toBe(4);expect(retry.score).toBe(0);expect(retry.cargo).toBe(0);expect(retry.remaining).toBeGreaterThan(149);
  await writeFile(artifact('fail-retry.json'),JSON.stringify({input:'追踪危险的真实键盘输入',timeToFail:failed.elapsed-initial.elapsed,failedHull:failed.hull,retryHull:retry.hull,retryScore:retry.score,retryRemaining:retry.remaining},null,2));
});
test('手机视口摇杆、释放与设置产生真实状态变化',async({page},info)=>{
  test.skip(info.project.name!=='mobile-chrome','此项核验手机视口指针摇杆');await start(page);
  const before=await sample(page),box=await page.locator('#harbor-stick').boundingBox();expect(box).not.toBeNull();
  const center={x:box!.x+box!.width/2,y:box!.y+box!.height/2};await page.mouse.move(center.x,center.y);await page.mouse.down();await page.mouse.move(center.x,center.y-30);await page.waitForTimeout(1500);await page.mouse.up();await page.waitForTimeout(350);const after=await sample(page);
  expect(after.player.position.z).toBeLessThan(before.player.position.z-4);expect(after.cargo).toBeGreaterThan(0);await page.waitForTimeout(450);expect((await sample(page)).player.speed).toBeLessThan(.2);
  await page.getByRole('button',{name:'暂停游戏',exact:true}).click();await page.getByRole('button',{name:/音效/}).click();await expect(page.getByRole('button',{name:/音效/})).toContainText('静音');await page.getByRole('button',{name:/减少动态/}).click();await expect(page.getByRole('button',{name:/减少动态/})).toContainText('开启');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:artifact('mobile-settings.png')});await page.getByRole('button',{name:/继续出航/}).click();await page.screenshot({path:artifact('mobile-input.png')});await writeFile(artifact('mobile-input.json'),JSON.stringify({viewport:'iPhone 13 Chromium simulation',input:'真实鼠标指针拖动手机布局摇杆，非真实触摸硬件',before:before.player.position,after:after.player.position,cargo:after.cargo,releasedSpeed:(await sample(page)).player.speed},null,2));
});

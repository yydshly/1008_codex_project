import {test,expect,type Page} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const artifact=(name:string)=>path.join(process.cwd(),'artifacts',name);
async function sample(page:Page){return page.evaluate(()=>{const d=window.__THREE_GAME_DIAGNOSTICS__;if(!d)throw new Error('missing diagnostics');return d;});}
async function start(page:Page){await page.goto('/?qa=1');await page.getByRole('button',{name:/执剑入场/}).click();await expect(page.locator('#app')).toHaveAttribute('data-mode','playing');expect((await sample(page)).art?.ready).toBe(true);expect((await sample(page)).art?.loaded.length).toBe(4);}
async function write(name:string,data:unknown){await mkdir(artifact(''),{recursive:true});await writeFile(artifact(name),JSON.stringify(data,null,2)+'\n');}
test('真实键盘读势接招、反击，完成三轮；暂停冻结',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chrome');test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await start(page);const initial=await sample(page);
  await page.keyboard.press('Escape');await expect(page.locator('#app')).toHaveAttribute('data-mode','paused');const t=(await sample(page)).remaining;await page.waitForTimeout(300);expect((await sample(page)).remaining).toBe(t);await page.getByRole('button',{name:/继续交锋/}).click();
  let lastParry=-1;let firstScore=-1;const rounds:number[]=[];let moved=0;let prev=await sample(page);
  for(let i=0;i<2200;i++){
    const d=await sample(page);if(d.complete)break;expect(d.fail,JSON.stringify(d)).toBeFalsy();
    const e=d.enemy!,gap=e.x-d.player.position.x;
    const move=d.action==='idle'&&e.phase==='approach'&&Math.abs(gap)>2.6;
    for(const key of ['KeyD','KeyA']){if(move&&key===(gap>0?'KeyD':'KeyA'))await page.keyboard.down(key);else await page.keyboard.up(key);}
    if(d.action==='idle'&&e.phase==='windup'&&e.duration-e.age<.16&&e.duration-e.age>.035)await page.keyboard.press('KeyK');
    if(d.action==='idle'&&e.phase==='stagger'&&d.parries!==lastParry){lastParry=d.parries!;await page.keyboard.press('KeyJ');}
    if(d.score>0&&firstScore<0)firstScore=d.elapsed;
    if(!rounds.includes(d.stage!))rounds.push(d.stage!);
    moved+=Math.abs(d.player.position.x-prev.player.position.x);prev=d;
    await page.waitForTimeout(20);
  }
  await page.keyboard.up('KeyD');await page.keyboard.up('KeyA');await expect(page.locator('#app')).toHaveAttribute('data-mode','won');
  const final=await sample(page);expect(final.score).toBe(3);expect(final.parries).toBeGreaterThanOrEqual(6);expect(final.hp).toBeGreaterThan(0);expect(errors).toEqual([]);
  await write('bot-playtest.json',{input:'真实键盘事件；只读诊断；未调用状态设置或进度 hook',framesAdvanced:final.frame-initial.frame,scoreBefore:initial.score,scoreAfter:final.score,complete:final.complete,rounds,parries:final.parries,hp:final.hp,distanceTravelled:moved,timeToFirstScore:firstScore,remaining:final.remaining,art:final.art,errors});
  await page.screenshot({path:artifact('input-win.png')});
});
test('实际待机受击失败，重开恢复生命、进度与气息',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chrome');test.setTimeout(60000);await start(page);
  await expect(page.locator('#app')).toHaveAttribute('data-mode','lost',{timeout:50000});const fail=await sample(page);expect(fail.hp).toBe(0);
  await page.getByRole('button',{name:/再战一回/}).click();const retry=await sample(page);expect(retry.hp).toBe(5);expect(retry.score).toBe(0);expect(retry.parries).toBe(0);expect(retry.energy).toBeGreaterThan(99);expect(retry.remaining).toBeGreaterThan(179);
  await write('fail-retry.json',{input:'从卷首实际开始；不输入防御，敌人自主靠近、攻击',timeToFail:fail.elapsed,failedHp:fail.hp,retry:{hp:retry.hp,score:retry.score,parries:retry.parries,energy:retry.energy,remaining:retry.remaining}});
});
test('手机布局方向按住与释放、闪避、设置和无横向溢出',async({page},info)=>{
  test.skip(info.project.name!=='mobile-chrome');await start(page);const before=await sample(page);
  const box=await page.locator('#ink-right').boundingBox();expect(box).not.toBeNull();await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();await page.waitForTimeout(450);await page.mouse.up();await page.waitForTimeout(200);const moved=await sample(page);expect(moved.player.position.x).toBeGreaterThan(before.player.position.x+1);
  await page.locator('#ink-dodge').click();await page.waitForTimeout(100);const dodge=await sample(page);expect(dodge.action).toBe('dodge');expect(dodge.energy).toBeLessThan(80);await page.waitForTimeout(550);const released=await sample(page);expect(released.player.speed).toBeLessThan(.25);
  await page.getByRole('button',{name:'暂停游戏',exact:true}).click();await page.getByRole('button',{name:/音效/}).click();await expect(page.locator('#ink-mute')).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:/减少动态/}).click();await expect(page.locator('#ink-motion')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:artifact('mobile-settings.png')});await page.getByRole('button',{name:/继续交锋/}).click();await page.screenshot({path:artifact('mobile-input.png')});
  await write('mobile-input.json',{viewport:'iPhone 13 / Chromium 模拟',input:'真实鼠标指针操作方向和动作按钮；未验证真实触摸硬件',before:before.player.position,after:moved.player.position,dodge:{action:dodge.action,energy:dodge.energy},releasedSpeed:released.player.speed,settings:{muted:true,reducedMotion:true},overflow:false});
});

test('真实动作周期：移动停步、出剑收招、格挡、闪避',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chrome');test.setTimeout(45000);await start(page);
  const samples:unknown[]=[];await mkdir(artifact('motion'),{recursive:true});
  const capture=async(name:string)=>{const d=await sample(page);samples.push({name,frame:d.frame,time:d.elapsed,action:d.action,x:d.player.position.x,speed:d.player.speed,art:d.art});await page.screenshot({path:artifact(`motion/${name}.png`)});};
  await capture('idle');await page.keyboard.down('KeyD');await page.waitForTimeout(350);await capture('walk');await page.keyboard.up('KeyD');
  await expect.poll(async()=> (await sample(page)).player.speed,{intervals:[30]}).toBeLessThan(.25);await capture('stop');
  await page.keyboard.press('KeyJ');await expect.poll(async()=> (await sample(page)).art?.heroPose,{intervals:[15]}).toBe('attack');await capture('attack');
  await expect.poll(async()=> (await sample(page)).action,{intervals:[30]}).toBe('idle');await capture('attack-recover');
  await page.keyboard.press('KeyK');await expect.poll(async()=> (await sample(page)).action,{intervals:[15]}).toBe('parry');await capture('parry');
  await expect.poll(async()=> (await sample(page)).action,{intervals:[30]}).toBe('idle');
  await page.keyboard.press('KeyL');await expect.poll(async()=> (await sample(page)).action,{intervals:[15]}).toBe('dodge');await capture('dodge');
  await expect.poll(async()=> (await sample(page)).action,{intervals:[30]}).toBe('idle');await capture('dodge-recover');
  await write('motion-cycle.json',{input:'真实键盘与只读诊断；没有暂停模拟或设置状态',samples});
});

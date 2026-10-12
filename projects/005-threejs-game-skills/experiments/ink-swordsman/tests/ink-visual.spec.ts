import {test,expect} from '@playwright/test';

// Current reviewed art becomes a reproducible baseline for asset loading,
// UV selection and layout. These frozen captures do not prove gameplay.
for(const state of ['active-play','attack','late-run']){
  test(`绘画素材视觉基线 ${state}`,async({page},info)=>{
    test.skip(info.project.name!=='desktop-chrome');
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/?qa=1');
    await page.evaluate(async state=>{
      const hooks=window.__THREE_GAME_TEST_HOOKS__!;
      await hooks.setState(state);await hooks.setPausedForScreenshot(true);await hooks.setReducedMotion(true);
      await document.fonts.ready;
    },state);
    await expect.poll(()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__?.art?.ready)).toBe(true);
    await expect(page).toHaveScreenshot(`${state}.png`,{animations:'disabled',maxDiffPixelRatio:.006});
    expect(errors).toEqual([]);
  });
}

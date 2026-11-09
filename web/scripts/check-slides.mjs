import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../slides-ready');
const server=createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.match(/^\/nested\/(slides|index|original)\.html$/u)?.[1];
  try{if(!name)throw new Error('Missing page');const data=await readFile(resolve(root,name+'.html'));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(data);}
  catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}/nested/`;
let browser;
const errors=[],failed=[],network=[];
try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url().slice(0,150)));page.on('request',r=>{if(/^https?:/u.test(r.url()))network.push(r.url());});
  await page.goto(base+'slides.html');await page.locator('body.deck-ready').waitFor();await page.locator('body.seeds-ready').waitFor();
  await context.setOffline(true);
  async function jump(number){
    await page.getByRole('button',{name:'Mục lục',exact:true}).click();await page.locator(`[data-jump="${number-1}"]`).click();await page.locator('#presentation:not([aria-busy])').waitFor();
    await expect(page.locator(`.slide[data-slide="${number-1}"]`)).toBeVisible();
  }
  for(let n=2;n<=12;n++)await jump(n);
  await expect(page.getByRole('button',{name:'Slide tiếp theo',exact:true})).toBeDisabled();
  await jump(4);await page.locator('[data-topic="1"]').click();await expect(page.locator('#teacher-example')).toContainText('màu sắc');
  await jump(5);await page.locator('[data-seed-kind="2"]').click();await expect(page.locator('#seed-example')).toContainText('Em rất yêu');await expect(page.locator('#presentation-scene canvas')).toBeVisible();
  await jump(7);await page.locator('#assemble-demo').click();await expect(page.locator('#paragraph-target')).toContainText('Những chiếc lá');await page.locator('#assemble-demo').click();await expect(page.locator('#sentence-pool .sentence-piece')).toHaveCount(3);
  await jump(8);await page.locator('[data-answer="e"]').click();await expect(page.locator('#apply-demo')).toBeHidden();
  for(const answer of ['E','xinh xắn','.']){await page.locator(`[data-answer="${answer}"]`).click();await page.locator('#apply-demo').click();}
  await expect(page.locator('.demo-source')).toHaveText('Em có một chiếc cặp xinh xắn.');
  await page.getByRole('button',{name:'Ghi chú',exact:true}).click();await expect(page.locator('#notes-text')).toContainText('không thay thế giáo viên');await page.keyboard.press('Escape');
  await page.keyboard.press('Home');await page.locator('#presentation:not([aria-busy])').waitFor();await expect(page.locator('#counter')).toHaveText('01 / 12');
  await page.keyboard.press('ArrowRight');await page.locator('#presentation:not([aria-busy])').waitFor();await expect(page.locator('#counter')).toHaveText('02 / 12');
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  // Motion is tested separately from the reduced-motion content checks.
  await page.setViewportSize({width:1440,height:960});await page.getByRole('button',{name:'Giảm chuyển động',exact:true}).click();
  for(const n of [3,4,5])await jump(n);
  await expect(page.locator('.transition-layer')).toBeHidden();
  await context.setOffline(false);await jump(12);
  const popupPromise=page.waitForEvent('popup');await page.getByRole('link',{name:'Mở web Mầm chữ',exact:true}).click();const app=await popupPromise;
  await app.locator('body.seeds-ready').waitFor();await expect(app.locator('.hero-content')).toContainText('Gieo một ý tưởng');await app.close();
  const fallback=await context.newPage();
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/u.test(type))return null;return original.call(this,type,...args);};});
  await fallback.goto(base+'slides.html');await fallback.locator('body.deck-ready').waitFor();await expect(fallback.locator('body')).toHaveClass(/webgl-unavailable/u);await expect(fallback.locator('.slide:not([hidden]) .scene-fallback')).toBeVisible();
  expect(errors).toEqual([]);expect(failed).toEqual([]);expect(network.every(url=>url===base+'slides.html')).toBeTruthy();
  console.log(JSON.stringify({status:'passed',slides:12,packaging:'nested static HTTP, then offline',demos:'topics/seeds/compose/check-correct-apply',navigation:'overview/notes/keyboard/mobile',motion:'slats/doors/curtain',webGLFallback:'passed',appLink:'passed',externalAssetRequests:0,errors,failed}));
}finally{await browser?.close();await new Promise(done=>server.close(done));}

import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..','html-ready');
const files=new Map();
for(const name of ['index.html','original.html']){
  const html=await readFile(resolve(root,name),'utf8');
  const start=html.indexOf('<script>')+8,end=html.indexOf('</script>',start);
  if(start<8||end<start)throw new Error(`Missing inline script: ${name}`);
  new Script(html.slice(start,end));
  files.set(`/nested/${name}`,html);
}
const server=createServer((request,response)=>{
  const body=files.get(new URL(request.url,'http://localhost').pathname);
  response.writeHead(body?200:404,{'Content-Type':'text/html; charset=utf-8'});
  response.end(body||'Not found');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=`http://127.0.0.1:${server.address().port}/nested/`;
let browser;
const errors=[],failed=[],network=[];
try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const watch=page=>{
    page.on('pageerror',error=>errors.push(error.message.slice(0,500)));
    page.on('requestfailed',request=>failed.push({url:request.url().slice(0,150),error:request.failure()?.errorText}));
    page.on('request',request=>{if(/^https?:/u.test(request.url()))network.push(request.url());});
  };
  const page=await context.newPage();watch(page);
  await page.goto(address+'index.html');await page.locator('body.seeds-ready').waitFor({timeout:45000});
  await context.setOffline(true);
  await page.getByRole('button',{name:'Bắt đầu gieo ý tưởng',exact:true}).click();
  await page.getByLabel('Câu trả lời của em',{exact:true}).fill('Em rất yêu bà.');
  await page.getByRole('button',{name:'Gieo hạt câu văn',exact:true}).click();await expect(page.locator('.saved-seed')).toHaveCount(1);
  await page.getByRole('link',{name:'Kể cho bạn nghe',exact:true}).click();
  await page.getByRole('button',{name:'Vai tiếp theo'}).click();await expect(page.locator('.talk-card h2')).toHaveText('Lắng nghe bằng cả trái tim');
  await page.getByRole('button',{name:'Chúng mình đã chia sẻ',exact:true}).click();
  await page.getByRole('button',{name:'Ghép các câu của em',exact:true}).click();await expect(page.getByLabel('Đoạn văn của em',{exact:true})).toHaveValue('Em rất yêu bà.');
  await page.getByLabel('Đoạn văn của em',{exact:true}).fill('em có chiếc cặp xinh sắn');
  await page.getByRole('button',{name:'Kiểm tra đoạn văn',exact:true}).click();await expect(page.locator('.review-summary')).toContainText('3 chỗ');
  await page.getByLabel('Em viết lại ở đây',{exact:true}).fill('E');await page.getByRole('button',{name:'Thử trả lời',exact:true}).click();
  await page.getByRole('button',{name:'Dùng phần sửa này trong bài',exact:true}).click();await expect(page.locator('.highlighted-paragraph')).toContainText('Em có chiếc cặp');
  await page.getByRole('button',{name:'Lưu vào vườn của em',exact:true}).click();await expect(page.locator('.garden-panorama')).toBeVisible();
  await context.setOffline(false);await page.reload();await expect(page.locator('.garden-paragraph')).toContainText('Em có chiếc cặp');
  const original=await context.newPage();watch(original);
  await original.goto(address+'original.html');await original.locator('body.scene-ready').waitFor({timeout:60000});
  await expect(original.locator('body')).not.toHaveClass(/scene-fallback/u);await expect(original.locator('#shoe-stage canvas')).toBeVisible();
  await context.setOffline(true);
  await original.getByRole('link',{name:'Everyday layers',exact:true}).click();await expect(original.locator('.hanging-item')).toHaveCount(4);
  await original.getByRole('link',{name:'Shop the look',exact:true}).click();await expect(original.locator('.look-figure')).toHaveCount(4);
  await context.setOffline(false);await page.setViewportSize({width:390,height:844});await page.getByRole('link',{name:'Chọn đề bài',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);expect(failed).toEqual([]);
  expect(network.every(url=>url===address+'index.html'||url===address+'original.html')).toBeTruthy();
  console.log(JSON.stringify({status:'passed',mode:'static HTTP in nested directory, then offline',errors,failed,documentRequests:network.length,externalAssetRequests:0,learning:'seed/talk/write/check/correct/garden/reload/mobile',original:'real GLB/hanging garments/lookbook',fileProtocol:'not tested: managed Chromium blocks file:// navigation'}));
}finally{
  await browser?.close();await new Promise(resolve=>server.close(resolve));
}

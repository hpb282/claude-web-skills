import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test.beforeEach(async({page})=>{await page.goto('/');await page.locator('body.seeds-ready').waitFor();});
async function ideas(page){await page.getByRole('link',{name:'Gieo ý tưởng',exact:true}).click();}
async function seed(page,text,kind){if(kind)await page.getByRole('radio',{name:kind,exact:true}).check();await page.getByLabel('Câu trả lời của em',{exact:true}).fill(text);await page.getByRole('button',{name:'Gieo hạt câu văn',exact:true}).click();}

test('original 3D engine renders three seed kinds and rotation responds to controls',async({page})=>{
  await expect(page).toHaveTitle('Mầm chữ — Mỗi câu văn, một hạt mầm');
  await expect(page.locator('#seed-stage canvas')).toBeVisible();
  await page.getByRole('button',{name:'Tạm dừng hạt chuyển động'}).click();await page.waitForTimeout(1200);
  const before=await page.locator('#seed-stage canvas').screenshot();
  await page.getByRole('button',{name:'Xoay hạt sang phải'}).click();await page.waitForTimeout(750);
  const after=await page.locator('#seed-stage canvas').screenshot();expect(before.equals(after)).toBeFalsy();
  await page.locator('[data-kind="feel"]').click();await expect(page.locator('[data-kind="feel"]')).toHaveAttribute('aria-pressed','true');
  await page.reload();await expect(page.locator('[data-kind="feel"]')).toHaveAttribute('aria-pressed','true');
});

test('teacher can create a custom prompt, generate and edit questions and hints',async({page})=>{
  await page.getByRole('button',{name:'Góc giáo viên',exact:true}).click();
  await page.getByLabel('Tên bài học',{exact:true}).fill('Cây phượng sân trường');
  await page.getByLabel('Đề bài',{exact:true}).fill('Viết một đoạn văn tả cây phượng ở sân trường và nêu cảm nhận của em.');
  await page.getByRole('button',{name:'Tạo câu hỏi & từ gợi ý theo đề',exact:true}).click();
  await expect(page.getByLabel('Nội dung câu hỏi 1',{exact:true})).toHaveValue(/nơi nào/);
  await page.getByLabel('Nội dung câu hỏi 1',{exact:true}).fill('Cây phượng nằm ở đâu trong sân trường em?');
  await page.getByLabel('Từ gợi ý câu hỏi 1',{exact:true}).fill('gần cổng trường, bên cửa lớp, tỏa bóng');
  await page.getByRole('button',{name:'Dùng đề và bộ câu hỏi này',exact:true}).click();
  await expect(page.locator('.question-card h2')).toHaveText('Cây phượng nằm ở đâu trong sân trường em?');
  await expect(page.getByRole('button',{name:'tỏa bóng',exact:false})).toBeVisible();
  await page.reload();await expect(page.locator('.lesson-strip')).toContainText('cây phượng');
});

test('one sentence creates one seed; manual kinds, edit, reorder, delete and undo work',async({page})=>{
  await ideas(page);await seed(page,'Em sống cùng bà. Bà thường kể chuyện cho em.','Câu kể');
  await expect(page.locator('.saved-seed')).toHaveCount(2);
  await seed(page,'Nụ cười của bà hiền hậu.','Câu tả');
  await seed(page,'Em rất yêu bà.','Câu nêu tình cảm');
  await expect(page.locator('.saved-seed.feel')).toHaveCount(1);
  await page.getByRole('button',{name:'Đưa câu 4 lên trước',exact:true}).click();
  await expect(page.locator('.saved-seed').nth(2)).toContainText('Em rất yêu bà.');
  await page.getByRole('button',{name:'Sửa câu 1',exact:true}).click();
  await page.getByLabel('Câu văn của em',{exact:true}).fill('Em sống cùng bà và bố mẹ.');
  await page.getByRole('button',{name:'Lưu hạt câu văn',exact:true}).click();
  await expect(page.locator('.saved-seed').first()).toContainText('Em sống cùng bà và bố mẹ.');
  await page.getByRole('button',{name:'Xóa câu 1',exact:true}).click();await expect(page.locator('.saved-seed')).toHaveCount(3);
  await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();await expect(page.locator('.saved-seed')).toHaveCount(4);
  await page.reload();await expect(page.locator('.saved-seed')).toHaveCount(4);
});

test('oral sharing preserves cues and peer feedback before paragraph composition',async({page})=>{
  await ideas(page);await seed(page,'Em thường cùng bà tưới cây.','Câu kể');await seed(page,'Lá cây xanh mướt.','Câu tả');await seed(page,'Em rất yêu bà.','Câu nêu tình cảm');
  await page.getByRole('button',{name:'Kể cho bạn nghe',exact:true}).click();
  await expect(page.locator('.story-cues')).toContainText('Em thường cùng bà tưới cây.');
  await page.getByRole('button',{name:'Vai tiếp theo'}).click();await expect(page.locator('.talk-card h2')).toHaveText('Lắng nghe bằng cả trái tim');
  await page.getByLabel('Một chi tiết em nhớ trong câu chuyện của bạn',{exact:true}).fill('Mình nhớ việc tưới cây cùng bà.');
  await page.getByLabel('Một câu hỏi hoặc lời góp ý nhẹ nhàng',{exact:true}).fill('Bạn có thể kể thêm về khu vườn không?');
  await page.getByRole('button',{name:'Bắt đầu đồng hồ',exact:true}).click();await expect(page.locator('#timer-display')).not.toHaveText('1:00');
  await page.getByRole('button',{name:'Tạm dừng đồng hồ',exact:true}).click();
  await page.getByRole('button',{name:'Chúng mình đã chia sẻ',exact:true}).click();
  await page.getByRole('button',{name:'Ghép các câu của em',exact:true}).click();
  await expect(page.getByLabel('Đoạn văn của em',{exact:true})).toHaveValue('Em thường cùng bà tưới cây. Lá cây xanh mướt. Em rất yêu bà.');
  await page.getByLabel('Đoạn văn của em',{exact:true}).fill('Đoạn em đã sửa theo ý của mình.');
  await page.getByRole('button',{name:'Ghép các câu của em',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Ghép lại các hạt ý tưởng?'})).toBeVisible();
  await page.getByRole('button',{name:'Giữ trang viết',exact:true}).click();
  await expect(page.getByLabel('Đoạn văn của em',{exact:true})).toHaveValue('Đoạn em đã sửa theo ý của mình.');
});

test('review generates paragraph-specific exercises, rejects wrong answers and applies only chosen corrections',async({page})=>{
  await page.getByRole('link',{name:'Viết đoạn văn',exact:true}).click();
  await page.getByLabel('Đoạn văn của em',{exact:true}).fill('em có một chiếc cặp xinh sắn');
  await page.getByRole('button',{name:'Kiểm tra đoạn văn',exact:true}).click();
  await expect(page.locator('.review-summary')).toContainText('3 chỗ');
  await page.getByLabel('Em viết lại ở đây',{exact:true}).fill('e');await page.getByRole('button',{name:'Thử trả lời',exact:true}).click();
  await expect(page.locator('#apply-exercise')).toBeHidden();
  await page.getByLabel('Em viết lại ở đây',{exact:true}).fill('E');await page.getByRole('button',{name:'Thử trả lời',exact:true}).click();
  await page.getByRole('button',{name:'Dùng phần sửa này trong bài',exact:true}).click();
  await expect(page.locator('.highlighted-paragraph')).toContainText('Em có một chiếc cặp xinh sắn');
  await page.getByRole('button',{name:'xinh sắn',exact:true}).click();await expect(page.locator('#apply-exercise')).toBeHidden();
  await page.getByRole('button',{name:'xinh xắn',exact:true}).click();await page.getByRole('button',{name:'Dùng phần sửa này trong bài',exact:true}).click();
  await page.getByRole('button',{name:'.',exact:true}).click();await page.getByRole('button',{name:'Dùng phần sửa này trong bài',exact:true}).click();
  await expect(page.locator('.highlighted-paragraph')).toHaveText('Em có một chiếc cặp xinh xắn.');
  await expect(page.locator('.issue-card')).toHaveCount(0);await expect(page.locator('.revision-badge')).toHaveText('3 lần chăm chút');
  await page.getByRole('button',{name:'Lưu vào vườn của em',exact:true}).click();
  await expect(page.locator('.garden-paragraph')).toContainText('Em có một chiếc cặp xinh xắn.');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Tải đoạn văn (.txt)',exact:true}).click();
  const file=await download;expect(await readFile(await file.path(),'utf8')).toContain('Em có một chiếc cặp xinh xắn.');
});

test('drafts survive topic switches and a JSON project round-trip',async({page})=>{
  await ideas(page);await page.getByLabel('Câu trả lời của em',{exact:true}).fill('Ý tưởng em đang viết dở');await page.reload();
  await expect(page.getByLabel('Câu trả lời của em',{exact:true})).toHaveValue('Ý tưởng em đang viết dở');
  await seed(page,'Em rất yêu bà.','Câu nêu tình cảm');
  await page.getByRole('button',{name:'Bài viết đã lưu',exact:true}).click();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Tải bài đang học (.json)',exact:true}).click();const file=await download;const payload=await readFile(await file.path());
  await page.keyboard.press('Escape');await page.getByRole('link',{name:'Chọn đề bài',exact:true}).click();
  await page.locator('[data-preset="1"]').click();await ideas(page);await expect(page.locator('.saved-seed')).toHaveCount(0);
  await page.getByRole('button',{name:'Bài viết đã lưu',exact:true}).click();
  await page.locator('#import-file').setInputFiles({name:'bai-hoc.json',mimeType:'application/json',buffer:payload});
  await expect(page.locator('.outline-seed')).toHaveCount(1);await expect(page.locator('.outline-seed')).toContainText('Em rất yêu bà.');
});

test('mobile seed scene survives rerenders and content has no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await ideas(page);await seed(page,'Em cùng bà đọc sách.','Câu kể');
  await expect(page.locator('#seed-stage canvas')).toBeVisible();
  expect(await page.locator('#seed-stage').evaluate(el=>el.clientWidth>100&&el.clientHeight>100)).toBeTruthy();
  await page.getByRole('link',{name:'Viết đoạn văn',exact:true}).click();await page.getByRole('button',{name:'Ghép các câu của em',exact:true}).click();
  await expect(page.getByLabel('Đoạn văn của em',{exact:true})).toHaveValue('Em cùng bà đọc sách.');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.setViewportSize({width:320,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('reduced motion and saving failures remain usable',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(page.locator('#motion-label')).toHaveText('tắt');
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};});
  await ideas(page);await seed(page,'Em yêu cây xanh.','Câu nêu tình cảm');await expect(page.locator('#save-status')).toContainText('Chưa lưu được');
  await expect(page.locator('.saved-seed')).toHaveCount(1);expect(errors).toEqual([]);
});

test('without WebGL pupils can still answer and save sentences',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};});
  await page.reload();await expect(page.locator('.seed-fallback')).toBeVisible();await ideas(page);
  await seed(page,'Em kể chuyện cùng bạn.','Câu kể');await expect(page.locator('.saved-seed')).toHaveCount(1);
});

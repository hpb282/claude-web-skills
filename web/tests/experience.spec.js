import { test, expect } from '@playwright/test';

test.beforeEach(async ({page})=>{
  await page.goto('/');
  await page.locator('body.scene-ready').waitFor();
});

test('real WebGL shoe renders and responds to rotation, drag and product selection',async({page})=>{
  await expect(page.locator('#shoe-stage canvas')).toBeVisible();
  await page.getByRole('button',{name:'Pause floating animation'}).click();
  await page.waitForTimeout(1300);
  const before=await page.locator('#shoe-stage canvas').screenshot();
  await page.getByRole('button',{name:'Rotate shoe right'}).click();
  await page.waitForTimeout(800);
  const after=await page.locator('#shoe-stage canvas').screenshot();
  expect(before.equals(after)).toBeFalsy();
  await page.getByRole('button',{name:'Select Nike Air Max Pulse',exact:true}).click();
  await expect(page.locator('#hero-copy h1')).toHaveText('TURN UPTHE AIR.');
  await expect(page).toHaveURL(/#footwear\/1$/);
  await page.getByRole('button',{name:'Explore Air Max Pulse'}).click();
  await expect(page.locator('#detail-panel h1')).toHaveText('Nike Air Max Pulse');
  await page.getByRole('button',{name:'Back to collection'}).click();
  await expect(page.locator('#hero-copy')).toBeVisible();
});

test('size validation, colors, bag quantity and persistent storage work',async({page})=>{
  await page.getByRole('button',{name:'Explore Air Mag',exact:true}).click();
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();
  await expect(page.locator('#size-error')).toContainText('Choose your size');
  await page.getByRole('button',{name:'US 9',exact:true}).click();
  await page.locator('[data-color="1"]').click();
  await expect(page.locator('#color-name')).toContainText('Anthracite');
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();
  await expect(page.locator('.bag-count')).toHaveText('1');
  await page.getByRole('button',{name:'Open bag',exact:true}).click();
  await expect(page.locator('.bag-item')).toHaveCount(1);
  await expect(page.locator('.bag-item')).toContainText('Size: US 9');
  await page.getByRole('button',{name:'Increase quantity of Nike Air Mag'}).click();
  await expect(page.locator('.bag-count')).toHaveText('2');
  await page.reload();
  await expect(page.locator('.bag-count')).toHaveText('2');
  await page.getByRole('button',{name:'Open bag',exact:true}).click();
  await page.getByRole('button',{name:'Remove',exact:true}).click();
  await expect(page.locator('.empty-state')).toContainText('A little room for possibility.');
  await expect(page.locator('.bag-count')).toHaveText('0');
});

test('favorites, search results, no results and size guide are functional',async({page})=>{
  await page.getByRole('button',{name:'Explore Air Mag',exact:true}).click();
  await page.getByRole('button',{name:'Add to favorites',exact:true}).click();
  await page.getByRole('button',{name:'View favorites',exact:true}).click();
  await expect(page.locator('#drawer .search-result')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Size guide',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Find your fit.'})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Search collection'}).click();
  await page.getByRole('searchbox').fill('unmatchable');
  await expect(page.locator('#search-results')).toContainText('No matches yet');
  await page.getByRole('searchbox').fill('Club');
  await expect(page.locator('#search-results .search-result')).toHaveCount(1);
  await page.locator('#search-results .search-result').click();
  await expect(page.locator('#detail-panel h1')).toHaveText('Nike Club Fleece');
});

test('hanging wardrobe opens a product, supports sizing and adds apparel to bag',async({page})=>{
  await page.getByRole('link',{name:'Everyday layers'}).click();
  await expect(page.locator('#view-layers')).toBeVisible();
  await page.getByRole('button',{name:'Explore Nike Solo Swoosh',exact:true}).click();
  await expect(page.locator('#detail-panel h1')).toHaveText('Nike Solo Swoosh');
  await page.getByRole('button',{name:'M',exact:true}).click();
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();
  await page.getByRole('button',{name:'Open bag',exact:true}).click();
  await expect(page.locator('.bag-item')).toContainText('Size: M');
});

test('lookbook carousel, hotspots and complete-look purchase work',async({page})=>{
  await page.getByRole('link',{name:'Shop the look',exact:true}).click();
  await page.getByRole('button',{name:'Next look'}).click();
  await expect(page.locator('#look-name')).toHaveText('Off the clock');
  await expect(page).toHaveURL(/#looks\/1$/);
  await page.getByRole('button',{name:'Shop this look',exact:true}).click();
  const selects=page.locator('#look-form select');
  await expect(selects).toHaveCount(3);
  await selects.nth(0).selectOption('M');
  await selects.nth(1).selectOption('L');
  await selects.nth(2).selectOption('US 9');
  await page.getByRole('button',{name:'Add look to bag'}).click();
  await expect(page.locator('.bag-count')).toHaveText('3');
  await page.getByRole('button',{name:'Open bag',exact:true}).click();
  await expect(page.locator('.bag-item')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Explore top in Off the clock'}).click();
  await expect(page.locator('#detail-panel h1')).toHaveText('Nike Sportswear');
});

test('mobile layout has no horizontal overflow and product form remains reachable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Explore Air Mag',exact:true}).click();
  await expect(page.locator('#hero-copy')).toBeHidden();
  await page.getByRole('button',{name:'US 10',exact:true}).click();
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();
  await expect(page.locator('.bag-count')).toHaveText('1');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.getByRole('link',{name:'Everyday layers'}).click();
  await expect(page.locator('#view-layers')).toBeVisible();
  await page.getByRole('link',{name:'Shop the look',exact:true}).click();
  await expect(page.getByRole('button',{name:'Shop this look',exact:true})).toBeVisible();
});

test('reduced motion is respected and navigation produces no application errors',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();
  await page.locator('body.scene-ready').waitFor();
  await expect(page.locator('#motion-state')).toHaveText('off');
  await page.getByRole('link',{name:'Everyday layers'}).click();
  await page.getByRole('link',{name:'Shop the look',exact:true}).click();
  await page.getByRole('button',{name:'Next look'}).click();
  await page.getByRole('link',{name:'Footwear',exact:true}).click();
  await page.getByRole('button',{name:'Select Nike Air Max Dawn',exact:true}).click();
  await expect(page.locator('#hero-copy h1')).toHaveText('YOUR NEXTFRESH START.');
  expect(errors).toEqual([]);
});

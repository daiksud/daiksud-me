import assert from 'node:assert/strict';

export async function checkHomeGeometry(page, width) {
  await page.evaluate(() => document.fonts.ready);
  const menu = await page.getByRole('complementary', { name: 'サイトメニュー', exact: true }).boundingBox();
  const main = await page.getByRole('main').boundingBox();
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  assert.ok(width >= 1280 ? menu.x + menu.width <= main.x + 1 : menu.y + menu.height <= main.y + 1,
    'NAV-01 menu is beside wide content and above narrower content');
  if (width >= 1280) {
    assert.ok(menu.width >= 230, 'NAV-01 desktop menu has room for its labels');
    assert.ok(Math.abs(menu.x) <= 1, 'NAV-01 desktop menu starts at the viewport left edge');
    assert.ok(main.x - menu.x - menu.width >= 0 && main.x - menu.x - menu.width <= 24,
      'NAV-04 main content follows the sidebar with a small gap');
  } else {
    assert.ok(Math.abs(main.x - 12) <= 1 && Math.abs(menu.x - 12) <= 1
      && Math.abs(viewportWidth - menu.x - menu.width - 12) <= 1,
      'NAV-04 narrower content and the top menu retain small side gutters');
  }
  assert.ok(Math.abs(viewportWidth - main.x - main.width - 12) <= 1,
    'NAV-04 main content fills the available viewport width with a small right gutter');
  const tagline = page.getByRole('banner').getByText('つくる。学ぶ。書く。繰り返す。', { exact: true });
  assert.ok(await tagline.isVisible(), 'NAV-04 tagline remains readable');
  if (width >= 1000) {
    assert.equal(await tagline.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getClientRects().length;
    }), 1, 'NAV-04 desktop tagline fits on one line');
  }
  const names = ['ようこそ', '最新の記事', '自己紹介', '最近のコミット'];
  const boxes = {};
  for (const name of names) {
    const region = page.getByRole('region', { name, exact: true });
    assert.ok(await region.isVisible(), `${name} is visible`);
    boxes[name] = await region.evaluate((element) => {
      const { top, bottom, left, right, height } = element.getBoundingClientRect();
      return { top, bottom, left, right, height };
    });
    assert.ok(await region.evaluate((element) => element.scrollHeight <= element.clientHeight + 1), `${name} content is not clipped`);
  }
  const welcome = boxes['ようこそ'];
  const posts = boxes['最新の記事'];
  const about = boxes['自己紹介'];
  const commits = boxes['最近のコミット'];
  assert.ok(Math.abs(welcome.left - main.x) <= 1 && Math.abs(welcome.right - main.x - main.width) <= 1,
    'NAV-04 home panes use the full main column on wide screens');
  assert.ok(Math.abs(welcome.left - posts.left) <= 1 && Math.abs(welcome.right - posts.right) <= 1,
    'NAV-04 welcome and latest articles fill the same main column');
  assert.ok(posts.top >= welcome.bottom && posts.top - welcome.bottom <= 32,
    'NAV-04 latest articles follow the welcome pane');
  assert.ok(about.top >= posts.bottom && about.top - posts.bottom <= 32,
    'NAV-04 supporting content follows latest articles without an empty row');
  if (width >= 1000) {
    assert.ok(Math.abs(about.top - commits.top) <= 1 && about.right <= commits.left,
      'NAV-04 supporting panes start together without overlap');
  } else {
    for (let i = 1; i < names.length; i++) {
      assert.ok(boxes[names[i]].top >= boxes[names[i - 1]].bottom, `Mobile reading order without overlap at ${width}px`);
    }
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
  return { width, boxes };
}

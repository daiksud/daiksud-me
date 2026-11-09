import assert from 'node:assert/strict';

export async function checkHomeGeometry(page, width) {
  await page.evaluate(() => document.fonts.ready);
  const menu = await page.getByRole('complementary', { name: 'サイトメニュー', exact: true }).boundingBox();
  const main = await page.getByRole('main').boundingBox();
  assert.ok(width >= 1280 ? menu.x + menu.width <= main.x + 1 : menu.y + menu.height <= main.y + 1,
    'NAV-01 menu is beside wide content and above narrower content');
  if (width >= 1280) assert.ok(menu.width >= 230, 'NAV-01 desktop menu has room for its labels');
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

// Real-browser review: load each page over http at real viewport sizes, scroll like a person, and save one screenshot per fold.
const { chromium } = require('playwright');
(async () => {
  const [out, ...pages] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('requestfailed', r => errs.push('FAIL ' + r.url()));
    for (const pg of pages) {
      await p.goto('http://127.0.0.1:8411/' + pg, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      const ow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ow > 0) console.log('OVERFLOW', tag, pg, ow);
      let i = 0;
      for (let y = 0; y < H; y += h - 60, i++) {
        await p.evaluate(y => scrollTo(0, y), y);
        await p.waitForTimeout(1300);
        await p.screenshot({ path: `${out}/${(pg || 'index').replace(/\//g, '_')}-${tag}-${String(i).padStart(2, '0')}.png` });
      }
      console.log(tag, pg || 'index', 'height', H, 'folds', i);
    }
    if (errs.length) console.log('ERRORS', [...new Set(errs)].slice(0, 10));
    await ctx.close();
  }
  await b.close();
})();

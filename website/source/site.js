// Preview behaviour: forms confirm in the page because this build has no shop or mail backend.
document.documentElement.classList.add('js');
(function () {
  var sp = document.getElementById('splash');
  if (!sp) return;
  var done = function () { if (sp.parentNode) sp.remove(); };
  sp.addEventListener('click', function () { sp.classList.add('go'); setTimeout(done, 650); });
  sp.addEventListener('animationend', function (e) { if (e.target === sp) done(); });
  setTimeout(done, 4200);
})();
document.querySelectorAll('form.js-sample, form.js-order, form.js-enquiry').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = f.querySelector('.js-msg');
    if (!m) return;
    m.hidden = false;
    m.textContent = f.classList.contains('js-enquiry')
      ? 'Thanks. This is a preview of the new site, so nothing has been sent. Call 0191 250 9853 or email sales@halmanthompson.com in the meantime.'
      : 'This preview doesn’t take orders yet. The basket will connect to the shop when the site goes live.';
  });
});

(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll
  var els = document.querySelectorAll('.rv, .rvimg');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Parallax and the reading bar share one scroll handler
  var par = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var bar = document.querySelector('.readbar span');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var vh = innerHeight;
    if (!reduce) par.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var k = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (k * -9).toFixed(2) + '%,0)';
    });
    if (bar) {
      var h = document.documentElement.scrollHeight - vh;
      bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  if (par.length || bar) { addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); onScroll(); }

  // Our work: endless reel and a filter that re-lays the grid
  var reel = document.querySelector('.wk-reel');
  if (reel && !reduce) reel.innerHTML += reel.innerHTML;
  var grid = document.querySelector('.wk-grid');
  if (grid) {
    var cards = [].slice.call(grid.querySelectorAll('.wk'));
    var shown = document.querySelector('.wk-shown');
    var PAT = ['s7', 's5 drop', '', '', '', 's5', 's7 drop', '', '', ''];
    cards.forEach(function (c, i) { c.style.viewTransitionName = 'wk' + i; });
    function layout(f) {
      var n = 0;
      cards.forEach(function (c) {
        var on = f === 'all' || c.dataset.metal === f;
        c.hidden = !on;
        c.classList.remove('s7', 's5', 'drop');
        if (on) { var p = PAT[n % PAT.length]; if (p) p.split(' ').forEach(function (k) { c.classList.add(k); }); n++; }
      });
      if (shown) shown.textContent = 'Showing ' + n;
    }
    grid.classList.add('ed');
    layout('all');
    document.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var go = function () { layout(b.dataset.f); cards.forEach(function (c) { c.classList.add('in'); }); };
        if (document.startViewTransition && !reduce) document.startViewTransition(go); else go();
      });
    });
  }
})();

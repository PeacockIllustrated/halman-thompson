// Preview behaviour: forms confirm in the page because this build has no shop or mail backend.
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

/* Кейс «Техноматика»: переключение этапов. Мышь, касание, стрелки, Home и End. */
(function () {
  'use strict';
  var list = document.querySelector('[role="tablist"]');
  if (!list) return;
  var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  list.addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]');
    if (t) select(t, false);
  });
  list.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement), n = -1;
    if (i < 0) return;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    if (n > -1) { e.preventDefault(); select(tabs[n], true); }
  });
})();

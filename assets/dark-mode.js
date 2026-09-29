(function () {
  var STORAGE_KEY = 'shoppi-color-mode';

  function isDark() {
    return document.documentElement.classList.contains('dark-mode');
  }

  function applyMode(dark) {
    document.documentElement.classList.toggle('dark-mode', dark);
    document.querySelectorAll('.dark-mode-toggle').forEach(function(btn) {
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function getSaved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function save(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
  }

  function toggle() {
    var next = !isDark();
    save(next ? 'dark' : 'light');
    applyMode(next);
  }

  // Sync aria state with whatever the anti-FOUC script already applied
  applyMode(isDark());

  document.querySelectorAll('.dark-mode-toggle').forEach(function(btn) {
    btn.addEventListener('click', toggle);
  });

  // Follow OS preference changes only when the user has not made an explicit choice
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!getSaved()) applyMode(e.matches);
    });
  } catch (e) {}
})();

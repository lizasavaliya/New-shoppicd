/* compare-modal-enhance.js
 * Adds a sticky heading, left label column, and X remove buttons
 * to the compare modal table without modifying compare-modal.js.
 */
(function () {
  // Label text for rows that have no embedded .compare-label element
  var LABEL_MAP = {
    'compare-row--vendor':      'Vendor',
    'compare-row--description': 'Description',
    'compare-row--variants':    'Options',
    'compare-row--rating':      '',
  };

  // Header rows get an empty, transparent label column
  var HEADER_ROWS = [
    'compare-row--image',
    'compare-row--title',
    'compare-row--price',
    'compare-row--actions',
  ];

  function isHeaderRow(row) {
    for (var i = 0; i < HEADER_ROWS.length; i++) {
      if (row.classList.contains(HEADER_ROWS[i])) return true;
    }
    return false;
  }

  function getLabelText(row) {
    // Rows with embedded labels (weight, type, metafields): extract and remove them
    var el = row.querySelector('.compare-label');
    if (el) {
      var text = el.textContent.trim();
      var all = row.querySelectorAll('.compare-label');
      all.forEach(function (node) { node.remove(); });
      return text;
    }
    // Static lookup for vendor, description, etc.
    for (var cls in LABEL_MAP) {
      if (row.classList.contains(cls)) return LABEL_MAP[cls];
    }
    return '';
  }

  function addHeading(container) {
    if (container.querySelector('.cc-compare-heading')) return;
    var h = document.createElement('div');
    h.className = 'cc-compare-heading';
    h.setAttribute('aria-hidden', 'true');
    h.textContent = 'Product comparison';
    var area = container.querySelector('.js-compare-area');
    container.insertBefore(h, area || container.firstChild);
  }

  function scrollCompare(area, direction) {
    var col = area.querySelector('.compare-col:not(.compare-col--label)');
    if (!col) return;
    area.scrollBy({ left: direction * col.offsetWidth, behavior: 'smooth' });
  }

  function addNavigation(container, area) {
    if (container.querySelector('.cc-compare-nav')) return;
    var nav = document.createElement('div');
    nav.className = 'cc-compare-nav';
    nav.setAttribute('aria-hidden', 'true');

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'cc-compare-nav__btn';
    prevBtn.setAttribute('aria-label', 'Previous product');
    prevBtn.innerHTML = '&#8249;';

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'cc-compare-nav__btn';
    nextBtn.setAttribute('aria-label', 'Next product');
    nextBtn.innerHTML = '&#8250;';

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);

    // Insert after the heading, just above the compare area
    var heading = container.querySelector('.cc-compare-heading');
    var insertBefore = heading ? heading.nextSibling : container.querySelector('.js-compare-area');
    container.insertBefore(nav, insertBefore);

    prevBtn.addEventListener('click', function () { scrollCompare(area, -1); });
    nextBtn.addEventListener('click', function () { scrollCompare(area, 1); });
  }

  function enhanceTable(area) {
    var rows = area.querySelectorAll('.compare-row');

    rows.forEach(function (row) {
      // Skip already-enhanced rows
      if (row.querySelector('.compare-col--label')) return;

      var labelDiv = document.createElement('div');
      labelDiv.className = 'compare-col compare-col--label';
      if (!isHeaderRow(row)) {
        var labelText = getLabelText(row);
        labelDiv.textContent = labelText;
        // Store on the row so mobile CSS can use attr(data-row-label) in ::before
        if (labelText) row.setAttribute('data-row-label', labelText);
      }
      row.insertBefore(labelDiv, row.firstChild);
    });

    // Move the text "Remove" button into each image column as a circular X button
    var imageRow = area.querySelector('.compare-row--image');
    var actionsRow = area.querySelector('.compare-row--actions');
    if (imageRow && actionsRow) {
      var imgCols = imageRow.querySelectorAll('.compare-col:not(.compare-col--label)');
      var removeBtns = actionsRow.querySelectorAll('.js-compare-col-remove');
      removeBtns.forEach(function (btn, i) {
        var col = imgCols[i];
        if (col) {
          var ariaLabel = btn.textContent.trim() || 'Remove';
          btn.className = (btn.className + ' btn btn--icon js-compare-col-remove--image').trim();
          btn.setAttribute('aria-label', ariaLabel);
          btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linejoin="round" aria-hidden="true" focusable="false" role="presentation" class="icon"><path d="M5 19 19 5M5 5l14 14"/></svg><span class="visually-hidden">' + ariaLabel + '</span>';
          col.appendChild(btn);
        }
      });
    }
  }

  function init() {
    var area = document.querySelector('.js-compare-area');
    if (!area) return;
    var container = document.querySelector('.compare-container');

    var debounce;
    new MutationObserver(function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        if (area.children.length > 0) {
          enhanceTable(area);
          if (container) addHeading(container);
          if (container) addNavigation(container, area);
        }
      }, 60);
    }).observe(area, { childList: true });

    // Handle the case where the area is already populated on init
    if (area.children.length > 0) {
      enhanceTable(area);
      if (container) addHeading(container);
      if (container) addNavigation(container, area);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

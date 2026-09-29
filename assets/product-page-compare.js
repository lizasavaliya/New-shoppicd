/* global CompareUtil */

(function () {
  function initProductCompareBtn() {
    const btn = document.querySelector('.js-product-compare-btn');
    if (!btn) return;

    const productId = btn.dataset.compareProductId;
    const productUrl = btn.dataset.compareProductUrl;
    const iconDefault = btn.querySelector('.product-info__compare-icon--default');
    const iconCheck = btn.querySelector('.product-info__compare-icon--check');

    function updateBtnState() {
      const products = CompareUtil.getSelectedProducts();
      const isComparing = products.some((p) => p.id === productId);
      iconDefault.hidden = isComparing;
      iconCheck.hidden = !isComparing;
      btn.classList.toggle('is-comparing', isComparing);
      btn.setAttribute('aria-pressed', isComparing.toString());
    }

    function getDrawer() {
      return document.querySelector('compare-drawer');
    }

    function syncFloatingBtn() {
      const drawer = getDrawer();
      if (drawer && typeof drawer.toggleCompareButton === 'function') {
        drawer.toggleCompareButton();
      }
    }

    // Patch updateCompareCheckboxes so that when the drawer removes a product
    // (removeFromCompare with updateDom=true), the product-page button and the
    // floating "Comparer" toggle both sync their state automatically.
    const _origUpdate = CompareUtil.updateCompareCheckboxes;
    CompareUtil.updateCompareCheckboxes = function () {
      _origUpdate.call(this);
      updateBtnState();
      syncFloatingBtn(); // re-adds is-out when count reaches 0
    };

    // Open the compare drawer by clicking the floating button via setTimeout(0).
    // The timeout defers the click until after all DOM/localStorage updates settle,
    // and routes through CompareDrawer.handleClick (document listener) exactly like
    // a real user tap — the most reliable trigger path.
    function openDrawer() {
      const drawer = getDrawer();
      if (!drawer || drawer.hasAttribute('open')) return;

      // Remove is-out so the button is in a valid state before the click fires
      syncFloatingBtn();

      setTimeout(function () {
        const btn = (drawer.openDrawerButton) || document.querySelector('.js-open-compare-drawer');
        if (btn && !drawer.hasAttribute('open')) {
          btn.click();
        }
      }, 0);
    }

    btn.addEventListener('click', function () {
      const drawer = getDrawer();
      const maxCompare = drawer ? parseInt(drawer.dataset.maxCompare, 10) : 10;
      const isComparing = CompareUtil.getSelectedProducts().some((p) => p.id === productId);

      if (isComparing) {
        CompareUtil.removeFromCompare(productId, false);
        updateBtnState();
        syncFloatingBtn();
      } else if (CompareUtil.getCompareCount() < maxCompare) {
        CompareUtil.addToCompare(productId, productUrl, false);
        updateBtnState();
        openDrawer();
      } else {
        const msg =
          theme.strings.compare && theme.strings.compare.limit
            ? theme.strings.compare.limit.replace('[quantity]', maxCompare)
            : 'Maximum ' + maxCompare + ' products can be compared';
        alert(msg); // eslint-disable-line no-alert
      }
    });

    updateBtnState();
  }

  // compare-drawer.js is deferred and follows this file in HTML order.
  // DOMContentLoaded fires after ALL deferred scripts, so CompareUtil is
  // guaranteed to exist by that point.
  if (typeof CompareUtil !== 'undefined') {
    initProductCompareBtn();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof CompareUtil !== 'undefined') {
        initProductCompareBtn();
        return;
      }
      // Fallback: brief poll in case of unusual script load order
      let attempts = 0;
      const interval = setInterval(function () {
        attempts += 1;
        if (typeof CompareUtil !== 'undefined') {
          clearInterval(interval);
          initProductCompareBtn();
        } else if (attempts >= 40) {
          clearInterval(interval);
        }
      }, 50);
    });
  }
})();

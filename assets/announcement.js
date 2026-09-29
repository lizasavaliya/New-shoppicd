/**
 * Returns a function that as long as it continues to be invoked, won't be triggered.
 * @param {Function} fn - Callback function.
 * @param {number} [wait=300] - Delay (in milliseconds).
 * @returns {Function}
 */
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

if (!customElements.get('announcement-bar')) {
  class AnnouncementBar extends HTMLElement {
    constructor() {
      super();
      this.slider = this.querySelector('.announcement__slider');
      this.localization = this.querySelector('.announcement__localization');
      this.links = this.querySelectorAll('.js-announcement-link');
      this.menu = document.querySelector('.main-menu__content');
      this.prevBtn = this.querySelector('.js-announcement-prev');
      this.nextBtn = this.querySelector('.js-announcement-next');
      this.isPaused = false;

      this.bindEvents();
      this.init();
    }

    disconnectedCallback() {
      if (this.moveLinksHandler) {
        window.removeEventListener('on:breakpoint-change', this.moveLinksHandler);
      }

      if (this.moveLocalizationHandler) {
        window.removeEventListener('on:breakpoint-change', this.moveLocalizationHandler);
      }

      if (this.countdownIntervals) {
        this.countdownIntervals.forEach(id => clearInterval(id));
      }
    }

    bindEvents() {
      if (this.links) {
        this.moveLinksHandler = this.moveLinksHandler || this.moveLinks.bind(this);
        window.addEventListener('on:breakpoint-change', this.moveLinksHandler);
      }

      if (this.localization) {
        this.moveLocalizationHandler = this.moveLocalizationHandler
          || debounce(this.moveLocalization.bind(this));
        window.addEventListener('on:breakpoint-change', this.moveLocalizationHandler);
      }

      if (this.slider) {
        this.slider.addEventListener('mouseenter', this.pauseSlider.bind(this));
        this.slider.addEventListener('mouseleave', this.resumeSlider.bind(this));
      }

      this.querySelectorAll('.js-copy-coupon').forEach(btn => {
        btn.addEventListener('click', this.handleCouponCopy.bind(this));
      });

      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => this.goToSlide('prev'));
      }
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => this.goToSlide('next'));
      }

      // Listen for cart updates to refresh free shipping messages
      document.addEventListener('on:cart:change', this.updateFreeShipping.bind(this));
      document.addEventListener('cart:updated', this.updateFreeShipping.bind(this));
    }

    /**
     * Navigate to prev or next slide
     */
    goToSlide(direction) {
      if (!this.slider) return;
      const slides = Array.from(this.slider.querySelectorAll('.announcement__text'));
      const currSlide = this.slider.querySelector('.announcement__text.is-visible');
      const currIdx = slides.indexOf(currSlide);

      let nextIdx;
      if (direction === 'next') {
        nextIdx = currIdx + 1 < slides.length ? currIdx + 1 : 0;
      } else {
        nextIdx = currIdx - 1 >= 0 ? currIdx - 1 : slides.length - 1;
      }

      if (document.dir === 'rtl') {
        this.slider.scrollTo(-Math.abs(nextIdx * slides[nextIdx].clientWidth), 0);
      } else {
        this.slider.scrollTo(slides[nextIdx].offsetLeft - 32, 0);
      }

      slides[nextIdx].classList.add('is-visible');
      slides[currIdx].classList.remove('is-visible');
    }

    /**
     * Start sliders a slidin'
     */
    init() {
      if (this.slider) {
        const slides = this.slider.querySelectorAll('.announcement__text');
        slides[0].classList.add('is-visible');

        const nextSlide = () => {
          if (!this.isPaused && theme.elementUtil.isInViewport(this)) {
            this.goToSlide('next');
          }
          setTimeout(nextSlide, this.dataset.slideDelay);
        };
        setTimeout(nextSlide, this.dataset.slideDelay);
      }

      if (this.links) {
        this.moveLinks();
      }

      if (this.localization) {
        this.moveLocalization();
      }

      this.initCountdowns();
    }

    /**
     * Initialise inline countdown timers for promo_code blocks
     */
    initCountdowns() {
      this.countdownIntervals = [];
      const countdowns = this.querySelectorAll('.announcement__countdown[data-end-date]');
      if (!countdowns.length) return;

      countdowns.forEach(el => {
        const endDate = new Date(el.dataset.endDate).getTime();
        if (!endDate || Number.isNaN(endDate)) return;

        const daysEl = el.querySelector('.js-cd-days');
        const hoursEl = el.querySelector('.js-cd-hours');
        const minsEl = el.querySelector('.js-cd-mins');
        const secsEl = el.querySelector('.js-cd-secs');

        const tick = () => {
          const diff = endDate - Date.now();

          if (diff <= 0) {
            el.textContent = '';
            return;
          }

          const d = Math.floor(diff / 86400000);
          const h = Math.floor((diff % 86400000) / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);

          if (daysEl) daysEl.textContent = d;
          if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
          if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
          if (secsEl) secsEl.textContent = String(s).padStart(2, '0');
        };

        tick();
        this.countdownIntervals.push(setInterval(tick, 1000));
      });
    }

    /**
     * Copy coupon code to clipboard
     */
    handleCouponCopy(event) {
      const btn = event.currentTarget;
      const code = btn.dataset.code;
      if (!code) return;

      const finish = () => this.showCouponCopied(btn);

      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(finish).catch(() => this.fallbackCopy(code, finish));
      } else {
        this.fallbackCopy(code, finish);
      }
    }

    fallbackCopy(text, callback) {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(el);
      callback();
    }

    showCouponCopied(btn) {
      const copiedEl = btn.querySelector('.announcement__coupon-copied');
      if (!copiedEl) return;
      copiedEl.removeAttribute('hidden');
      btn.classList.add('is-copied');
      setTimeout(() => {
        copiedEl.setAttribute('hidden', '');
        btn.classList.remove('is-copied');
      }, 2000);
    }

    /**
     * Update free shipping messages after cart changes
     */
    updateFreeShipping(event) {
      const fsBlocks = this.querySelectorAll('.announcement__text--free-shipping');
      if (!fsBlocks.length) return;

      const cartTotal = event?.detail?.cart?.total_price ?? null;

      if (cartTotal !== null) {
        this.refreshFreeShippingMessages(fsBlocks, cartTotal);
      } else {
        fetch('/cart.js')
          .then(r => r.json())
          .then(cart => this.refreshFreeShippingMessages(fsBlocks, cart.total_price))
          .catch(() => {});
      }
    }

    refreshFreeShippingMessages(blocks, totalPrice) {
      blocks.forEach(block => {
        const goal = Number.parseInt(block.dataset.fsGoal, 10);
        const msgEl = block.querySelector('.js-fs-message');
        if (!msgEl || !goal) return;

        const moneyGoal = block.dataset.fsMoney_goal || block.dataset.fsMoneyGoal || '';

        let msg;
        if (totalPrice <= 0) {
          msg = (block.dataset.fsDefault || '').replace('{fs_amount}', moneyGoal);
        } else if (totalPrice >= goal) {
          msg = block.dataset.fsSuccess || '';
        } else {
          const deficitCents = goal - totalPrice;
          const deficitFormatted = this.formatMoney(deficitCents);
          msg = (block.dataset.fsProgress || '').replace('{amount_to_fs}', deficitFormatted);
        }

        msgEl.textContent = msg;
      });
    }

    formatMoney(cents) {
      const amount = (cents / 100).toFixed(2);
      const format = window.Shopify?.money_format || '${{amount}}';
      return format.replace('{{amount}}', amount)
                   .replace('{{amount_no_decimals}}', Math.round(cents / 100))
                   .replace('{{amount_with_comma_separator}}', amount.replace('.', ','));
    }

    /**
     * Move the help links selectors to the mobile nav/back to the announcement bar if necessary
     */
    moveLinks() {
      const menuAnnouncementLinks = document.querySelector('.mob__announcement-links');
      if (!theme.mediaMatches.md && !menuAnnouncementLinks) {
        // Move localization to mobile
        const mobNav = document.createElement('nav');
        mobNav.classList.add('mob__announcement-links');

        const mobNavUl = document.createElement('ul');
        mobNav.classList.add('secondary-nav');

        this.links.forEach((link) => {
          mobNav.innerHTML += `<li><a class="secondary-nav__item" href="${link.href}">${link.innerText}</a>`;
        });

        mobNav.appendChild(mobNavUl);
        this.menu.appendChild(mobNav);
      } else if (theme.mediaMatches.md && menuAnnouncementLinks) {
        menuAnnouncementLinks.remove();
      }
    }

    /**
     * Move the localization selectors to the mobile nav/back to the announcement bar if necessary
     */
    moveLocalization() {
      this.slider = this.querySelector('.announcement__slider');
      this.localization = this.querySelector('.announcement__localization');
      this.links = this.querySelectorAll('.js-announcement-link');
      this.menu = document.querySelector('.main-menu__content');
      const menuLocalization = document.querySelector('.mob__localization');
      if (!theme.mediaMatches.md && !menuLocalization) {
        // Move localization to mobile
        const mobLocalizationElem = document.createElement('div');
        mobLocalizationElem.classList.add('mob__localization');
        mobLocalizationElem.appendChild(this.localization.firstElementChild);
        this.menu.appendChild(mobLocalizationElem);
      } else if (theme.mediaMatches.md && menuLocalization) {
        // Move localization back to announcement bar
        this.localization.appendChild(menuLocalization.firstElementChild);
        menuLocalization.remove();
      }
    }

    /**
     * Pauses the auto-rotating slider
     */
    pauseSlider() {
      this.isPaused = true;
    }

    /**
     * Resumes the auto-rotating slider
     */
    resumeSlider() {
      this.isPaused = false;
    }
  }

  customElements.define('announcement-bar', AnnouncementBar);
}

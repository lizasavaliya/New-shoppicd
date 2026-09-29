/* global Modal */

if (!customElements.get('store-locator')) {
  customElements.whenDefined('modal-dialog').then(() => {
    class StoreLocator extends Modal {
      constructor() {
        super();

        this.selectedBlockId = null;
        this.mapsKey         = this.dataset.mapsKey || null;
        this.mapFrame        = this.querySelector('.store-locator__map-frame');
        this.selectBtn       = this.querySelector('.js-select-store');
        this.items           = Array.from(this.querySelectorAll('.store-locator__item'));
        this.triggerBtn      = document.querySelector(`[data-open="${this.id}"]`);
        this.triggerLabel    = this.triggerBtn ? this.triggerBtn.querySelector('.store-locator__trigger-label') : null;

        this._moveToHeader();
        this._bindEvents();
        this._restoreSelection();

        if (Shopify.designMode) {
          this._bindDesignModeEvents();
        }
      }

      /* ------------------------------------------------------------------
         Move trigger button into the header icons bar
      ------------------------------------------------------------------ */

      _moveToHeader() {
        if (!this.triggerBtn) return;

        const headerIcons = document.querySelector('.header__icons');
        if (!headerIcons) return;

        // Insert before the customer account element or the cart icon
        const anchor = headerIcons.querySelector('shopify-account, a[href*="account"], #cart-icon');
        if (anchor) {
          headerIcons.insertBefore(this.triggerBtn, anchor);
        } else {
          headerIcons.appendChild(this.triggerBtn);
        }
      }

      /* ------------------------------------------------------------------
         Event binding
      ------------------------------------------------------------------ */

      _bindEvents() {
        if (this.triggerBtn) {
          this.triggerBtn.addEventListener('click', () => this.open(this.triggerBtn));
        }

        this.querySelectorAll('.store-locator__checkbox').forEach((cb) => {
          cb.addEventListener('change', (e) => this._onCheckboxChange(e.target));
        });

        this.querySelectorAll('.store-locator__item-toggle').forEach((toggle) => {
          toggle.addEventListener('click', (e) => {
            const item = e.currentTarget.closest('.store-locator__item');
            this._onToggleClick(item);
          });
        });

        if (this.selectBtn) {
          this.selectBtn.addEventListener('click', () => this._onSelectStore());
        }
      }

      _bindDesignModeEvents() {
        document.addEventListener('shopify:section:select', (evt) => {
          if (evt.target === this.closest('.shopify-section')) this.open(null);
        });

        document.addEventListener('shopify:section:deselect', () => {
          if (this.hasAttribute('open')) this.close();
        });

        document.addEventListener('shopify:block:select', (evt) => {
          const item = this.querySelector(`[data-block-id="${evt.detail.blockId}"]`);
          if (!item) return;
          this.open(null);
          this._expandItem(item);
        });

        document.addEventListener('shopify:block:deselect', (evt) => {
          const item = this.querySelector(`[data-block-id="${evt.detail.blockId}"]`);
          if (item) this._collapseItem(item);
        });
      }

      /* ------------------------------------------------------------------
         Restore previously selected store from localStorage
      ------------------------------------------------------------------ */

      _restoreSelection() {
        const savedId = localStorage.getItem(`store-locator-${this.id}`);

        if (savedId) {
          const item = this.querySelector(`[data-block-id="${savedId}"]`);
          if (item) {
            this._uncheckAll();
            const cb = item.querySelector('.store-locator__checkbox');
            if (cb) cb.checked = true;
            this.selectedBlockId = savedId;
            this._updateTriggerLabel(item);
            return;
          }
        }

        // Auto-select first store if configured
        if (this.dataset.autoSelectFirst === 'true' && this.items.length > 0) {
          const first = this.items[0];
          const cb = first.querySelector('.store-locator__checkbox');
          if (cb && !cb.checked) cb.checked = true;
          this.selectedBlockId = first.dataset.blockId;
        }
      }

      /* ------------------------------------------------------------------
         Handlers
      ------------------------------------------------------------------ */

      _onCheckboxChange(checkbox) {
        const item = checkbox.closest('.store-locator__item');

        if (checkbox.checked) {
          this._uncheckAll(checkbox);
          this.selectedBlockId = item.dataset.blockId;
          this._updateMap(item.dataset.address);
        } else {
          this.selectedBlockId = null;
        }
      }

      _onToggleClick(item) {
        if (item.classList.contains('store-locator__item--active')) {
          this._collapseItem(item);
        } else {
          this._expandItem(item);
          // Auto-check the store when its accordion opens
          const cb = item.querySelector('.store-locator__checkbox');
          if (cb && !cb.checked) {
            this._uncheckAll();
            cb.checked = true;
            this.selectedBlockId = item.dataset.blockId;
          }
        }
      }

      _onSelectStore() {
        if (this.selectedBlockId) {
          localStorage.setItem(`store-locator-${this.id}`, this.selectedBlockId);
          const selected = this.querySelector(`[data-block-id="${this.selectedBlockId}"]`);
          if (selected) this._updateTriggerLabel(selected);
        }
        this.close();
      }

      /* ------------------------------------------------------------------
         Accordion helpers
      ------------------------------------------------------------------ */

      _expandItem(item) {
        // Collapse all other open items first
        this.items.forEach((other) => {
          if (other !== item && other.classList.contains('store-locator__item--active')) {
            this._collapseItem(other);
          }
        });

        const details = item.querySelector('.store-locator__item-details');
        const toggle  = item.querySelector('.store-locator__item-toggle');

        item.classList.add('store-locator__item--active');
        if (details) details.removeAttribute('hidden');
        if (toggle)  toggle.setAttribute('aria-expanded', 'true');

        if (item.dataset.address) this._updateMap(item.dataset.address);
      }

      _collapseItem(item) {
        const details = item.querySelector('.store-locator__item-details');
        const toggle  = item.querySelector('.store-locator__item-toggle');

        item.classList.remove('store-locator__item--active');
        if (details) details.setAttribute('hidden', '');
        if (toggle)  toggle.setAttribute('aria-expanded', 'false');
      }

      /* ------------------------------------------------------------------
         Utility helpers
      ------------------------------------------------------------------ */

      _uncheckAll(except) {
        this.querySelectorAll('.store-locator__checkbox').forEach((cb) => {
          if (cb !== except) cb.checked = false;
        });
      }

      _updateMap(address) {
        if (!this.mapFrame || !this.mapsKey) return;
        this.mapFrame.src = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(this.mapsKey)}&q=${encodeURIComponent(address)}`;
      }

      _updateTriggerLabel(item) {
        if (!this.triggerLabel) return;
        const nameEl = item.querySelector('.store-locator__item-name');
        if (nameEl) this.triggerLabel.textContent = nameEl.textContent.trim();
      }
    }

    customElements.define('store-locator', StoreLocator);
  });
}

/* global debounce */
if (!customElements.get('cart-note')) {
  class CartNote extends HTMLElement {
    constructor() {
      super();
      this.disclosure = this.closest('details');

      if (this.disclosure?.matches('.cart-note-disclosure')) {
        this.cartNoteToggle = this.disclosure.querySelector('.js-show-note');
      }

      this.fetchRequestOpts = {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      };

      this.init();
    }

    init() {
      this.debouncedHandleNoteChange = debounce(this.handleNoteChange.bind(this), 300);
      // Save as soon as possible, avoid link-click not providing time to save
      this.addEventListener('input', this.debouncedHandleNoteChange);
    }

    handleNoteChange(evt) {
      if (this.cartNoteToggle) {
        const label = evt.target.value ? theme.strings.editCartNote : theme.strings.addCartNote;
        if (this.cartNoteToggle.textContent !== label) this.cartNoteToggle.textContent = label;
      }

      this.fetchRequestOpts.body = JSON.stringify({ note: evt.target.value });
      fetch(theme.routes.cartUpdate, this.fetchRequestOpts)
        .then((response) => {
          if (!response.ok) throw new Error(response.status);
        })
        .catch((error) => {
          this.dispatchEvent(new CustomEvent('on:cart:error', {
            bubbles: true,
            detail: { error: error.message }
          }));
        });
    }
  }

  customElements.define('cart-note', CartNote);
}

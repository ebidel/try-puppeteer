/* global window document HTMLElement */

'use strict';

class CycleElement extends HTMLElement {
  static get is() {
    return 'cycler-element';
  }

  constructor() {
    super();
    this.index = 0;
    this.interval = 7000;
  }

  connectedCallback() {
    Array.from(this.children).forEach((el, i) => {
      if (i !== this.index) {
        el.classList.add('hiding');
      }
    });
    this.go();
  }

  disconnectedCallback() {
    this.stop();
  }

  go() {
    this._intervalId = setInterval(() => {
      this.next();
    }, this.interval);
  }

  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  next(reverse = false) {
    const children = Array.from(this.children);

    this.index = reverse ? this.index - 1 : this.index + 1;

    if (this.index < 0) {
      this.index = children.length - 1;
    } else if (this.index >= children.length) {
      this.index = 0;
    }

    children.forEach((el, i) => {
      el.classList.add('hiding');
      if (i === this.index) {
        el.classList.remove('hiding');
      }
    });
  }

  previous() {
    this.next(true);
  }
}

if (window.customElements) {
  window.customElements.define(CycleElement.is, CycleElement);
} else {
  document.addEventListener('DOMContentLoaded', e => {
    const items = Array.from(document.querySelectorAll(`${CycleElement.is} > .item`));
    items.slice(1).map(el => el.classList.add('hiding'));
  });
}

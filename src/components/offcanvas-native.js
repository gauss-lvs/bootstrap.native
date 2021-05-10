/* Native JavaScript for Bootstrap 5 | OffCanvas
------------------------------------------------ */
import queryElement from 'shorter-js/src/misc/queryElement.js';
import addEventListener from 'shorter-js/src/strings/addEventListener.js';
import removeEventListener from 'shorter-js/src/strings/removeEventListener.js';
import hasClass from 'shorter-js/src/class/hasClass.js';
import addClass from 'shorter-js/src/class/addClass.js';
import removeClass from 'shorter-js/src/class/removeClass.js';
import emulateTransitionEnd from 'shorter-js/src/misc/emulateTransitionEnd.js';
import getElementTransitionDuration from 'shorter-js/src/misc/getElementTransitionDuration.js';

import bootstrapCustomEvent from '../util/bootstrapCustomEvent.js';
import getTargetElement from '../util/getTargetElement.js';
import dataBsDismiss from '../strings/dataBsDismiss.js';
import dataBsToggle from '../strings/dataBsToggle.js';
import showClass from '../strings/showClass.js';
import ariaHidden from '../strings/ariaHidden.js';
import ariaModal from '../strings/ariaModal.js';
import ariaExpanded from '../strings/ariaExpanded.js';
import setFocus from '../util/setFocus.js';
import { resetScrollbar, setScrollbar, measureScrollbar } from '../util/scrollbar.js';
import {
  overlay,
  modalOpenClass,
  modalBackdropClass,
  offcanvasActiveSelector,
  appendOverlay,
  showOverlay,
  hideOverlay,
  getCurrentOpen,
  removeOverlay,
} from '../util/backdrop.js';
import BaseComponent from './base-component.js';

// OFFCANVAS PRIVATE GC
// ====================
const offcanvasString = 'offcanvas';
const offcanvasComponent = 'Offcanvas';
const OffcanvasSelector = `.${offcanvasString}`;
const offcanvasToggleSelector = `[${dataBsToggle}="${offcanvasString}"]`;
const offcanvasDismissSelector = `[${dataBsDismiss}="${offcanvasString}"]`;
const offcanvasTogglingClass = `${offcanvasString}-toggling`;
const offcanvasDefaultOptions = {
  backdrop: true, // boolean
  keyboard: true, // boolean
  scroll: false, // boolean
};

// OFFCANVAS CUSTOM EVENTS
// =======================
const showOffcanvasEvent = bootstrapCustomEvent(`show.bs.${offcanvasString}`);
const shownOffcanvasEvent = bootstrapCustomEvent(`shown.bs.${offcanvasString}`);
const hideOffcanvasEvent = bootstrapCustomEvent(`hide.bs.${offcanvasString}`);
const hiddenOffcanvasEvent = bootstrapCustomEvent(`hidden.bs.${offcanvasString}`);

// OFFCANVAS EVENT HANDLERS
// ========================
function offcanvasTriggerHandler(e) {
  const trigger = this;
  const element = getTargetElement(trigger);
  const self = element && element[offcanvasComponent];

  if (trigger.tagName === 'A') e.preventDefault();
  if (self) self.toggle(trigger);
}

function offcanvasDismissHandler(e) {
  const element = queryElement(offcanvasActiveSelector);
  const offCanvasDismiss = element && queryElement(offcanvasDismissSelector, element);
  const self = element && element[offcanvasComponent];
  const { open, triggers } = self;
  const { target } = e;
  const trigger = target.closest(offcanvasToggleSelector);

  if (trigger && trigger.tagName === 'A') e.preventDefault();

  if (self && open && ((!element.contains(target) && element !== target
    && (!trigger || (trigger && !triggers.includes(trigger))))
    || target === offCanvasDismiss)) {
    self.hide(target === offCanvasDismiss ? offCanvasDismiss : null);
  }
}

function offcanvasKeyDismissHandler({ which }) {
  const element = queryElement(offcanvasActiveSelector);
  const self = element && element[offcanvasComponent];

  if (self && self.options.keyboard && which === 27) {
    self.hide();
  }
}

function showOffcanvasComplete(self, related) {
  const { element, triggers } = self;
  removeClass(element, offcanvasTogglingClass);

  element.removeAttribute(ariaHidden);
  element.setAttribute(ariaModal, true);
  element.setAttribute('role', 'dialog');

  if (triggers.length) {
    triggers.forEach((btn) => btn.setAttribute(ariaExpanded, true));
  }

  shownOffcanvasEvent.relatedTarget = related || null;
  element.dispatchEvent(shownOffcanvasEvent);

  toggleOffCanvasDismiss(1);
  setFocus(element);
}

function hideOffcanvasComplete(self, related) {
  const { element, options, triggers } = self;
  element.setAttribute(ariaHidden, true);
  element.removeAttribute(ariaModal);
  element.removeAttribute('role');
  element.style.visibility = 'hidden';

  if (triggers.length) {
    setFocus(triggers[0]);
    triggers.forEach((btn) => btn.setAttribute(ariaExpanded, false));
  }

  hiddenOffcanvasEvent.relatedTarget = related || null;
  element.dispatchEvent(hiddenOffcanvasEvent);
  removeClass(element, offcanvasTogglingClass);

  // handle new offcanvas showing up
  if (!queryElement(offcanvasActiveSelector)) {
    if (options.backdrop) removeOverlay();
    if (!options.scroll) {
      resetScrollbar();
      removeClass(document.body, modalOpenClass);
    }
  }
}

// OFFCANVAS PRIVATE METHODS
// =========================
function toggleOffcanvasEvents(self, add) {
  const { triggers } = self;
  const action = add ? addEventListener : removeEventListener;

  triggers.forEach((btn) => btn[action]('click', offcanvasTriggerHandler));
}

function toggleOffCanvasDismiss(add) {
  const action = add ? addEventListener : removeEventListener;
  document[action]('keydown', offcanvasKeyDismissHandler);
  document[action]('click', offcanvasDismissHandler);
}

function setOffCanvasScrollbar(self) {
  const bd = document.body;
  const html = document.documentElement;
  const openOffCanvas = hasClass(bd, modalOpenClass);
  const bodyOverflow = html.clientHeight !== html.scrollHeight
                    || bd.clientHeight !== bd.scrollHeight;
  setScrollbar(self.scrollbarWidth, bodyOverflow, openOffCanvas);
}

function beforeOffcanvasShow(self, related) {
  // const {element} = self;

  emulateTransitionEnd(self.element, () => showOffcanvasComplete(self, related));
}

function beforeOffcanvasHide(self, related) {
  const { element } = self;

  element.blur();
  self.open = false;
  toggleOffCanvasDismiss();

  emulateTransitionEnd(element, () => hideOffcanvasComplete(self, related));
}

// OFFCANVAS DEFINITION
// ====================
export default class Offcanvas extends BaseComponent {
  constructor(target, config) {
    super(offcanvasComponent, target, offcanvasDefaultOptions, config);
    const self = this;

    // instance element
    const { element } = self;

    // all the triggering buttons
    self.triggers = Array.from(document.querySelectorAll(offcanvasToggleSelector))
      .filter((btn) => getTargetElement(btn) === element);

    // additional instance property
    self.open = false;
    self.scrollbarWidth = measureScrollbar();

    // attach event listeners
    toggleOffcanvasEvents(self, 1);
  }

  // OFFCANVAS PUBLIC METHODS
  // ========================
  toggle(related) {
    const self = this;
    return self.open ? self.hide(related) : self.show(related);
  }

  show(related) {
    const self = this[offcanvasComponent] ? this[offcanvasComponent] : this;
    const { element, options } = self;
    const currentOpen = getCurrentOpen();
    let overlayDelay = 0;

    if (currentOpen && currentOpen !== element) {
      const that = currentOpen.Modal
        ? currentOpen.Modal
        : currentOpen[offcanvasComponent];
      that.hide();
    }

    if (self.open) return;

    showOffcanvasEvent.relatedTarget = related || null;
    element.dispatchEvent(showOffcanvasEvent);

    if (showOffcanvasEvent.defaultPrevented) return;

    self.open = true;

    if (!options.scroll) {
      addClass(document.body, modalOpenClass);
      setOffCanvasScrollbar(self);
    }

    addClass(element, offcanvasTogglingClass);
    addClass(element, showClass);
    element.style.visibility = 'visible';

    if (options.backdrop) {
      if (!queryElement(`.${modalBackdropClass}`)) {
        appendOverlay(1);
      }

      overlayDelay = getElementTransitionDuration(overlay);

      if (!currentOpen && !hasClass(overlay, showClass)) showOverlay();
      setTimeout(() => beforeOffcanvasShow(self, related), overlayDelay);
    } else beforeOffcanvasShow(self, related);
  }

  hide(related) {
    const self = this;
    const { element, options } = self;
    const currentOpen = getCurrentOpen();

    if (!self.open) return;

    hideOffcanvasEvent.relatedTarget = related || null;
    element.dispatchEvent(hideOffcanvasEvent);
    if (hideOffcanvasEvent.defaultPrevented) return;

    addClass(element, offcanvasTogglingClass);
    removeClass(element, showClass);

    if (!currentOpen && options.backdrop) {
      hideOverlay();
      emulateTransitionEnd(overlay, () => beforeOffcanvasHide(self, related));
    } else beforeOffcanvasHide(self, related);
  }

  dispose() {
    toggleOffcanvasEvents(this);
    super.dispose(offcanvasComponent);
  }
}

Offcanvas.init = {
  component: offcanvasComponent,
  selector: OffcanvasSelector,
  constructor: Offcanvas,
};

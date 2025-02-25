/* Native JavaScript for Bootstrap 5 | ScrollSpy
------------------------------------------------ */
import getAttribute from 'shorter-js/src/attr/getAttribute';
import querySelector from 'shorter-js/src/selectors/querySelector';
import getElementsByTagName from 'shorter-js/src/selectors/getElementsByTagName';
import addClass from 'shorter-js/src/class/addClass';
import hasClass from 'shorter-js/src/class/hasClass';
import removeClass from 'shorter-js/src/class/removeClass';
import getWindow from 'shorter-js/src/get/getWindow';
import getDocument from 'shorter-js/src/get/getDocument';
import getDocumentElement from 'shorter-js/src/get/getDocumentElement';
import getDocumentBody from 'shorter-js/src/get/getDocumentBody';
import getBoundingClientRect from 'shorter-js/src/get/getBoundingClientRect';
import dispatchEvent from 'shorter-js/src/misc/dispatchEvent';
import passiveHandler from 'shorter-js/src/misc/passiveHandler';
import ObjectAssign from 'shorter-js/src/misc/ObjectAssign';
import scrollEvent from 'shorter-js/src/strings/scrollEvent';
import { getInstance } from 'shorter-js/src/misc/data';
import OriginalEvent from 'shorter-js/src/misc/OriginalEvent';

import { addListener, removeListener } from 'event-listener.js';

import activeClass from '../strings/activeClass';
import scrollspyString from '../strings/scrollspyString';
import scrollspyComponent from '../strings/scrollspyComponent';

import BaseComponent from './base-component';

// console.log(typeof addEventListener)

// SCROLLSPY PRIVATE GC
// ====================
const scrollspySelector = '[data-bs-spy="scroll"]';

const scrollspyDefaults = {
  offset: 10,
  target: null,
};

/**
 * Static method which returns an existing `ScrollSpy` instance associated
 * to a target `Element`.
 *
 * @type {BSN.GetInstance<ScrollSpy>}
 */
const getScrollSpyInstance = (element) => getInstance(element, scrollspyComponent);

/**
 * A `ScrollSpy` initialization callback.
 * @type {BSN.InitCallback<ScrollSpy>}
 */
const scrollspyInitCallback = (element) => new ScrollSpy(element);

// SCROLLSPY CUSTOM EVENT
// ======================
const activateScrollSpy = OriginalEvent(`activate.bs.${scrollspyString}`);

// SCROLLSPY PRIVATE METHODS
// =========================
/**
 * Update the state of all items.
 * @param {ScrollSpy} self the `ScrollSpy` instance
 */
function updateSpyTargets(self) {
  const {
    target, scrollTarget, options, itemsLength, scrollHeight, element,
  } = self;
  const { offset } = options;
  const isWin = scrollTarget instanceof Window;

  const links = target && getElementsByTagName('A', target);
  const scrollHEIGHT = scrollTarget && getScrollHeight(scrollTarget);

  // @ts-ignore
  self.scrollTop = isWin ? scrollTarget.scrollY : scrollTarget.scrollTop;

  // only update items/offsets once or with each mutation
  if (links && (itemsLength !== links.length || scrollHEIGHT !== scrollHeight)) {
    let href;
    let targetItem;
    let rect;

    // reset arrays & update
    self.items = [];
    self.offsets = [];
    self.scrollHeight = scrollHEIGHT;
    self.maxScroll = self.scrollHeight - getOffsetHeight(self);

    [...links].forEach((link) => {
      href = getAttribute(link, 'href');
      targetItem = href && href.charAt(0) === '#' && href.slice(-1) !== '#'
        && querySelector(href, getDocument(element));

      if (targetItem) {
        self.items.push(link);
        rect = getBoundingClientRect(targetItem);
        // @ts-ignore
        self.offsets.push((isWin ? rect.top + self.scrollTop : targetItem.offsetTop) - offset);
      }
    });
    self.itemsLength = self.items.length;
  }
}

/**
 * Returns the `scrollHeight` property of the scrolling element.
 * @param {HTMLElement | Element | Window | globalThis} scrollTarget the `ScrollSpy` instance
 * @return {number} `scrollTarget` height
 */
function getScrollHeight(scrollTarget) {
  return scrollTarget instanceof HTMLElement
    ? scrollTarget.scrollHeight // @ts-ignore
    : getDocumentElement(scrollTarget).scrollHeight;
}

/**
 * Returns the height property of the scrolling element.
 * @param {ScrollSpy} params the `ScrollSpy` instance
 * @returns {number}
 */
function getOffsetHeight({ element, scrollTarget }) {
  return (scrollTarget instanceof Window)
    ? scrollTarget.innerHeight
    : getBoundingClientRect(element).height;
}

/**
 * Clear all items of the target.
 * @param {HTMLElement | Element} target a single item
 */
function clear(target) {
  [...getElementsByTagName('A', target)].forEach((item) => {
    if (hasClass(item, activeClass)) removeClass(item, activeClass);
  });
}

/**
 * Activates a new item.
 * @param {ScrollSpy} self the `ScrollSpy` instance
 * @param {HTMLElement | Element} item a single item
 */
function activate(self, item) {
  const { target, element } = self;
  // @ts-ignore
  clear(target);
  // @ts-ignore
  self.activeItem = item;
  addClass(item, activeClass);

  // activate all parents
  const parents = [];
  let parentItem = item;
  while (parentItem !== getDocumentBody(element)) {
    // @ts-ignore
    parentItem = parentItem.parentElement;
    if (hasClass(parentItem, 'nav') || hasClass(parentItem, 'dropdown-menu')) parents.push(parentItem);
  }

  parents.forEach((menuItem) => {
    /** @type {(HTMLElement | Element)?} */
    const parentLink = menuItem.previousElementSibling;

    if (parentLink && !hasClass(parentLink, activeClass)) {
      addClass(parentLink, activeClass);
    }
  });

  // dispatch
  activateScrollSpy.relatedTarget = item;
  dispatchEvent(element, activateScrollSpy);
}

/**
 * Toggles on/off the component event listener.
 * @param {ScrollSpy} self the `ScrollSpy` instance
 * @param {boolean=} add when `true`, listener is added
 */
function toggleSpyHandlers(self, add) {
  const action = add ? addListener : removeListener;
  // @ts-ignore
  action(self.scrollTarget, scrollEvent, self.refresh, passiveHandler);
}

// SCROLLSPY DEFINITION
// ====================
/** Returns a new `ScrollSpy` instance. */
export default class ScrollSpy extends BaseComponent {
  /**
   * @param {HTMLElement | Element | string} target the target element
   * @param {BSN.Options.ScrollSpy=} config the instance options
   */
  constructor(target, config) {
    super(target, config);
    // bind
    const self = this;

    // initialization element & options
    const { element, options } = self;

    // additional properties
    /** @type {(HTMLElement | Element)?} */
    self.target = querySelector(options.target, getDocument(element));

    // invalidate
    if (!self.target) return;

    const win = getWindow(element);

    // set initial state
    /** @type {HTMLElement | Element | Window | globalThis} */
    self.scrollTarget = element.clientHeight < element.scrollHeight ? element : win;
    /** @type {number} */
    self.scrollTop = 0;
    /** @type {number} */
    self.maxScroll = 0;
    /** @type {number} */
    self.scrollHeight = 0;
    /** @type {(HTMLElement | Element)?} */
    self.activeItem = null;
    /** @type {(HTMLElement | Element)[]} */
    self.items = [];
    /** @type {number} */
    self.itemsLength = 0;
    /** @type {number[]} */
    self.offsets = [];

    // bind events
    self.refresh = self.refresh.bind(self);

    // add event handlers
    toggleSpyHandlers(self, true);

    self.refresh();
  }

  /* eslint-disable */
  /**
   * Returns component name string.
   * @readonly @static
   */
  get name() { return scrollspyComponent; }
  /**
   * Returns component default options.
   * @readonly @static
   */
  get defaults() { return scrollspyDefaults; }
  /* eslint-enable */

  // SCROLLSPY PUBLIC METHODS
  // ========================
  /** Updates all items. */
  refresh() {
    const self = this;
    const { target } = self;

    // check if target is visible and invalidate
    // @ts-ignore
    if (target.offsetHeight === 0) return;

    updateSpyTargets(self);

    const {
      scrollTop, maxScroll, itemsLength, items, activeItem,
    } = self;

    if (scrollTop >= maxScroll) {
      const newActiveItem = items[itemsLength - 1];

      if (activeItem !== newActiveItem) {
        activate(self, newActiveItem);
      }
      return;
    }

    const { offsets } = self;

    if (activeItem && scrollTop < offsets[0] && offsets[0] > 0) {
      self.activeItem = null;
      // @ts-ignore
      clear(target);
      return;
    }

    items.forEach((item, i) => {
      if (activeItem !== item && scrollTop >= offsets[i]
        && (typeof offsets[i + 1] === 'undefined' || scrollTop < offsets[i + 1])) {
        activate(self, item);
      }
    });
  }

  /** Removes `ScrollSpy` from the target element. */
  dispose() {
    toggleSpyHandlers(this);
    super.dispose();
  }
}

ObjectAssign(ScrollSpy, {
  selector: scrollspySelector,
  init: scrollspyInitCallback,
  getInstance: getScrollSpyInstance,
});

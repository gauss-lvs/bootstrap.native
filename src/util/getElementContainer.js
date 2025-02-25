import getParentNode from 'shorter-js/src/get/getParentNode';
import getElementStyle from 'shorter-js/src/get/getElementStyle';
import isTableElement from 'shorter-js/src/is/isTableElement';
import isShadowRoot from 'shorter-js/src/is/isShadowRoot';
import isHTMLElement from 'shorter-js/src/is/isHTMLElement';
import getWindow from 'shorter-js/src/get/getWindow';
import getDocumentBody from 'shorter-js/src/get/getDocumentBody';

/**
 * Returns an `HTMLElement` to be used as default value for *options.container*
 * for `Tooltip` / `Popover` components.
 *
 * When `getOffset` is *true*, it returns the `offsetParent` for tooltip/popover
 * offsets computation similar to **floating-ui**.
 * @see https://github.com/floating-ui/floating-ui
 *
 * @param {HTMLElement | Element} element the target
 * @param {boolean=} getOffset when *true* it will return an `offsetParent`
 * @returns {HTMLElement | HTMLBodyElement | Window | globalThis} the query result
 */
export default function getElementContainer(element, getOffset) {
  const majorBlockTags = ['HTML', 'BODY'];

  if (getOffset) {
    /** @type {any} */
    let { offsetParent } = element;
    const win = getWindow(element);
    // const { innerWidth } = getDocumentElement(element);

    while (offsetParent && (isTableElement(offsetParent)
      || (isHTMLElement(offsetParent)
        // we must count for both fixed & sticky
        && !['sticky', 'fixed'].includes(getElementStyle(offsetParent, 'position'))))) {
      offsetParent = offsetParent.offsetParent;
    }

    if (!offsetParent || (offsetParent
      && (majorBlockTags.includes(offsetParent.tagName)
        || getElementStyle(offsetParent, 'position') === 'static'))) {
      offsetParent = win;
    }
    return offsetParent;
  }

  /** @type {(HTMLElement)[]} */
  const containers = [];
  /** @type {any} */
  let { parentNode } = element;

  while (parentNode && !majorBlockTags.includes(parentNode.nodeName)) {
    parentNode = getParentNode(parentNode);
    if (!(isShadowRoot(parentNode) || !!parentNode.shadowRoot
      || isTableElement(parentNode))) {
      containers.push(parentNode);
    }
  }

  return containers.find((c, i) => {
    if (getElementStyle(c, 'position') !== 'relative'
      && containers.slice(i + 1).every((r) => getElementStyle(r, 'position') === 'static')) {
      return c;
    }
    return null;
  }) || getDocumentBody(element);
}

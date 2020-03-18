// https://github.com/davidtheclark/tabbable/blob/master/src/index.js

let candidateSelectors = [
  'input',
  'select',
  'textarea',
  'a[href]',
  'button',
  '[tabindex]',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
];
let candidateSelector = candidateSelectors.join(',');

let matches: (selector: string) => boolean =
  typeof Element === 'undefined'
    ? () => false
    : Element.prototype.matches ||
      (Element.prototype as any).msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;

type TabbableOptions = {
  includeContainer?: boolean,
};

function getHTMLElements(root: Element, selector: string): HTMLElement[] {
  const result: HTMLElement[] = [];

  for (let el of root.querySelectorAll(selector)) {
    if (el instanceof HTMLElement) {
      result.push(el);
    }
  }

  return result;
}

type OrderedTabbable = {
  documentOrder: number,
  tabIndex: number,
  node: HTMLElement,
};

export function tabbable(el: HTMLElement, optionalOptions?: TabbableOptions): HTMLElement[] {
  const options = optionalOptions || {};

  let regularTabbables: HTMLElement[] = [];
  let orderedTabbables: OrderedTabbable[] = [];

  let candidates = getHTMLElements(el, candidateSelector);

  if (options.includeContainer) {
    if (matches.call(el, candidateSelector)) {
      candidates = Array.prototype.slice.apply(candidates);
      candidates.unshift(el);
    }
  }

  let candidate;
  let candidateTabindex;
  for (let i = 0; i < candidates.length; i++) {
    candidate = candidates[i];

    if (!isNodeMatchingSelectorTabbable(candidate)) {
      continue;
    }

    candidateTabindex = getTabindex(candidate);
    if (candidateTabindex === 0) {
      regularTabbables.push(candidate);
    } else {
      orderedTabbables.push({
        documentOrder: i,
        tabIndex: candidateTabindex,
        node: candidate,
      });
    }
  }

  let tabbableNodes = orderedTabbables
    .sort(sortOrderedTabbables)
    .map(a => a.node)
    .concat(regularTabbables);

  return tabbableNodes;
}

tabbable.isTabbable = isTabbable;
tabbable.isFocusable = isFocusable;

function isNodeMatchingSelectorTabbable(node: HTMLElement): boolean {
  if (
    !isNodeMatchingSelectorFocusable(node) ||
    isNonTabbableRadio(node) ||
    getTabindex(node) < 0
  ) {
    return false;
  }
  return true;
}

function isTabbable(node: HTMLElement): boolean {
  if (!node) {
    throw new Error('No node provided');
  }
  if (matches.call(node, candidateSelector) === false) {
    return false;
  }
  return isNodeMatchingSelectorTabbable(node);
}

function isNodeMatchingSelectorFocusable(node: HTMLElement): boolean {
  if ((node as any).disabled || isHiddenInput(node) || isHidden(node)) {
    return false;
  }
  return true;
}

let focusableCandidateSelector = candidateSelectors.concat('iframe').join(',');

function isFocusable(node?: EventTarget|HTMLElement|null): boolean {
  if (!node) {
    throw new Error('No node provided');
  }

  // Added this to make TypeScript work.
  if (!(node instanceof HTMLElement)) return false;

  if (matches.call(node, focusableCandidateSelector) === false) {
    return false;
  }
  return isNodeMatchingSelectorFocusable(node);
}

function getTabindex(node: HTMLElement): number {
  let tabindexAttr = parseInt(node.getAttribute('tabindex') || '', 10);
  if (!isNaN(tabindexAttr)) {
    return tabindexAttr;
  }
  // Browsers do not return `tabIndex` correctly for contentEditable nodes;
  // so if they don't have a tabindex attribute specifically set, assume it's 0.
  if (isContentEditable(node)) {
    return 0;
  }
  return node.tabIndex;
}

function sortOrderedTabbables(a: OrderedTabbable, b: OrderedTabbable): number {
  return a.tabIndex === b.tabIndex
    ? a.documentOrder - b.documentOrder
    : a.tabIndex - b.tabIndex;
}

function isContentEditable(node: HTMLElement): boolean {
  return node.contentEditable === 'true';
}

function isInput(node: Element): node is HTMLInputElement {
  return node.tagName === 'INPUT';
}

function isHiddenInput(node: Element): boolean {
  return isInput(node) && node.type === 'hidden';
}

function isRadio(node: Element): node is HTMLInputElement {
  return isInput(node) && node.type === 'radio';
}

function isNonTabbableRadio(node: Element): boolean {
  return isRadio(node) && !isTabbableRadio(node);
}

function getCheckedRadio(nodes: HTMLInputElement[]): HTMLInputElement|undefined {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].checked) {
      return nodes[i];
    }
  }
  return undefined;
}

function isTabbableRadio(node: HTMLInputElement): boolean {
  if (!node.name) {
    return true;
  }
  if (!node.ownerDocument) {
    // Need this for TypeScript to be OK with the rest of this code.
    // I guess we'll just assume that anything without an owner
    // document isn't tabbable...
    return false;
  }
  // This won't account for the edge case where you have radio groups with the same
  // in separate forms on the same page.
  let radioSet = Array.from(node.ownerDocument.querySelectorAll(
    'input[type="radio"][name="' + node.name + '"]'
  )) as HTMLInputElement[];
  let checked = getCheckedRadio(radioSet);
  return !checked || checked === node;
}

function isHidden(node: HTMLElement): boolean {
  // offsetParent being null will allow detecting cases where an element is invisible or inside an invisible element,
  // as long as the element does not use position: fixed. For them, their visibility has to be checked directly as well.
  return (
    node.offsetParent === null || getComputedStyle(node).visibility === 'hidden'
  );
}

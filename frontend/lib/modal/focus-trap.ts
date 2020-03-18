// https://github.com/davidtheclark/focus-trap/blob/master/index.js

import { tabbable } from './tabbable';

var activeFocusDelay: number|undefined;

var activeFocusTraps = (function() {
  var trapQueue: FocusTrap[] = [];
  return {
    activateTrap: function(trap: FocusTrap) {
      if (trapQueue.length > 0) {
        var activeTrap = trapQueue[trapQueue.length - 1];
        if (activeTrap !== trap) {
          activeTrap.pause();
        }
      }

      var trapIndex = trapQueue.indexOf(trap);
      if (trapIndex === -1) {
        trapQueue.push(trap);
      } else {
        // move this existing trap to the front of the queue
        trapQueue.splice(trapIndex, 1);
        trapQueue.push(trap);
      }
    },

    deactivateTrap: function(trap: FocusTrap) {
      var trapIndex = trapQueue.indexOf(trap);
      if (trapIndex !== -1) {
        trapQueue.splice(trapIndex, 1);
      }

      if (trapQueue.length > 0) {
        trapQueue[trapQueue.length - 1].unpause();
      }
    }
  };
})();

type OptionalNodeThingy = Element|string|(() => Element);

export type FocusTrapOptions = {
  returnFocusOnDeactivate: boolean,
  escapeDeactivates: boolean,
  preventScroll?: boolean,
  clickOutsideDeactivates?: boolean,
  allowOutsideClick?: (event: MouseEvent|TouchEvent) => boolean,
  onActivate?: () => void,
  onDeactivate?: () => void,
  initialFocus?: OptionalNodeThingy,
  fallbackFocus?: OptionalNodeThingy,
  setReturnFocus?: OptionalNodeThingy,
};

type ActivateOptions = {
  onActivate?: () => void
};

type DeactivateOptions = {
  onDeactivate?: () => void,
  returnFocus?: boolean,
};

export interface FocusTrap {
  activate: (options?: ActivateOptions) => void,
  deactivate: (options?: DeactivateOptions) => void,
  pause: () => void,
  unpause: () => void,
}

function getHTMLElement(doc: HTMLDocument, selector: string): HTMLElement {
  const el = doc.querySelector(selector);
  if (!(el && el instanceof HTMLElement)) {
    throw new Error(`No HTML element matches "${selector}"!`);
  }
  return el;
}

type FocusTrapState = {
  firstTabbableNode: Element|null,
  lastTabbableNode: Element|null,
  nodeFocusedBeforeActivation: Element|null,
  mostRecentlyFocusedNode: Element|null,
  active: boolean,
  paused: boolean,
};

export function createFocusTrap(element: HTMLElement|string, userOptions: Partial<FocusTrapOptions>): FocusTrap {
  var doc = document;
  const container =
    typeof element === 'string' ? getHTMLElement(doc, element) : element;

  var config: FocusTrapOptions = {
    returnFocusOnDeactivate: true,
    escapeDeactivates: true,
    ...userOptions,
  };

  var state: FocusTrapState = {
    firstTabbableNode: null,
    lastTabbableNode: null,
    nodeFocusedBeforeActivation: null,
    mostRecentlyFocusedNode: null,
    active: false,
    paused: false
  };

  var trap: FocusTrap = {
    activate,
    deactivate,
    pause,
    unpause
  };

  return trap;

  function activate(activateOptions?: ActivateOptions) {
    if (state.active) return;

    updateTabbableNodes();

    state.active = true;
    state.paused = false;
    state.nodeFocusedBeforeActivation = doc.activeElement;

    var onActivate =
      activateOptions && activateOptions.onActivate
        ? activateOptions.onActivate
        : config.onActivate;
    if (onActivate) {
      onActivate();
    }

    addListeners();
    return trap;
  }

  function deactivate(deactivateOptions?: DeactivateOptions) {
    if (!state.active) return;

    clearTimeout(activeFocusDelay);

    removeListeners();
    state.active = false;
    state.paused = false;

    activeFocusTraps.deactivateTrap(trap);

    var onDeactivate =
      deactivateOptions && deactivateOptions.onDeactivate !== undefined
        ? deactivateOptions.onDeactivate
        : config.onDeactivate;
    if (onDeactivate) {
      onDeactivate();
    }

    var returnFocus =
      deactivateOptions && deactivateOptions.returnFocus !== undefined
        ? deactivateOptions.returnFocus
        : config.returnFocusOnDeactivate;
    if (returnFocus) {
      delay(function() {
        tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
      });
    }

    return trap;
  }

  function containerContains(el: Node|EventTarget|null): boolean {
    if (el && el instanceof Node) return container.contains(el);
    return false;
  }

  function pause() {
    if (state.paused || !state.active) return;
    state.paused = true;
    removeListeners();
  }

  function unpause() {
    if (!state.paused || !state.active) return;
    state.paused = false;
    updateTabbableNodes();
    addListeners();
  }

  function addListeners() {
    if (!state.active) return;

    // There can be only one listening focus trap at a time
    activeFocusTraps.activateTrap(trap);

    // Delay ensures that the focused element doesn't capture the event
    // that caused the focus trap activation.
    activeFocusDelay = delay(function() {
      tryFocus(getInitialFocusNode());
    });

    doc.addEventListener('focusin', checkFocusIn, true);
    doc.addEventListener('mousedown', checkPointerDown, {
      capture: true,
      passive: false
    });
    doc.addEventListener('touchstart', checkPointerDown, {
      capture: true,
      passive: false
    });
    doc.addEventListener('click', checkClick, {
      capture: true,
      passive: false
    });
    doc.addEventListener('keydown', checkKey, {
      capture: true,
      passive: false
    });

    return trap;
  }

  function removeListeners() {
    if (!state.active) return;

    doc.removeEventListener('focusin', checkFocusIn, true);
    doc.removeEventListener('mousedown', checkPointerDown, true);
    doc.removeEventListener('touchstart', checkPointerDown, true);
    doc.removeEventListener('click', checkClick, true);
    doc.removeEventListener('keydown', checkKey, true);

    return trap;
  }

  function getNodeForOption(optionName: keyof FocusTrapOptions): Element|null {
    var optionValue = (config[optionName] as any);
    var node: any = optionValue;
    if (!optionValue) {
      return null;
    }
    if (typeof optionValue === 'string') {
      node = doc.querySelector(optionValue);
      if (!node) {
        throw new Error('`' + optionName + '` refers to no known node');
      }
    }
    if (typeof optionValue === 'function') {
      node = optionValue();
      if (!node) {
        throw new Error('`' + optionName + '` did not return a node');
      }
    }
    return node;
  }

  function getInitialFocusNode() {
    var node;
    if (getNodeForOption('initialFocus') !== null) {
      node = getNodeForOption('initialFocus');
    } else if (container.contains(doc.activeElement)) {
      node = doc.activeElement;
    } else {
      node = state.firstTabbableNode || getNodeForOption('fallbackFocus');
    }

    if (!node) {
      throw new Error(
        'Your focus-trap needs to have at least one focusable element'
      );
    }

    return node;
  }

  function getReturnFocusNode(previousActiveElement: Element|null): Element|null {
    var node = getNodeForOption('setReturnFocus');
    return node ? node : previousActiveElement;
  }

  // This needs to be done on mousedown and touchstart instead of click
  // so that it precedes the focus event.
  function checkPointerDown(e: MouseEvent|TouchEvent) {
    if (containerContains(e.target)) return;
    if (config.clickOutsideDeactivates) {
      deactivate({
        returnFocus: !tabbable.isFocusable(e.target)
      });
      return;
    }
    // This is needed for mobile devices.
    // (If we'll only let `click` events through,
    // then on mobile they will be blocked anyways if `touchstart` is blocked.)
    if (config.allowOutsideClick && config.allowOutsideClick(e)) {
      return;
    }
    e.preventDefault();
  }

  // In case focus escapes the trap for some strange reason, pull it back in.
  function checkFocusIn(e: FocusEvent) {
    // In Firefox when you Tab out of an iframe the Document is briefly focused.
    if (containerContains(e.target) || e.target instanceof Document) {
      return;
    }
    e.stopImmediatePropagation();
    tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
  }

  function checkKey(e: KeyboardEvent) {
    if (config.escapeDeactivates !== false && isEscapeEvent(e)) {
      e.preventDefault();
      deactivate();
      return;
    }
    if (isTabEvent(e)) {
      checkTab(e);
      return;
    }
  }

  // Hijack Tab events on the first and last focusable nodes of the trap,
  // in order to prevent focus from escaping. If it escapes for even a
  // moment it can end up scrolling the page and causing confusion so we
  // kind of need to capture the action at the keydown phase.
  function checkTab(e: KeyboardEvent) {
    updateTabbableNodes();
    if (e.shiftKey && e.target === state.firstTabbableNode) {
      e.preventDefault();
      tryFocus(state.lastTabbableNode);
      return;
    }
    if (!e.shiftKey && e.target === state.lastTabbableNode) {
      e.preventDefault();
      tryFocus(state.firstTabbableNode);
      return;
    }
  }

  function checkClick(e: MouseEvent) {
    if (config.clickOutsideDeactivates) return;
    if (containerContains(e.target)) return;
    if (config.allowOutsideClick && config.allowOutsideClick(e)) {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function updateTabbableNodes() {
    var tabbableNodes = tabbable(container);
    state.firstTabbableNode = tabbableNodes[0] || getInitialFocusNode();
    state.lastTabbableNode =
      tabbableNodes[tabbableNodes.length - 1] || getInitialFocusNode();
  }

  function tryFocus(node: any) {
    if (node === doc.activeElement) return;
    if (!node || !node.focus) {
      tryFocus(getInitialFocusNode());
      return;
    }
    node.focus({preventScroll: userOptions.preventScroll});
    state.mostRecentlyFocusedNode = node;
    if (isSelectableInput(node)) {
      node.select();
    }
  }
}

function isSelectableInput(node: any): node is HTMLInputElement {
  return (
    node.tagName &&
    node.tagName.toLowerCase() === 'input' &&
    typeof (node as any).select === 'function'
  );
}

function isEscapeEvent(e: KeyboardEvent): boolean {
  return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
}

function isTabEvent(e: KeyboardEvent): boolean {
  return e.key === 'Tab' || e.keyCode === 9;
}

function delay(fn: Function): number {
  return window.setTimeout(fn, 0);
}

// https://github.com/davidtheclark/focus-trap-react/blob/master/src/focus-trap-react.js

import React from 'react';
import ReactDOM from 'react-dom';

import { createFocusTrap, FocusTrap, FocusTrapOptions } from './focus-trap';

export type ReactFocusTrapProps = {
  focusTrapOptions: Partial<FocusTrapOptions>,
  _createFocusTrap: typeof createFocusTrap,
  active: boolean,
  paused: boolean,
};

function isFocusableElement(el: Element): el is HTMLElement {
  // This isn't actually a great way of testing this, but we want to
  // preserve the original behavior while also satisfying TypeScript.
  return (el as any).focus;
}

export class ReactFocusTrap extends React.Component<ReactFocusTrapProps> {
  previouslyFocusedElement: undefined|null|Element;
  focusTrapElement: Element|undefined;
  focusTrap: FocusTrap|undefined;

  static defaultProps = {
    active: true,
    paused: false,
    focusTrapOptions: {},
    _createFocusTrap: createFocusTrap
  };

  constructor(props: ReactFocusTrapProps) {
    super(props)

    if (typeof document !== 'undefined') {
      this.previouslyFocusedElement = document.activeElement;
    }
  }

  componentDidMount() {
    // We need to hijack the returnFocusOnDeactivate option,
    // because React can move focus into the element before we arrived at
    // this lifecycle hook (e.g. with autoFocus inputs). So the component
    // captures the previouslyFocusedElement in componentWillMount,
    // then (optionally) returns focus to it in componentWillUnmount.
    const specifiedFocusTrapOptions = this.props.focusTrapOptions;
    const tailoredFocusTrapOptions: Partial<FocusTrapOptions> = {
      returnFocusOnDeactivate: false
    };
    for (const optionName in specifiedFocusTrapOptions) {
      if (!specifiedFocusTrapOptions.hasOwnProperty(optionName)) continue;
      if (optionName === 'returnFocusOnDeactivate') continue;
      (tailoredFocusTrapOptions as any)[optionName] =
        (specifiedFocusTrapOptions as any)[optionName];
    }

    const focusTrapElementDOMNode = ReactDOM.findDOMNode(this.focusTrapElement);

    if (!(focusTrapElementDOMNode instanceof HTMLElement)) {
      throw new Error("Focus trap element DOM node is not an HTML element!");
    }

    this.focusTrap = this.props._createFocusTrap(
      focusTrapElementDOMNode,
      tailoredFocusTrapOptions
    );
    if (this.props.active) {
      this.focusTrap.activate();
    }
    if (this.props.paused) {
      this.focusTrap.pause();
    }
  }

  componentDidUpdate(prevProps: ReactFocusTrapProps) {
    if (!this.focusTrap) {
      throw new Error('Assertion failure!');
    }

    if (prevProps.active && !this.props.active) {
      const { returnFocusOnDeactivate } = this.props.focusTrapOptions;
      const returnFocus = returnFocusOnDeactivate || false;
      const config = { returnFocus };
      this.focusTrap.deactivate(config);
    } else if (!prevProps.active && this.props.active) {
      this.focusTrap.activate();
    }

    if (prevProps.paused && !this.props.paused) {
      this.focusTrap.unpause();
    } else if (!prevProps.paused && this.props.paused) {
      this.focusTrap.pause();
    }
  }

  componentWillUnmount() {
    if (!this.focusTrap) {
      throw new Error('Assertion failure!');
    }

    this.focusTrap.deactivate();
    if (
      this.props.focusTrapOptions.returnFocusOnDeactivate !== false &&
      this.previouslyFocusedElement &&
      isFocusableElement(this.previouslyFocusedElement)
    ) {
      this.previouslyFocusedElement.focus();
    }
  }

  setFocusTrapElement = (element: Element) => {
    this.focusTrapElement = element;
  };

  render() {
    const child: any = React.Children.only(this.props.children);

    const composedRefCallback = (element: Element) => {
      this.setFocusTrapElement(element);
      if (typeof child.ref === 'function') {
        child.ref(element);
      }
    }

    const childWithRef = React.cloneElement(child, { ref: composedRefCallback });

    return childWithRef;
  }
}

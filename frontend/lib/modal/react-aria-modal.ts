// https://github.com/davidtheclark/react-aria-modal/blob/master/src/react-aria-modal.js

import React from 'react';

import * as noScroll from './no-scroll';
import { FocusTrapOptions } from './focus-trap';
import { ReactFocusTrap } from './focus-trap-react';
import { displace } from './react-displace';

export interface AriaModalProps {
  /**
   * If true, the modal will receive a role of alertdialog,
   * instead of its default dialog.
   */
  alert?: boolean;

  /**
   * By default, the modal is active when mounted, deactivated when unmounted.
   * However, you can also control its active/inactive state by changing
   * its mounted property instead.
   */
  mounted?: boolean;

  /**
   * Provide your main application node here (which the modal should
   * render outside of), and when the modal is open this application
   * node will receive the attribute `aria-hidden="true"`.
   * This can help screen readers understand what's going on.
   */
  applicationNode?: Node | Element;

  /**
   * Same as `applicationNode`, but a function that returns the node
   * instead of the node itself. This can be useful or necessary in
   * a variety of situations, one of which is server-side React
   * rendering. The function will not be called until after the
   * component mounts, so it is safe to use browser globals
   * and refer to DOM nodes within it (e.g. `document.getElementById(..)`),
   * without ruining your server-side rendering.
   */
  getApplicationNode?(): Node | Element;

  /**
   * By default, styles are applied inline to the dialog and underlay
   * portions of the component. However, you can disable all inline
   * styles by setting `includeDefaultStyles` to false. If set, you
   * must specify all styles externally, including positioning.
   * This is helpful if your project uses external CSS assets.
   *
   * _Note_: underlayStyle and dialogStyle can still be set inline,
   * but these will be the only styles applied.
   */
  includeDefaultStyles?: boolean;

  /**
   * Apply a class to the dialog in order to custom-style it.
   *
   * Be aware that, _by default_, this module does apply various
   * inline styles to the dialog element in order position it.
   * To disable _all inline styles_, see `includeDefaultStyles`.
   */
  dialogClass?: string;

  /**
   * Choose your own id attribute for the dialog element.
   *
   * Default: `react-aria-modal-dialog`.
   */
  dialogId?: string;

  /**
   * Customize properties of the style prop that is passed to the dialog.
   */
  dialogStyle?: React.CSSProperties;

  /**
   * By default, when the modal activates its first focusable child will
   * receive focus. However, if `focusDialog` is true, the dialog itself
   * will receive initial focus — and that focus will be hidden.
   * (This is essentially what Bootstrap does with their modal.)
   */
  focusDialog?: boolean;

  /**
   * By default, when the modal activates its first focusable child will
   * receive focus. If, instead, you want to identify a specific element
   * that should receive initial focus, pass a selector string to this
   * prop. (That selector is passed to `document.querySelector()` to find
   * the DOM node.)
   */
  initialFocus?: string;

  /**
   * A string to use as the modal's accessible title. This value is passed
   * to the modal's `aria-label` attribute. You must use either `titleId` or
   * `titleText`, but not both.
   */
  titleText?: string;

  /**
   * The `id` of the element that should be used as the modal's accessible
   * title. This value is passed to the modal's `aria-labelledby` attribute.
   * You must use either `titleId` or `titleText`, but not both.
   */
  titleId?: string;

  /**
   * Customize properties of the `style` prop that is passed to the underlay.
   * The best way to add some vertical displacement to the dialog is to add
   * top & bottom padding to the underlay.
   * This is illustrated in the demo examples.
   */
  underlayStyle?: React.CSSProperties;

  /**
   * Apply a class to the underlay in order to custom-style it.
   * This module does apply various inline styles, though, so be aware that
   * overriding some styles might be difficult. If, for example, you want
   * to change the underlay's color, you should probably use the
   * `underlayColor` prop instead of a class.
   * If you would rather control all CSS, see `includeDefaultStyles`.
   */
  underlayClass?: string;

  /**
   * By default, a click on the underlay will exit the modal.
   * Pass `false`, and clicking on the underlay will do nothing.
   */
  underlayClickExits?: boolean;

  /**
   * By default, the Escape key exits the modal. Pass `false`, and it won't.
   */
  escapeExits?: boolean;

  /**
   * If you want to change the underlay's color, you can
   * do that with this prop. If `false`, no background color will be
   * applied with inline styles. Presumably you will apply then
   * yourself via an `underlayClass`.
   *
   * Default: rgba(0,0,0,0.5)
   */
  underlayColor?: string;

  /**
   * If `true`, the modal's contents will be vertically (as well as horizontally) centered.
   */
  verticallyCenter?: boolean;

  /**
   * This function is called in the modal's `componentDidMount()` lifecycle method.
   * You can use it to do whatever diverse and sundry things you feel like
   * doing after the modal activates.
   */
  onEnter?(): any;

  /**
   * This function needs to handles the state change of exiting (or deactivating) the modal.
   * Maybe it's just a wrapper around `setState()`; or maybe you use some more involved
   * Flux-inspired state management — whatever the case, this module leaves the state
   * management up to you instead of making assumptions.
   * That also makes it easier to create your own "close modal" buttons; because you
   * have the function that closes the modal right there, written by you, at your disposal.
   */
  onExit(event: Event): any;

  scrollDisabled?: boolean;

  underlayProps?: any;

  focusTrapOptions?: Partial<FocusTrapOptions>;

  focusTrapPaused?: boolean;
}

class Modal extends React.Component<AriaModalProps> {
  dialogNode: undefined|Element;

  static defaultProps = {
    underlayProps: {},
    dialogId: 'react-aria-modal-dialog',
    underlayClickExits: true,
    escapeExits: true,
    underlayColor: 'rgba(0,0,0,0.5)',
    includeDefaultStyles: true,
    focusTrapPaused: false,
    scrollDisabled: true
  };

  componentWillMount() {
    if (!this.props.titleText && !this.props.titleId) {
      throw new Error(
        'react-aria-modal instances should have a `titleText` or `titleId`'
      );
    }
  }

  componentDidMount() {
    if (this.props.onEnter) {
      this.props.onEnter();
    }

    // Timeout to ensure this happens *after* focus has moved
    const applicationNode = this.getApplicationNode();
    setTimeout(() => {
      if (applicationNode && applicationNode instanceof Element) {
        applicationNode.setAttribute('aria-hidden', 'true');
      }
    }, 0);

    if (this.props.escapeExits) {
      this.addKeyDownListener();
    }

    if (this.props.scrollDisabled) {
      noScroll.on();
    }
  }

  componentDidUpdate(prevProps: AriaModalProps) {
    if (prevProps.scrollDisabled && !this.props.scrollDisabled) {
      noScroll.off();
    } else if (!prevProps.scrollDisabled && this.props.scrollDisabled) {
      noScroll.on();
    }

    if (this.props.escapeExits && !prevProps.escapeExits) {
      this.addKeyDownListener();
    } else if (!this.props.escapeExits && prevProps.escapeExits) {
      this.removeKeyDownListener();
    }
  }

  componentWillUnmount() {
    if (this.props.scrollDisabled) {
      noScroll.off();
    }
    const applicationNode = this.getApplicationNode();
    if (applicationNode && applicationNode instanceof Element) {
      applicationNode.setAttribute('aria-hidden', 'false');
    }
    this.removeKeyDownListener();
  }

  addKeyDownListener() {
    setTimeout(() => {
      document.addEventListener('keydown', this.checkDocumentKeyDown);
    });
  }

  removeKeyDownListener() {
    setTimeout(() => {
      document.removeEventListener('keydown', this.checkDocumentKeyDown);
    });
  }

  getApplicationNode = (): Node|Element|undefined => {
    if (this.props.getApplicationNode) return this.props.getApplicationNode();
    return this.props.applicationNode;
  };

  checkUnderlayClick = (event: MouseEvent) => {
    if (
      (this.dialogNode && event.target instanceof Node && this.dialogNode.contains(event.target)) ||
      // If the click is on the scrollbar we don't want to close the modal.
      (
        event.target instanceof Element && event.target.ownerDocument &&
        (event.pageX > event.target.ownerDocument.documentElement.offsetWidth ||
         event.pageY > event.target.ownerDocument.documentElement.offsetHeight)
      )
    )
      return;
    this.exit(event);
  };

  checkDocumentKeyDown = (event: KeyboardEvent) => {
    if (
      this.props.escapeExits &&
      (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27)
    ) {
      this.exit(event);
    }
  };

  exit = (event: Event) => {
    if (this.props.onExit) {
      this.props.onExit(event);
    }
  };

  render() {
    const props = this.props;

    let style: React.CSSProperties = {};
    if (props.includeDefaultStyles) {
      style = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1050,
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        textAlign: 'center'
      };

      if (props.underlayColor) {
        style.background = props.underlayColor;
      }

      if (props.underlayClickExits) {
        style.cursor = 'pointer';
      }
    }

    if (props.underlayStyle) {
      for (const key in props.underlayStyle) {
        if (!props.underlayStyle.hasOwnProperty(key)) continue;
        (style as any)[key] = (props.underlayStyle as any)[key];
      }
    }

    const underlayProps: any = {
      className: props.underlayClass,
      style: style
    };

    if (props.underlayClickExits) {
      underlayProps.onMouseDown = this.checkUnderlayClick;
    }

    for (const prop in this.props.underlayProps) {
      underlayProps[prop] = this.props.underlayProps[prop];
    }

    let verticalCenterStyle = {};
    if (props.includeDefaultStyles) {
      verticalCenterStyle = {
        display: 'inline-block',
        height: '100%',
        verticalAlign: 'middle'
      };
    }

    const verticalCenterHelperProps: any = {
      key: 'a',
      style: verticalCenterStyle
    };

    let dialogStyle: any = {};
    if (props.includeDefaultStyles) {
      dialogStyle = {
        display: 'inline-block',
        textAlign: 'left',
        top: 0,
        maxWidth: '100%',
        cursor: 'default',
        outline: props.focusDialog ? 0 : null
      };

      if (props.verticallyCenter) {
        dialogStyle.verticalAlign = 'middle';
        dialogStyle.top = 0;
      }
    }

    if (props.dialogStyle) {
      for (const key in props.dialogStyle) {
        if (!props.dialogStyle.hasOwnProperty(key)) continue;
        dialogStyle[key] = (props.dialogStyle as any)[key];
      }
    }

    const dialogProps: any = {
      key: 'b',
      ref: (el: Element) => {
        this.dialogNode = el;
      },
      role: props.alert ? 'alertdialog' : 'dialog',
      id: props.dialogId,
      className: props.dialogClass,
      style: dialogStyle
    };
    if (props.titleId) {
      dialogProps['aria-labelledby'] = props.titleId;
    } else if (props.titleText) {
      dialogProps['aria-label'] = props.titleText;
    }
    if (props.focusDialog) {
      dialogProps.tabIndex = '-1';
    }

    // Apply data- and aria- attributes passed as props
    for (let key in props) {
      if (/^(data-|aria-)/.test(key)) {
        dialogProps[key] = (props as any)[key];
      }
    }

    const childrenArray = [
      React.createElement('div', dialogProps, props.children)
    ];

    if (props.verticallyCenter) {
      childrenArray.unshift(
        React.createElement('div', verticalCenterHelperProps)
      );
    }

    const focusTrapOptions: Partial<FocusTrapOptions> = props.focusTrapOptions || {};
    if (props.focusDialog || props.initialFocus) {
      focusTrapOptions.initialFocus = props.focusDialog
        ? `#${this.props.dialogId}`
        : props.initialFocus;
    }
    focusTrapOptions.escapeDeactivates = props.escapeExits;

    return React.createElement(
      ReactFocusTrap,
      {
        focusTrapOptions,
        paused: props.focusTrapPaused
      } as any,
      React.createElement('div', underlayProps, childrenArray)
    );
  }
}

type ReactAriaModal = React.ComponentType<AriaModalProps> & {
  renderTo?: (input: string|Element) => React.ComponentType<AriaModalProps>
};

const AriaModal = displace(Modal) as ReactAriaModal;

AriaModal.renderTo = function(input) {
  return displace(Modal, { renderTo: input });
};

export default AriaModal;

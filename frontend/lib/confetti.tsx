import React from 'react';

import { confetti } from "../vendor/confetti";
import { assertNotNull } from './util';
import { createPortal } from 'react-dom';
import autobind from 'autobind-decorator';

export const CONFETTI_WRAPPER_CLASS = 'jf-confetti-wrapper';

/**
 * Return whether the browser supports the 'pointer-events' CSS
 * property. It's critical to making it possible for users to
 * actually click through the canvas and into the document behind
 * it.
 */
function supportsPointerEvents(): boolean {
  const html = document.documentElement;
  return html ? 'pointerEvents' in html.style : false;
}

export function ensurePointerEventsIsNone(el: Element) {
  if (window.getComputedStyle(el).pointerEvents !== 'none') {
    throw new Error('pointer-events of element is not "none"!');
  }
}

interface ConfettiProps {
}

interface ConfettiState {
  mounted: boolean;
}

export default class Confetti extends React.Component<ConfettiProps, ConfettiState> {
  container: HTMLDivElement|null;

  constructor(props: ConfettiProps) {
    super(props);
    this.container = null;
    this.state = {
      mounted: false
    };
  }

  componentDidMount() {
    this.container = document.createElement('div');
    this.container.className = CONFETTI_WRAPPER_CLASS;
    document.body.appendChild(this.container);
    this.setState({ mounted: true });
  }

  componentWillUnmount() {
    document.body.removeChild(assertNotNull(this.container));
  }

  render() {
    if (!this.state.mounted || !supportsPointerEvents()) {
      return null;
    }

    return createPortal(<ConfettiCanvas/>, assertNotNull(this.container));
  }
}

class ConfettiCanvas extends React.Component {
  canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  confettiCtx: any = null;

  @autobind
  handleResize() {
    this.confettiCtx.resize();
  }

  componentDidMount() {
    const canvas = assertNotNull(this.canvasRef.current);
    ensurePointerEventsIsNone(canvas);
    this.confettiCtx = new confetti.Context(canvas);
    this.confettiCtx.start();
    window.addEventListener('resize', this.handleResize, false);
  }

  componentWillUnmount() {
    this.confettiCtx.stop();
    window.removeEventListener('resize', this.handleResize, false);
    this.confettiCtx = null;
  }

  render() {
    return <canvas ref={this.canvasRef} />;
  }
}

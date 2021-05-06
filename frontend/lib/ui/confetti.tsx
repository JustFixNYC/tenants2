import React from "react";

import { confetti } from "../../vendor/confetti";
import { assertNotNull } from "@justfixnyc/util";
import { createPortal } from "react-dom";
import autobind from "autobind-decorator";

export const CONFETTI_WRAPPER_CLASS = "jf-confetti-wrapper";

/**
 * Return whether the browser supports the 'pointer-events' CSS
 * property. It's critical to making it possible for users to
 * actually click through the canvas and into the document behind
 * it.
 */
function supportsPointerEvents(): boolean {
  const html = document.documentElement;
  return html ? "pointerEvents" in html.style : false;
}

export function ensurePointerEventsIsNone(el: Element) {
  if (window.getComputedStyle(el).pointerEvents !== "none") {
    throw new Error('pointer-events of element is not "none"!');
  }
}

export interface ConfettiProps extends ConfettiCanvasProps {}

interface ConfettiState {
  mounted: boolean;
}

export default class Confetti extends React.Component<
  ConfettiProps,
  ConfettiState
> {
  container: HTMLDivElement | null;

  constructor(props: ConfettiProps) {
    super(props);
    this.container = null;
    this.state = {
      mounted: false,
    };
  }

  componentDidMount() {
    this.container = document.createElement("div");
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

    return createPortal(
      <ConfettiCanvas {...this.props} />,
      assertNotNull(this.container)
    );
  }
}

interface ConfettiCanvasProps {
  /**
   * Number of seconds during which any confetti that falls to
   * the bottom of the screen will be "regenerated" and moved
   * above the screen so it will fall once again. Defaults to 0,
   * which means it confetti will regenerate forever.
   */
  regenerateForSecs?: number;
}

interface ConfettiCanvasState {
  hasFinished: boolean;
}

class ConfettiCanvas extends React.Component<
  ConfettiCanvasProps,
  ConfettiCanvasState
> {
  canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  confettiCtx: any = null;

  constructor(props: ConfettiCanvasProps) {
    super(props);
    this.state = {
      hasFinished: false,
    };
  }

  @autobind
  handleResize() {
    this.confettiCtx.resize();
  }

  @autobind
  handleConfettiFinished() {
    this.cleanupConfetti();
    this.setState({ hasFinished: true });
  }

  cleanupConfetti() {
    if (this.confettiCtx !== null) {
      this.confettiCtx.stop();
      window.removeEventListener("resize", this.handleResize, false);
      this.confettiCtx = null;
    }
  }

  componentDidMount() {
    const canvas = assertNotNull(this.canvasRef.current);
    ensurePointerEventsIsNone(canvas);
    this.confettiCtx = new confetti.Context(
      canvas,
      this.props.regenerateForSecs,
      this.handleConfettiFinished
    );
    this.confettiCtx.start();
    window.addEventListener("resize", this.handleResize, false);
  }

  componentWillUnmount() {
    this.cleanupConfetti();
  }

  render() {
    return this.state.hasFinished ? null : <canvas ref={this.canvasRef} />;
  }
}

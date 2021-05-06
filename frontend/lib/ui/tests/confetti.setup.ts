import { assertNotNull } from "@justfixnyc/util";

if (typeof window !== "undefined") {
  // Our canvas usage is very minimal and we just want to make
  // sure it doesn't crash or anything, so we'll fake it here.
  (window as any).HTMLCanvasElement.prototype.getContext = function () {
    const noop = () => {};
    return {
      fillRect: noop,
      clearRect: noop,
      putImageData: noop,
      setTransform: noop,
      drawImage: noop,
      save: noop,
      fillText: noop,
      restore: noop,
      beginPath: noop,
      moveTo: noop,
      lineTo: noop,
      closePath: noop,
      stroke: noop,
      translate: noop,
      scale: noop,
      rotate: noop,
      arc: noop,
      fill: noop,
      transform: noop,
      rect: noop,
      clip: noop,
    };
  };

  const style = document.createElement("style");
  style.textContent = ".jf-confetti-wrapper canvas { pointer-events: none; }";
  assertNotNull(document.head).appendChild(style);
}

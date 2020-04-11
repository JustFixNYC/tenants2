/**
 * Attempt to smoothly scroll the user's browser
 * to the top of the page.
 */
export function smoothlyScrollToTopOfPage() {
  // Without the explicit requestAnimationFrame, this
  // is unreliable on some browsers.
  window.requestAnimationFrame(() => {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  });
}

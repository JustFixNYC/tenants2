/**
 * Attempt to smoothly scroll the user's browser
 * to the top of the page.
 */
export function smoothlyScrollToTopOfPage() {
  // Without the explicit requestAnimationFrame, this
  // is unreliable on some browsers.
  window.requestAnimationFrame(() => {
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
  });
}

/**
 * Jump straight to the top of the page, without smoothly
 * scrolling.
 */
export function jumpToTopOfPage() {
  // Without the explicit requestAnimationFrame, this
  // might be unreliable on some browsers, so we'll play it safe.
  window.requestAnimationFrame(() => {
    window.scroll(0, 0);
  });
}

function getFixedNavbarHeight(): number {
  const navbar = document.querySelector("nav.is-fixed-top");
  if (navbar) {
    return navbar.getBoundingClientRect().height;
  }
  return 0;
}

export function smoothlyScrollToLocation(el: Element) {
  // Without the explicit requestAnimationFrame, this
  // is unreliable on some browsers.
  window.requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect();
    window.scroll({
      top: window.scrollY - getFixedNavbarHeight() + rect.top,
      left: rect.left,
      behavior: "smooth",
    });
  });
}

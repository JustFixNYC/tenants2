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

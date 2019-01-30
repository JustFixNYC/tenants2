window.addEventListener('load', () => {
  const scripts = document.querySelectorAll('script[id^="admin-map-"]');
  scripts.forEach(function(script) {
    const node = document.createElement('p');
    node.textContent = "TODO: Insert map here.";
    script.replaceWith(node);
  });
});

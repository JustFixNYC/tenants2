// @ts-check

var globalErrorCount = 0;

function showEnableSafeModeUI() {
  var el = document.getElementById('safe-mode-enable');

  if (el && el.hasAttribute('hidden')) {
    el.removeAttribute('hidden');
    el.focus();
  }
}

window.addEventListener('error', function() {
  globalErrorCount++;
  // Enclose the following in a try/catch to avoid infinite recursion.
  try {
    showEnableSafeModeUI();
  } catch (e) {}
});

window.addEventListener('load', function() {
  if (globalErrorCount) {
    showEnableSafeModeUI();
  }
});

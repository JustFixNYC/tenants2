(function() {
  var originalLocation = window.location.href;

  // This JS ensures that the user's back button
  // still works after switching from the
  // single page app into compatibility mode.
  window.addEventListener('popstate', function() {
    // Note that we explicitly want to compare the new
    // location to the one we had when loading, because
    // some old browsers *always* fire a popstate event
    // on page load.
    if (window.location.href !== originalLocation) {
      window.location.reload();
    }
  });
})();

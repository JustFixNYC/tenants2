// @ts-check
(function() {
  var SHOW_UI_DELAY_MS = 250;

  /** @type {string[]} */
  var errorsToIgnore = [];

  /** @type {string[]} */
  var errors = [];

  /** @type {number|null} */
  var showUiTimeout = null;

  function checkValidErrors() {
    var validErrors = 0;
    for (var i = 0; i < errors.length; i++) {
      if (errorsToIgnore.indexOf(errors[i]) === -1) {
        validErrors += 1;
      }
    }
    errors = [];
    errorsToIgnore = [];
    return validErrors > 0;
  }

  function scheduleShowUICheck() {
    if (showUiTimeout !== null) {
      window.clearTimeout(showUiTimeout);
      showUiTimeout = null;
    }
    showUiTimeout = window.setTimeout(function() {
      var el = document.getElementById('safe-mode-enable');

      if (checkValidErrors() && el && el.hasAttribute('hidden')) {
        el.removeAttribute('hidden');
        el.focus();
      }
    }, SHOW_UI_DELAY_MS);
  }

  window.SafeMode = {
    ignoreError: function(e) {
      errorsToIgnore.push(e.toString());
    }
  };

  window.addEventListener('error', function(e) {
    try {
      errors.push(e.error.toString());
    } catch (e) {
      errors.push('unknown error');
    }
    scheduleShowUICheck();
  });

  window.addEventListener('load', scheduleShowUICheck);
})();

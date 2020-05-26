// @ts-check

/** @type {boolean} Whether or not development dependencies are installed. */
exports.DEV_DEPS_AVAIL = (() => {
  try {
    require("dotenv");
    return true;
  } catch (e) {
    return false;
  }
})();

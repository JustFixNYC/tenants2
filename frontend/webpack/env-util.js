const TRUTHY = ['yes', 'yup', 'true'];

const FALSY = ['no', 'nope', 'false'];

/**
 * Enclose the given strings in quotes and comma-separate them.
 *
 * @param {string[]} strings
 * @returns {string}
 */
function quoteStrings(strings) {
  return strings.map(string => `'${string}'`).join(', ');
}

/**
 * Interpret the given string as a boolean and return its value, or null
 * if it doesn't have a valid value.
 * 
 * @param {string} value
 * @returns {boolean|null}
 */
function strToBoolean(value) {
  value = value.toLowerCase();
  if (TRUTHY.indexOf(value) !== -1) {
    return true;
  }
  if (FALSY.indexOf(value) !== -1) {
    return false;
  }
  return null;
}

/**
 * Interpret the given environment variable as boolean and return it.
 * If the environment variable isn't defined or is empty, the default
 * value is returned.
 * 
 * @param {string} name
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function getEnvBoolean(name, defaultValue) {
  const val = process.env[name];
  if (!val) return defaultValue;

  const boolVal = strToBoolean(val);
  if (boolVal === null) {
    throw new Error(
      `The value of the environment variable ${name} should be ` +
      `one of ${quoteStrings(TRUTHY)} for true, or ${quoteStrings(FALSY)} for false, ` +
      `but it is "${val}"`
    );
  }
  return boolVal;
}

/**
 * Interpret the given environment variable as a string and return it.
 * If the environment variable isn't defined or is empty, the default
 * value is returned.
 * 
 * @param {string} name
 * @param {string} defaultValue
 * @returns {string}
 */
function getEnvString(name, defaultValue) {
  const val = process.env[name] || defaultValue;
  return JSON.stringify(val);
}

module.exports = {
  strToBoolean,
  quoteStrings,
  getEnvBoolean,
  getEnvString
};

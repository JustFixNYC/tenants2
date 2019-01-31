//@ts-check

/** 
 * Get the JS params for this page that were given to us by
 * our back-end and embedded in the page.
 * 
 * @argument {Element} el The element
 *   containing the admin map JSON parameters as its text.
 * @returns {import('./admin_map_typings').AdminMapJsonParams}
 */
function getAdminMapJsonParams(el) {
  if (!el.textContent) {
    throw new Error('Assertion failure: element contains no text!');
  }
  return JSON.parse(el.textContent);
}

/**
 * Render the admin map as a div next to the given element that
 * contains its parameters.
 * 
 * @param {Element} el The element
 *   containing the admin map JSON parameters as its text.
 */
function showAdminMap(el) {
  const params = getAdminMapJsonParams(el);
  const div = document.createElement('div');
  div.className = 'admin-map';
  if (!el.parentNode) {
    throw new Error('Assertion failure: script should have a parent!');
  }
  el.parentNode.insertBefore(div, el);

  const map = L.map(div).setView(params.center, params.zoomLevel);
  const urlTemplate = params.mapboxTilesOrigin + '/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}';
  const tileLayerOptions = {
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: params.mapboxAccessToken
  };
  L.tileLayer(urlTemplate, tileLayerOptions).addTo(map);
  if (params.area) {
    L.geoJSON(params.area).addTo(map);
  }
  if (params.point) {
    let marker = L.geoJSON(params.point).addTo(map);
    if (params.pointLabelHTML) {
      marker.bindPopup(params.pointLabelHTML);
    }
  }
}

/**
 * All admin maps should have id attributes starting with the
 * given prefix.
 */
const ADMIN_MAP_PREFIX = "admin-map-";

/**
 * Find and render all the admin maps on the page once it loads.
 */
window.addEventListener('load', () => {
  document.querySelectorAll(`script[id^="${ADMIN_MAP_PREFIX}"]`)
    .forEach(showAdminMap);
});

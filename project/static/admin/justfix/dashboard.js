//@ts-check

document.addEventListener('DOMContentLoaded', () => {
  /**
   * Get the element with the given id, throwing an error on failure.
   *
   * @param {string} id 
   * @returns HTMLElement
   */
  function getEl(id) {
    const el = document.getElementById(id);
    if (!el)
      throw new Error(`Element #${id} not found!`);
    return el;
  };

  /**
   * Vega-Embed doesn't pool identical data used by multiple embeds, so we'll
   * have to do that ourselves. This maps URLs to promises that resolve to
   * the JSON data in them.
   * 
   * @type Map<string, Promise<any>>
   */
  const datasets = new Map();

  /**
   * This contains a mapping from element/visualization IDs to vega-lite specs,
   * embedded into our page by a Django template.
   */
  const vizData = JSON.parse(getEl('viz-data').textContent || '');

  /**
   * Get the JSON data at the given URL, reusing an in-flight or already
   * completed request if needed.
   * 
   * @param {string} url 
   * @returns Promise<any>
   */
  function getDataset(url) {
    let promise = datasets.get(url);
    if (promise) {
      return promise;
    }
    promise = fetch(url).then(res => res.json());
    datasets.set(url, promise);
    return promise;
  }

  /**
   * Patch the given Vega-Lite specification by replacing its data
   * URL with inline data.
   *
   * @param {any} spec
   * @returns Promise<any>
   */
  function patchData(spec) {
    const { url } = spec.data;
    return getDataset(url).then(values => {
      return {
        ...spec,
        data: { values }
      };
    });
  }

  let allVizsLoaded = Promise.resolve();

  Object.keys(vizData).forEach(id => {
    let promise = patchData(vizData[id]).then(spec => {
      return vegaEmbed(getEl(id), spec);
    });
    allVizsLoaded = allVizsLoaded.then(() => promise);
  });

  allVizsLoaded.then(() => {
    let anchor = document.getElementById(window.location.hash.slice(1));
    if (anchor) {
      anchor.scrollIntoView(true);
    }
  });
});

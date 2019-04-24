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

  const vizData = JSON.parse(getEl('viz-data').textContent || '');

  Object.keys(vizData).forEach(id => {
    const spec = vizData[id];

    vegaEmbed(getEl(id), spec);
  });
});

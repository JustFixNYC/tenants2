import svgLoader from "../svg-loader";

const ORIGINAL_SVG =
  `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" ` +
  `viewBox="0 0 261.85 296.88">` +
  `<defs><style>.cls-1{fill:#434a54;}</style></defs>` +
  `<title>IC icons</title><path class="cls-1" d="M10 10 H 90 V 90 H 10 L 10 10"/></svg>`;

const OPTIMIZED_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" ` +
  `viewBox="0 0 261.85 296.88">` +
  `<path d="M10 10 H 90 V 90 H 10 L 10 10"/></svg>`;

test("SVG loader works", async () => {
  const source = await svgLoader(ORIGINAL_SVG);
  expect(source.split("\n")).toEqual([
    `const React = require('react');`,
    ``,
    `module.exports = ${OPTIMIZED_SVG};`,
  ]);
});

const SVG_WITH_TWO_PATHS =
  `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" ` +
  `viewBox="0 0 261.85 296.88">` +
  `<defs><style>.cls-1{fill:#434a54;}</style></defs>` +
  `<title>IC icons</title><path class="cls-1" d="M10 10 H 90 V 90 H 10 L 10 10"/>` +
  `<path class="cls-1" d="M10 10 H 90 V 90 H 10 L 10 10"/>` +
  `</svg>`;

test("SVG loader works on SVGs with two paths", async () => {
  const source = await svgLoader(SVG_WITH_TWO_PATHS);
  expect(source).not.toContain("class");
});

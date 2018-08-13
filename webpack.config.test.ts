import * as child_process from 'child_process';

test('webpack config should pass typescript JS checking', () => {
  const result = child_process.spawnSync('node', [
    'node_modules/typescript/bin/tsc',
    '--allowJs',
    '--noEmit',
    '--checkJs',

    // For some reason tsc loads all the typings from our
    // package.json, some of which use DOM interfaces, and
    // complains if it doesn't understand them, so we
    // have to appease it here.
    '--lib', 'esnext,dom',

    'webpack.config.js'
  ], {
    stdio: 'inherit'
  });

  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
}, 10000);

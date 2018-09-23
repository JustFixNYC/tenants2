// @ts-check

const { execSync } = require('child_process');
const chokidar = require('chokidar');

const FILENAME = 'safe-mode.js';

function uglify() {
  console.log(`Uglifying ${FILENAME}.`);
  execSync('npm run safe_mode_snippet', { stdio: 'inherit' });
}

if (!module.parent) {
  console.log(`Waiting for changes to ${FILENAME}...`);
  chokidar.watch(`${__dirname}/${FILENAME}`)
    .on('ready', uglify)
    .on('change', uglify);
}

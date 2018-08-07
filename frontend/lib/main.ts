import { startApp } from './app';

window.addEventListener('load', () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  startApp(div);
});

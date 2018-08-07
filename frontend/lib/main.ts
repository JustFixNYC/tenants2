async function getMessage(): Promise<string> {
  return "HELLO FROM JAVASCRIPT-LAND";
}

window.addEventListener('load', () => {
  const p = document.createElement('p');
  getMessage().then(message => {
    p.textContent = message;
  }).catch(e => {
    p.setAttribute('style', 'color: red');
    p.textContent = e.message;
  }).then(() => {
    document.body.appendChild(p);
  });
});

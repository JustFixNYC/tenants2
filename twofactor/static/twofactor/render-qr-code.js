// @ts-check

(function() {
  /**
   * This is just a workaround to let TypeScript be OK with
   * our use of QRious.
   * 
   * @type any
   */
  var _w = window;
  var QRious = _w.QRious;

  var provisioningLink = document.getElementById('provisioning');
  var qrCanvas = document.getElementById('qr');

  if (!(provisioningLink && provisioningLink instanceof HTMLAnchorElement)) {
    throw new Error('cannot find provisioning URL');
  }

  if (!(qrCanvas && qrCanvas instanceof HTMLCanvasElement)) {
    throw new Error('cannot find QR code canvas');
  }

  new QRious({
    element: qrCanvas,
    value: provisioningLink.href,
    size: qrCanvas.width
  });
})();

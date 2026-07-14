const QRCode = require("qrcode");

async function generateQRCode(bookingReference) {
  // Encodes just the booking reference — venue staff scan this and look it up server-side
  const dataUrl = await QRCode.toDataURL(bookingReference);
  return dataUrl; // base64 image string, usable directly in <img src="...">
}

module.exports = { generateQRCode };
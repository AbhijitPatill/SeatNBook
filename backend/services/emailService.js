const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password, not your real password
  },
});

async function sendTicketEmail(toEmail, bookingReference, qrCodeDataUrl) {
  // Strip the data:image/png;base64, prefix to get raw base64
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

  const mailOptions = {
    from: `"SeatNBook" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Ticket - Booking #${bookingReference}`,
    html: `
      <h2>Booking Confirmed!</h2>
      <p>Your booking reference is: <strong>${bookingReference}</strong></p>
      <p>Please show this QR code at entry:</p>
      <img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px;" />
    `,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: base64Data,
        encoding: "base64",
        cid: "qrcode",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

async function sendWaitlistOfferEmail(toEmail, token, showId, seatId, waitlistEntryId) {
  const offerLink = `${process.env.FRONTEND_URL}/waitlist-offer?token=${token}&show=${showId}&seat=${seatId}&entry=${waitlistEntryId}`;

  await transporter.sendMail({
    from: `"Ticket Booking System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "A seat is available for you!",
    html: `
      <h2>Good news!</h2>
      <p>A seat has opened up for your waitlisted show. Complete your booking within 15 minutes:</p>
      <a href="${offerLink}">Complete Booking</a>
    `,
  });
}

module.exports = { sendTicketEmail, sendWaitlistOfferEmail };
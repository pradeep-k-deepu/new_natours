const nodemailer = require('nodemailer');

const sendMail = async (options) => {
  //create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //define mail options
  let mailOptions = {
    from: 'Pradeep k <pradeepbillgates333@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //send mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;

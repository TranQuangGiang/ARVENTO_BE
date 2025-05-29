import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dungnaph52171@gmail.com',  
    pass: process.env.EMAIL_PASSWORD, 
  },
});

/**
 * @param {string} to 
 * @param {string} subject 
 * @param {string} html 
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Gửi email thất bại');
  }
};

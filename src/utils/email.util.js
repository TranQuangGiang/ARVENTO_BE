import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dungnaph52171@gmail.com",
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
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Gửi email thất bại");
  }
};

export const getReturnRequestEmailTemplate = ({ fullName, orderId, note, createdAt }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa;">
      <h2 style="color: #333;">📦 Yêu cầu trả hàng mới</h2>
      <p><strong>Khách hàng:</strong> ${fullName}</p>
      <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
      <p><strong>Thời gian đặt hàng:</strong> ${new Date(createdAt).toLocaleString()}</p>
      <p><strong>Ghi chú:</strong> ${note || "Không có ghi chú"}</p>
      <hr />
      <p style="color: #555;">Vui lòng kiểm tra hệ thống để xử lý yêu cầu này.</p>
    </div>
  `;
};

export const getCancelConfirmationEmailTemplate = ({ fullName, orderId, note }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f6f6f6;">
      <h2 style="color: #d9534f;">❌ Yêu cầu huỷ đơn hàng đã được ghi nhận</h2>
      <p>Xin chào <strong>${fullName}</strong>,</p>
      <p>Chúng tôi đã nhận được yêu cầu huỷ đơn hàng <strong>#${orderId}</strong> của bạn.</p>
      <p><strong>Ghi chú:</strong> ${note || "Không có ghi chú"}</p>
      <p>Bộ phận chăm sóc khách hàng sẽ liên hệ bạn sớm nếu cần thêm thông tin.</p>
      <hr />
      <p style="font-size: 14px; color: #777;">Nếu đây là sự nhầm lẫn, vui lòng liên hệ ngay với chúng tôi.</p>
    </div>
  `;
};

export const getReturnApprovedEmailTemplate = ({ fullName, orderId, note, createdAt }) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f2f4f8; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #2e86de;">📦 Yêu cầu trả hàng của bạn đã được phê duyệt</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Chúng tôi đã xem xét và <strong>phê duyệt</strong> yêu cầu trả hàng của bạn cho đơn hàng <strong>#${orderId}</strong>.</p>

        <p><strong>Ngày đặt hàng:</strong> ${new Date(createdAt).toLocaleString()}</p>
        <p><strong>Ghi chú của bạn:</strong> ${note || "Không có ghi chú"}</p>

        <hr style="margin: 24px 0;" />

        <p>📬 Chúng tôi sẽ sớm liên hệ với bạn để hướng dẫn các bước tiếp theo trong quá trình trả hàng.</p>

        <p style="color: #555;">Nếu bạn có bất kỳ câu hỏi nào, xin vui lòng liên hệ với bộ phận chăm sóc khách hàng.</p>

        <p style="margin-top: 32px; font-size: 14px; color: #999;">
          Đây là email tự động. Vui lòng không trả lời email này.
        </p>
      </div>
    </div>
  `;
};

import nodemailer from "nodemailer";
const formatDate = (val) => {
  const date = val ? new Date(val) : new Date(); // fallback nếu val undefined
  return isNaN(date.getTime()) ? new Date().toLocaleString("vi-VN") : date.toLocaleString("vi-VN");
};

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
export const getOrderConfirmationEmailTemplate = ({ fullName, phone, address, orderId, createdAt, items, total, paymentMethod }) => {
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px 12px; border: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 12px; border: 1px solid #eee; text-align: right;">${item.price?.toLocaleString?.() || "0"}₫</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="background-color: #007bff; color: #fff; padding: 20px;">
          <h2 style="margin: 0;">🛒 Xác Nhận Đơn Hàng</h2>
        </div>
        <div style="padding: 24px;">
          <p>Chào <strong>${fullName}</strong>,</p>
          <p>Chúng tôi đã nhận được đơn hàng <strong>#${orderId}</strong> của bạn vào lúc <strong>${formatDate(createdAt)}</strong>.</p>

          <h3>📦 Thông tin người nhận</h3>
          <p><strong>Họ tên:</strong> ${fullName}</p>
          <p><strong>Điện thoại:</strong> ${phone}</p>
          <p><strong>Địa chỉ:</strong> ${address}</p>

          <h3>🧾 Chi tiết đơn hàng</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 8px 12px; border: 1px solid #ccc; text-align: left;">Sản phẩm</th>
                <th style="padding: 8px 12px; border: 1px solid #ccc; text-align: center;">Số lượng</th>
                <th style="padding: 8px 12px; border: 1px solid #ccc; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Tổng cộng</td>
                <td style="padding: 12px; text-align: right; font-weight: bold;">${total?.toLocaleString?.() || "0"}₫</td>
              </tr>
            </tbody>
          </table>

          <h3>💳 Hình thức thanh toán</h3>
          <p>${paymentMethod}</p>

          <p style="margin-top: 24px;">Cảm ơn bạn đã đặt hàng tại <strong>hệ thống của chúng tôi</strong>. Chúng tôi sẽ sớm liên hệ để xác nhận và giao hàng.</p>
          <p style="font-size: 13px; color: #777;">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với bộ phận hỗ trợ khách hàng.</p>
        </div>
        <div style="background-color: #f1f1f1; text-align: center; padding: 16px; font-size: 12px; color: #888;">
          Đây là email tự động, vui lòng không phản hồi lại email này.
        </div>
      </div>
    </div>
  `;
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

export const getOrderStatusChangedEmailTemplate = ({ fullName, orderId, newStatus, note, changedAt }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #eef2f7;">
      <h2 style="color: #007bff;">🔔 Cập nhật trạng thái đơn hàng</h2>
      <p>Xin chào <strong>${fullName}</strong>,</p>
      <p>Đơn hàng <strong>#${orderId}</strong> của bạn vừa được cập nhật trạng thái:</p>
      <p><strong>Trạng thái mới:</strong> ${newStatus}</p>
      <p><strong>Thời gian:</strong> ${new Date(changedAt).toLocaleString()}</p>
      <p><strong>Ghi chú:</strong> ${note || "Không có ghi chú"}</p>
      <hr />
      <p style="font-size: 14px; color: #666;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    </div>
  `;
};

export const getVerifyEmailTemplate = ({ fullName = "bạn", token }) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #007bff; color: #fff; padding: 24px 32px;">
          <h2 style="margin: 0;">🔐 Xác thực địa chỉ email</h2>
        </div>
        <div style="padding: 32px;">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Chúng tôi rất vui vì bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.</p>
          <p>Để hoàn tất quá trình đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="http://localhost:5173/EmailVerificationSuccess?token=${token}"
              style="display: inline-block; background-color: #007bff; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px;">
              Xác minh email ngay
            </a>s
          </div>

          <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>

          <p style="font-size: 13px; color: #777;">Liên kết xác minh sẽ hết hạn sau 5 phút vì lý do bảo mật.</p>
        </div>
        <div style="background-color: #f1f1f1; text-align: center; padding: 16px; font-size: 12px; color: #888;">
          Đây là email tự động, vui lòng không trả lời lại email này.
        </div>
      </div>
    </div>
  `;
};

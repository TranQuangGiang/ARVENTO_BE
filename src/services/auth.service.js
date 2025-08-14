import bcrypt from "bcrypt";
import { userModel } from "../models/index.js";
import tokenService from "./token.service.js";
import { getVerifyEmailTemplate, sendEmail } from "../utils/email.util.js";
import tokenConstant from "../constants/token.enum.js";

const register = async (data) => {
  const existingUser = await userModel.findOne({ email: data.email });

  if (existingUser) {
    if (existingUser.verified) {
      throw new Error("Email already exists");
    } else {
      // Nếu user chưa xác thực → gửi lại email xác thực
      const { accessToken: verifyToken } = tokenService.generateTokens(existingUser, {
        withRefreshToken: false,
        accessTokenExpiresIn: "5m",
      });

      await sendEmail(existingUser.email, "Verify Email", `Click to verify your email: https:/verify-email?token=${verifyToken}`);

      return {
        message: "Account exists but not verified. A new verification email has been sent.",
      };
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await userModel.create({ ...data, password: hashedPassword });

  const { accessToken: verifyToken } = tokenService.generateTokens(user, {
    withRefreshToken: false,
    accessTokenExpiresIn: "5m",
  });

  const html = getVerifyEmailTemplate({ fullName: user.name, token: verifyToken });
  await sendEmail(user.email, "Xác thực email", html);
  // await sendEmail(user.email, "Verify Email", `Click to verify your email: https://verify-email?token=${verifyToken}`);s

  return {
    message: "Registration successful. Please check your email to verify.",
  };
};

const login = async ({ email, password }) => {
  const user = await userModel.findOne({ email });
  if (!user) throw new Error("Email does not exist");

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) throw new Error("Incorrect password");

  const tokens = tokenService.generateTokens(user);

  await tokenService.saveToken(user._id, tokens.refreshToken, tokenConstant.REFRESH);
  await tokenService.saveToken(user._id, tokens.accessToken, tokenConstant.ACCESS);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const logout = async (refreshToken) => {
  await tokenService.removeRefreshToken(refreshToken);
};

const verifyEmail = async (token) => {
  const payload = tokenService.verifyToken(token);
  await userModel.findByIdAndUpdate(payload.id, { verified: true });
};

const forgotPassword = async (email) => {
  const user = await userModel.findOne({ email });
  if (!user) throw new Error("Email does not exist");

  const token = tokenService.generateTokens(user).accessToken;
  const resetLink = `http://localhost:5173/resetPassword?token=${token}`;

  // HTML template cho email
  const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #4CAF50; padding: 16px; color: white; text-align: center; font-size: 20px; font-weight: bold;">
      Yêu cầu đặt lại mật khẩu
    </div>
    <div style="padding: 20px; color: #333;">
      <p>Xin chào <strong>${user.fullName || 'bạn'}</strong>,</p>
      <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      <p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Liên kết này sẽ hết hạn sau <strong>15 phút</strong> vì lý do bảo mật.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <p style="margin-top: 20px;">Cảm ơn bạn,<br/>Đội ngũ hỗ trợ</p>
    </div>
    <div style="background-color: #f0f0f0; padding: 10px; font-size: 12px; text-align: center; color: #777;">
      Email này được gửi tự động. Vui lòng không trả lời.
    </div>
  </div>
  `;

  await sendEmail(
    email,
    "Đặt lại mật khẩu",
    emailHtml
  );
};


const resetPassword = async (token, newPassword) => {
  const payload = tokenService.verifyToken(token);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userModel.findByIdAndUpdate(payload.id, { password: hashedPassword });
};

const refreshToken = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw new Error("Refresh token not found");

  const payload = tokenService.verifyToken(oldRefreshToken, tokenConstant.REFRESH);

  const savedToken = await tokenService.findToken(oldRefreshToken, tokenConstant.REFRESH);
  if (!savedToken) throw new Error("Invalid refresh token");

  const user = await userModel.findById(payload.id);
  if (!user) throw new Error("User not found");

  const tokens = tokenService.generateTokens(user);

  await tokenService.removeRefreshToken(oldRefreshToken);

  await tokenService.saveToken(user._id, tokens.refreshToken, tokenConstant.REFRESH);
  await tokenService.saveToken(user._id, tokens.accessToken, tokenConstant.ACCESS);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};
const resendVerifyEmail = async (email) => {
  if (!email) throw new Error("Email is required");

  const user = await userModel.findOne({ email });
  if (!user) throw new Error("User not found");
  if (user.verified) throw new Error("User already verified");

  const { accessToken: verifyToken } = tokenService.generateTokens(user, {
    withRefreshToken: false,
    accessTokenExpiresIn: "5m",
  });

  const html = getVerifyEmailTemplate({
    fullName: user.name,
    token: verifyToken,
  });

  await sendEmail(user.email, "Xác thực email", html);
};


export default {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  resendVerifyEmail,
};

import bcrypt from "bcrypt";
import { userModel } from "../models/index.js";
import tokenService from "./token.service.js";
import { sendEmail } from "../utils/email.util.js";
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

  await sendEmail(user.email, "Verify Email", `Click to verify your email: https://verify-email?token=${verifyToken}`);

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
  await sendEmail(email, "Reset Password", `Click to reset your password: /reset-password?token=${token}`);
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

export default {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
};

import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import tokenService from './token.service.js';
import { sendEmail } from '../utils/email.util.js';
import tokenConstant from '../constants/token.enum.js';

const register = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error('Email đã tồn tại');

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({ ...data, password: hashedPassword });

  // const verifyToken = tokenService.generateTokens(user).accessToken;

  // await sendEmail(user.email, 'Verify Email', `Click để xác minh email: /verify-email?token=${verifyToken}`);

  // return { message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh.' };

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

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Email không tồn tại');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Mật khẩu sai');

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
  await User.findByIdAndUpdate(payload.id, { verified: true });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Email không tồn tại');

  const token = tokenService.generateTokens(user).accessToken;
  await sendEmail(user.email, 'Reset Password', `Click để đặt lại mật khẩu: /reset-password?token=${token}`);
};

const resetPassword = async (token, newPassword) => {
  const payload = tokenService.verifyToken(token);
  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(payload.id, { password: hashed });
};

export default {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

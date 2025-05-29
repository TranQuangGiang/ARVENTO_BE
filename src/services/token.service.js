import { tokenModel } from '../models/index.js';
import {jwtUtils,envUtils} from '../utils/index.js';

const accessTokenSecret = envUtils.getEnv('ACCESS_TOKEN_SECRET');
const refreshTokenSecret = envUtils.getEnv('REFRESH_TOKEN_SECRET');

const generateTokens = (user) => {
  const payload = { id: user._id, email: user.email, role: user.role };

  const accessToken = jwtUtils.generateToken(payload, accessTokenSecret, { expiresIn: '15m' });
  const refreshToken = jwtUtils.generateToken(payload, refreshTokenSecret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

const saveToken = async (userId, token, type) => {
  await tokenModel.findOneAndUpdate(
    { user: userId, type: type },
    { token, type: type, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { upsert: true, new: true }
  );
};

const removeRefreshToken = async (token) => {
  await tokenModel.findOneAndDelete({ token, type: 'refresh' });
};

const refresh = async (refreshToken) => {
  try {
    const payload = jwtUtils.verify(refreshToken, refreshTokenSecret);

    const existing = await tokenModel.findOne({ token: refreshToken, type: 'refresh' });
    if (!existing) throw new Error('Refresh token is invalid');

    const userPayload = { id: payload.id, email: payload.email, role: payload.role };
    const newAccessToken = jwtUtils.generateToken(userPayload, accessTokenSecret, { expiresIn: '15m' });
    const newRefreshToken = jwtUtils.generateToken(userPayload, refreshTokenSecret, { expiresIn: '7d' });

    await tokenModel.findOneAndUpdate(
      { token: refreshToken, type: 'refresh' },
      { token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    console.log(err);
    throw new Error('Token is invalid or expired');
  }
};

export default {
  generateTokens,
  saveToken,
  removeRefreshToken,
  refresh,
};

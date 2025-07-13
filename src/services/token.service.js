import { tokenModel } from "../models/index.js";
import { jwtUtils, envUtils } from "../utils/index.js";
import tokenConstant from "../constants/token.enum.js";

const accessTokenSecret = envUtils.getEnv("ACCESS_TOKEN_SECRET");
const refreshTokenSecret = envUtils.getEnv("REFRESH_TOKEN_SECRET");
const expiresInAccessToken = envUtils.getEnv("ACCESS_TOKEN_EXPIRES_IN");
const expiresInRefreshToken = envUtils.getEnv("REFRESH_TOKEN_EXPIRES_IN");

const generateTokens = (user, options = {}) => {
  const { withRefreshToken = true, accessTokenExpiresIn = expiresInAccessToken, refreshTokenExpiresIn = expiresInRefreshToken } = options;

  const payload = { id: user._id, email: user.email, role: user.role };

  const accessToken = jwtUtils.generateToken(payload, accessTokenSecret, {
    expiresIn: accessTokenExpiresIn,
  });

  let refreshToken = null;
  if (withRefreshToken) {
    refreshToken = jwtUtils.generateToken(payload, refreshTokenSecret, {
      expiresIn: refreshTokenExpiresIn,
    });
  }

  return withRefreshToken ? { accessToken, refreshToken } : { accessToken };
};

const saveToken = async (userId, token, type) => {
  await tokenModel.findOneAndUpdate({ user: userId, type: type }, { token, type: type, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, { upsert: true, new: true });
};

const removeRefreshToken = async (token) => {
  await tokenModel.findOneAndDelete({ token, type: "refresh" });
};

const refresh = async (refreshToken) => {
  try {
    const payload = jwtUtils.verify(refreshToken, refreshTokenSecret);

    const existing = await tokenModel.findOne({ token: refreshToken, type: "refresh" });
    if (!existing) throw new Error("Refresh token is invalid");

    const userPayload = { id: payload.id, email: payload.email, role: payload.role };
    const newAccessToken = jwtUtils.generateToken(userPayload, accessTokenSecret, { expiresIn: expiresInAccessToken });
    const newRefreshToken = jwtUtils.generateToken(userPayload, refreshTokenSecret, { expiresIn: expiresInRefreshToken });

    await tokenModel.findOneAndUpdate({ token: refreshToken, type: "refresh" }, { token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    console.log(err);
    throw new Error("Token is invalid or expired");
  }
};
const verifyToken = (token, type = tokenConstant.ACCESS) => {
  let secret;

  switch (type) {
    case tokenConstant.ACCESS:
      secret = accessTokenSecret;
      break;
    case tokenConstant.REFRESH:
      secret = refreshTokenSecret;
      break;
    default:
      throw new Error("Invalid token type");
  }

  return jwtUtils.verify(token, secret);
};

export default {
  generateTokens,
  saveToken,
  removeRefreshToken,
  refresh,
  verifyToken,
};

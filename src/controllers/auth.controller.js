import ms from "ms";

import authService from "../services/auth.service.js";
import { baseResponse } from "../utils/index.js";
import { logger } from "../config/index.js";
import { authValidate } from "../validations/index.js";
import { envUtils } from "../utils/index.js";
import {tokenConstant} from "../constants/index.js";

const expiresInAccessToken = envUtils.getEnv("ACCESS_TOKEN_EXPIRES_IN");
const expiresInRefreshToken = envUtils.getEnv("REFRESH_TOKEN_EXPIRES_IN");

const register = async (req, res) => {
  try {
    console.log(req.body);

    const { error } = authValidate.register.validate(req.body);
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details[0].message);
    }

    const { accessToken, refreshToken, user } = await authService.register(req.body);

    res.cookie(tokenConstant.REFRESH, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: ms(expiresInRefreshToken) / 1000,
    });

    logger.info(`User registered: ${user.id} - ${user.email}`);
    return baseResponse.createdResponse(
      res,
      {
        user,
        access_token: accessToken,
        expires_in: ms(expiresInAccessToken) / 1000,
      },
      "Registration successful"
    );
  } catch (err) {
    logger.error(`Register failed: ${err.message}`);
    return baseResponse.badRequestResponse(res, null, err.message);
  }
};

const login = async (req, res) => {
  try {
    const { error } = authValidate.login.validate(req.body);
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details[0].message);
    }
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie(tokenConstant.REFRESH, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: ms(expiresInRefreshToken) / 1000,
    });

    logger.info(`User logged in: ${user.id} - ${user.email}`);
    return baseResponse.successResponse(
      res,
      {
        user,
        access_token: accessToken,
        expires_in: ms(expiresInAccessToken) / 1000,
      },
      "Login successful"
    );
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return baseResponse.unauthorizedResponse(res, null, err.message);
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return baseResponse.badRequestResponse(res, null, "No token found");
    }
    await authService.logout(refreshToken);

    res.clearCookie(tokenConstant.REFRESH, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    logger.info(`User logged out with refresh token: ${refreshToken}`);
    return baseResponse.successResponse(res, null, "Logout successful");
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return baseResponse.badRequestResponse(res, null, err.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return baseResponse.badRequestResponse(res, null, "No token found");
    }

    const tokens = await authService.refresh(refreshToken);

    res.cookie(tokenConstant.REFRESH, tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: ms(expiresInRefreshToken),
    });

    logger.info(`Token refreshed for refresh token: ${refreshToken}`);
    return baseResponse.successResponse(
      res,
      {
        access_token: tokens.accessToken,
        expires_in: ms(expiresInAccessToken),
      },
      "Token refreshed successfully"
    );
  } catch (err) {
    logger.error(`Refresh token failed: ${err.message}`);
    return baseResponse.unauthorizedResponse(res, null, err.message);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    await authService.verifyEmail(token);
    logger.info(`Email verified with token: ${token}`);
    return baseResponse.successResponse(res, null, "Email verification successful");
  } catch (err) {
    logger.error(`Verify email failed: ${err.message}`);
    return baseResponse.badRequestResponse(res, null, err.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { error } = authValidate.forgotPassword.validate(req.body);
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details[0].message);
    }

    await authService.forgotPassword(req.body.email);
    logger.info(`Forgot password email sent to: ${req.body.email}`);
    return baseResponse.successResponse(res, null, "Password reset email sent");
  } catch (err) {
    logger.error(`Forgot password failed: ${err.message}`);
    return baseResponse.badRequestResponse(res, null, err.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const data = { token: req.query.token, newPassword: req.body.newPassword };
    const { error } = authValidate.resetPassword.validate(data);
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details[0].message);
    }

    await authService.resetPassword(data.token, data.newPassword);
    logger.info(`Password reset with token: ${data.token}`);
    return baseResponse.successResponse(res, null, "Password reset successful");
  } catch (err) {
    logger.error(`Reset password failed: ${err.message}`);
    return baseResponse.badRequestResponse(res, null, err.message);
  }
};

export default {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

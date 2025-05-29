import authService from "../services/auth.service.js";
import { baseResponse } from "../utils/index.js";
import { logger } from "../config/index.js";
import { authValidate } from "../validations/index.js";

const register = async (req, res) => {
  try {
    const { error } = authValidate.register.validate(req.body);
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details[0].message);
    }

    const result = await authService.register(req.body);
    logger.info(`User registered: ${result.id} - ${result.email}`);
    return baseResponse.createdResponse(res, result, "Registration successful");
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

    const result = await authService.login(req.body);
    logger.info(`User logged in: ${result.user.id} - ${result.user.email}`);
    return baseResponse.successResponse(res, result, "Login successful");
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return baseResponse.unauthorizedResponse(res, null, err.message);
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    logger.info(`User logged out with refresh token: ${refreshToken}`);
    return baseResponse.successResponse(res, null, "Logout successful");
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return baseResponse.badRequestResponse(res, null, err.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    logger.info(`Token refreshed for refresh token: ${refreshToken}`);
    return baseResponse.successResponse(res, result, "Token refreshed successfully");
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

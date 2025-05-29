import { tokenModel } from '../models/index.js';
import { userModel } from '../models/index.js';
import { jwtUtils, envUtils, baseResponse } from '../utils/index.js';
import { logger } from "../config/index.js";

const accessTokenSecret = envUtils.getEnv('ACCESS_TOKEN_SECRET');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`[AUTH] No token provided from IP ${ip}`);
    return baseResponse.unauthorizedResponse(res, null, 'No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    
    const decoded = jwtUtils.verifyToken(token, accessTokenSecret);
    const userId = decoded.id;

    logger.info(`[AUTH] Token decoded for userId: ${userId}`);

    const tokenInDb = await tokenModel.findOne({ token });
    if (!tokenInDb) {
      logger.warn(`[AUTH] Token not found or revoked in DB for userId: ${userId}, IP: ${ip}`);
      return baseResponse.unauthorizedResponse(res, null, 'Token not recognized (may have been revoked)');
    }

    if (tokenInDb.isRevoked) {
      logger.warn(`[AUTH] Revoked token used by userId: ${userId}`);
      return baseResponse.unauthorizedResponse(res, null, 'Token has been revoked');
    }

    if (tokenInDb.expiredAt && Date.now() > new Date(tokenInDb.expiredAt)) {
      logger.warn(`[AUTH] Expired token for userId: ${userId}`);
      return baseResponse.unauthorizedResponse(res, null, 'Token has expired');
    }

    if (tokenInDb.ip && tokenInDb.ip !== ip) {
      logger.warn(`[AUTH] IP mismatch for token. Expected: ${tokenInDb.ip}, Got: ${ip}`);
      return baseResponse.unauthorizedResponse(res, null, 'Invalid IP address for this token');
    }

    if (tokenInDb.userAgent && tokenInDb.userAgent !== userAgent) {
      logger.warn(`[AUTH] User-agent mismatch. Expected: ${tokenInDb.userAgent}, Got: ${userAgent}`);
      return baseResponse.unauthorizedResponse(res, null, 'Invalid device for this token');
    }

    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn(`[AUTH] User not found with ID: ${userId}`);
      return baseResponse.unauthorizedResponse(res, null, 'User not found');
    }

    if (user.status === 'blocked' || user.isBanned) {
      logger.warn(`[AUTH] Blocked/banned user attempted access: ${user.email}`);
      return baseResponse.forbiddenResponse(res, null, 'Your account is blocked');
    }

    req.user = user;

    logger.info(`[AUTH SUCCESS] ${user.email} accessed ${req.originalUrl} from IP ${ip}`);

    next();
  } catch (err) {
    logger.error(`[AUTH ERROR] Failed to authenticate token from IP ${ip} - Error: ${err.message}`);
    return baseResponse.unauthorizedResponse(res, { error: err.message }, 'Invalid or expired token');
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`[AUTHZ] Access denied for user ${req.user.email} with role ${req.user.role}`);
      return baseResponse.forbiddenResponse(res, null, 'Access denied: insufficient role');
    }
    next();
  };
};

export default {
  authenticateToken,
  authorizeRoles,
};

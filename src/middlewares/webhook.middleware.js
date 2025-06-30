import { logger } from "../config/index.js";
import zaloPayUtil from "../utils/payment/zalopay.util.js";
import momoUtil from "../utils/payment/momo.util.js";

/**
 * Middleware để xác thực webhook từ ZaloPay
 */
export const verifyZaloPayWebhook = (req, res, next) => {
  try {
    const callbackData = req.body;

    // Log webhook data để debug
    logger.info(`[ZALOPAY WEBHOOK] Received: ${JSON.stringify(callbackData)}`);

    // Verify signature
    const isValid = zaloPayUtil.verifyCallback(callbackData);

    if (!isValid) {
      logger.error(`[ZALOPAY WEBHOOK] Invalid signature`);
      return res.status(400).json({
        return_code: -1,
        return_message: "Invalid signature",
      });
    }

    // Attach verified data to request
    req.webhookData = callbackData;
    next();
  } catch (error) {
    logger.error(`[ZALOPAY WEBHOOK] Verification error: ${error.message}`);
    return res.status(400).json({
      return_code: -1,
      return_message: "Webhook verification failed",
    });
  }
};

/**
 * Middleware để xác thực webhook từ MoMo
 */
export const verifyMoMoWebhook = (req, res, next) => {
  try {
    const callbackData = req.body;

    // Log webhook data để debug
    logger.info(`[MOMO WEBHOOK] Received: ${JSON.stringify(callbackData)}`);

    // Verify signature
    const isValid = momoUtil.verifySignature(callbackData);

    if (!isValid) {
      logger.error(`[MOMO WEBHOOK] Invalid signature`);
      return res.status(400).json({
        resultCode: -1,
        message: "Invalid signature",
      });
    }

    // Attach verified data to request
    req.webhookData = callbackData;
    next();
  } catch (error) {
    logger.error(`[MOMO WEBHOOK] Verification error: ${error.message}`);
    return res.status(400).json({
      resultCode: -1,
      message: "Webhook verification failed",
    });
  }
};

/**
 * Middleware để rate limit webhook calls
 */
export const webhookRateLimit = (req, res, next) => {
  // Implement rate limiting logic here if needed
  // For now, just pass through
  next();
};

/**
 * Middleware để log webhook requests
 */
export const logWebhookRequest = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info(`[WEBHOOK] ${req.method} ${req.path} - IP: ${req.ip}`);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    logger.info(`[WEBHOOK] Response: ${JSON.stringify(data)} - Duration: ${duration}ms`);
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware để handle webhook errors
 */
export const webhookErrorHandler = (error, req, res) => {
  logger.error(`[WEBHOOK ERROR] ${error.message}`, {
    path: req.path,
    method: req.method,
    body: req.body,
    stack: error.stack,
  });

  // Return appropriate error response based on webhook type
  if (req.path.includes("zalopay")) {
    return res.status(500).json({
      return_code: -1,
      return_message: "Internal server error",
    });
  } else if (req.path.includes("momo")) {
    return res.status(500).json({
      resultCode: -1,
      message: "Internal server error",
    });
  }

  return res.status(500).json({
    error: "Internal server error",
  });
};

/**
 * Middleware để validate webhook payload structure
 */
export const validateWebhookPayload = (requiredFields) => {
  return (req, res, next) => {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      logger.error(`[WEBHOOK] Invalid payload structure`);
      return res.status(400).json({
        error: "Invalid payload structure",
      });
    }

    // Check required fields
    const missingFields = requiredFields.filter((field) => !(field in payload));

    if (missingFields.length > 0) {
      logger.error(`[WEBHOOK] Missing required fields: ${missingFields.join(", ")}`);
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    next();
  };
};

// Export all middleware functions
export default {
  verifyZaloPayWebhook,
  verifyMoMoWebhook,
  webhookRateLimit,
  logWebhookRequest,
  webhookErrorHandler,
  validateWebhookPayload,
};

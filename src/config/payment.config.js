/**
 * Payment Gateway Configuration
 */

export const PAYMENT_METHODS = {
  COD: 'cod',
  BANKING: 'banking',
  ZALOPAY: 'zalopay',
  MOMO: 'momo'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  REFUND_REQUESTED: 'refund_requested'
};

export const ZALOPAY_CONFIG = {
  APP_ID: process.env.ZALOPAY_APP_ID,
  KEY1: process.env.ZALOPAY_KEY1,
  KEY2: process.env.ZALOPAY_KEY2,
  ENDPOINT: process.env.ZALOPAY_ENDPOINT,
  CALLBACK_URL: process.env.ZALOPAY_CALLBACK_URL,
  QUERY_ENDPOINT: 'https://sb-openapi.zalopay.vn/v2/query',
  REFUND_ENDPOINT: 'https://sb-openapi.zalopay.vn/v2/refund'
};

export const MOMO_CONFIG = {
  PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
  ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
  SECRET_KEY: process.env.MOMO_SECRET_KEY,
  ENDPOINT: process.env.MOMO_ENDPOINT,
  CALLBACK_URL: process.env.MOMO_CALLBACK_URL,
  RETURN_URL: process.env.MOMO_RETURN_URL,
  QUERY_ENDPOINT: 'https://test-payment.momo.vn/v2/gateway/api/query',
  REFUND_ENDPOINT: 'https://test-payment.momo.vn/v2/gateway/api/refund',
  QR_ENDPOINT: 'https://test-payment.momo.vn/v2/gateway/api/pos'
};

export const PAYMENT_TIMEOUTS = {
  DEFAULT: 15 * 60 * 1000, // 15 minutes
  ZALOPAY: 15 * 60 * 1000, // 15 minutes
  MOMO: 30 * 60 * 1000     // 30 minutes
};

export const CALLBACK_RESPONSES = {
  SUCCESS: { return_code: 1, return_message: "success" },
  FAILED: { return_code: -1, return_message: "failed" }
};

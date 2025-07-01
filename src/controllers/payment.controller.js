import paymentService from "../services/payment.service.js";
import { baseResponse } from "../utils/index.js";
import { logger } from "../config/index.js";
import { createCODPaymentSchema, createBankingPaymentSchema, createZaloPayPaymentSchema, createMoMoPaymentSchema, refundRequestSchema } from "../validations/payment.validation.js";
import { CALLBACK_RESPONSES } from "../config/payment.config.js";

// Tạo payment cho COD
const createCODPayment = async (req, res) => {
  try {
    const { error, value } = createCODPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }
    const user = req.user._id;
    const payment = await paymentService.createCODPayment({ user, ...value });
    return baseResponse.createdResponse(res, payment, "Tạo thanh toán COD thành công");
  } catch (err) {
    logger.error(`[PAYMENT][COD] Tạo thanh toán thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

// Tạo payment cho banking
const createBankingPayment = async (req, res) => {
  try {
    const { error, value } = createBankingPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }
    const user = req.user._id;
    const payment = await paymentService.createBankingPayment({ user, ...value });
    return baseResponse.createdResponse(res, payment, "Tạo thanh toán banking thành công");
  } catch (err) {
    logger.error(`[PAYMENT][BANKING] Tạo thanh toán thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};
// Callback xác nhận thanh toán banking thành công
const confirmBankingPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const payment = await paymentService.confirmBankingPayment({ transactionId });
    if (!payment) {
      return baseResponse.notFoundResponse(res, null, "Không tìm thấy thanh toán banking");
    }
    return baseResponse.successResponse(res, payment, "Xác nhận thanh toán banking thành công");
  } catch (err) {
    logger.error(`[PAYMENT][BANKING] Callback thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getMyPayments = async (req, res) => {
  try {
    const user = req.user._id;
    const payments = await paymentService.getMyPayments(user);
    return baseResponse.successResponse(res, payments, "Lấy danh sách thanh toán thành công");
  } catch (err) {
    logger.error(`[PAYMENT] Lấy thanh toán thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

const getPaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentDetail(id);
    if (!payment) {
      return baseResponse.notFoundResponse(res, null, "Không tìm thấy thanh toán");
    }
    if (payment.user.toString() !== req.user._id.toString()) {
      return baseResponse.forbiddenResponse(res, null, "Bạn không có quyền xem thanh toán này");
    }
    return baseResponse.successResponse(res, payment, "Lấy chi tiết thanh toán thành công");
  } catch (err) {
    logger.error(`[PAYMENT] Lấy chi tiết thanh toán thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

export const requestRefund = async (req, res, next) => {
  try {
    const { error } = refundRequestSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const payment = await paymentService.requestRefund(req.user.id, req.body);
    res.json({ message: "Gửi yêu cầu hoàn tiền thành công", data: payment });
  } catch (err) {
    next(err);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    const timeline = await paymentService.getPaymentHistory(req.user.id, req.params.id);
    res.json({ message: "Lấy lịch sử trạng thái thành công", data: timeline });
  } catch (err) {
    next(err);
  }
};

// Tạo payment cho ZaloPay
const createZaloPayPayment = async (req, res) => {
  try {
    const { error, value } = createZaloPayPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }
    const user = req.user._id;
    const payment = await paymentService.createZaloPayPayment({ user, ...value });
    return baseResponse.createdResponse(res, payment, "Tạo thanh toán ZaloPay thành công");
  } catch (err) {
    logger.error(`[PAYMENT][ZALOPAY] Tạo thanh toán thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

// Callback xác nhận thanh toán ZaloPay
const confirmZaloPayPayment = async (req, res) => {
  try {
    const callbackData = req.body;
    logger.info(`[ZALOPAY] Callback received: ${JSON.stringify(callbackData)}`);

    const payment = await paymentService.confirmZaloPayPayment(callbackData);

    if (!payment) {
      logger.error(`[ZALOPAY] Callback failed: Payment not found`);
      return res.json(CALLBACK_RESPONSES.FAILED);
    }

    logger.info(`[ZALOPAY] Callback success: Payment ${payment._id} updated`);
    return res.json(CALLBACK_RESPONSES.SUCCESS);
  } catch (err) {
    logger.error(`[PAYMENT][ZALOPAY] Callback thất bại: ${err.message}`);
    return res.json(CALLBACK_RESPONSES.FAILED);
  }
};

// Query ZaloPay payment status
const queryZaloPayStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await paymentService.queryZaloPayStatus(id);

    if (!result.success) {
      return baseResponse.badRequestResponse(res, result.data, "Không thể truy vấn trạng thái thanh toán");
    }

    return baseResponse.successResponse(res, result.data, "Truy vấn trạng thái thanh toán thành công");
  } catch (err) {
    logger.error(`[PAYMENT][ZALOPAY] Query status thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

// Tạo payment cho MoMo
const createMoMoPayment = async (req, res) => {
  try {
    const { error, value } = createMoMoPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return baseResponse.badRequestResponse(res, null, error.details.map((e) => e.message).join(", "));
    }
    const user = req.user._id;
    const payment = await paymentService.createMoMoPayment({ user, ...value });
    return baseResponse.createdResponse(res, payment, "Tạo thanh toán MoMo thành công");
  } catch (err) {
    logger.error(`[PAYMENT][MOMO] Tạo thanh toán thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};

// Callback xác nhận thanh toán MoMo
const confirmMoMoPayment = async (req, res) => {
  try {
    const callbackData = req.body;
    logger.info(`[MOMO] Callback received: ${JSON.stringify(callbackData)}`);

    const payment = await paymentService.confirmMoMoPayment(callbackData);

    if (!payment) {
      logger.error(`[MOMO] Callback failed: Payment not found`);
      return res.json(CALLBACK_RESPONSES.FAILED);
    }

    logger.info(`[MOMO] Callback success: Payment ${payment._id} updated`);
    return res.json(CALLBACK_RESPONSES.SUCCESS);
  } catch (err) {
    logger.error(`[PAYMENT][MOMO] Callback thất bại: ${err.message}`);
    return res.json(CALLBACK_RESPONSES.FAILED);
  }
};

// Query MoMo payment status
const queryMoMoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await paymentService.queryMoMoStatus(id);

    if (!result.success) {
      return baseResponse.badRequestResponse(res, result.data, "Không thể truy vấn trạng thái thanh toán");
    }

    return baseResponse.successResponse(res, result.data, "Truy vấn trạng thái thanh toán thành công");
  } catch (err) {
    logger.error(`[PAYMENT][MOMO] Query status thất bại: ${err.message}`);
    return baseResponse.errorResponse(res, null, err.message);
  }
};
export default {
  createCODPayment,
  createBankingPayment,
  confirmBankingPayment,
  createZaloPayPayment,
  confirmZaloPayPayment,
  queryZaloPayStatus,
  createMoMoPayment,
  confirmMoMoPayment,
  queryMoMoStatus,
  getMyPayments,
  getPaymentDetail,
  requestRefund,
  getPaymentHistory,
};

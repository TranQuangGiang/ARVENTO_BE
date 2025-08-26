import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import zaloPayUtil from "../utils/payment/zalopay.util.js";
import momoUtil from "../utils/payment/momo.util.js";
import { logger } from "../config/index.js";

// Tạo payment cho COD
const createCODPayment = async ({ order, user, amount, note }) => {
  return await Payment.create({
    order,
    user,
    amount,
    method: "cod",
    status: "pending",
    note,
  });
};

// Tạo payment cho banking
const createBankingPayment = async ({ order, user, amount, note }) => {
  // Tích hợp với cổng thanh toán thực tế, ví dụ trả về paymentUrl
  const fakePaymentUrl = `https://banking-gateway.com/pay?orderId=${order}`;
  return await Payment.create({
    order,
    user,
    amount,
    method: "banking",
    status: "pending",
    paymentUrl: fakePaymentUrl,
    note,
  });
};

// Xác nhận thanh toán banking thành công (callback từ cổng thanh toán)
const confirmBankingPayment = async ({ transactionId }) => {
  const payment = await Payment.findOneAndUpdate({ transactionId, method: "banking" }, { status: "paid", paidAt: new Date() }, { new: true });
  return payment;
};

const getMyPayments = async (user) => {
  return await Payment.find({ user }).sort({ createdAt: -1 }).populate("order");
};

const getPaymentDetail = async (id) => {
  return await Payment.findById(id).populate("order");
};

// Tạo payment cho ZaloPay
const createZaloPayPayment = async ({ order, user, amount, note }) => {
  try {
    // Lấy thông tin order
    const orderInfo = await Order.findById(order).populate("user");
    if (!orderInfo) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    // Tạo payment record trước
    const payment = await Payment.create({
      order,
      user,
      amount,
      method: "zalopay",
      status: "pending",
      note,
    });

    // Tạo order với ZaloPay
    const zaloPayOrder = await zaloPayUtil.createOrder({
      amount,
      description: `Thanh toán đơn hàng #${orderInfo._id}`,
      orderId: orderInfo._id.toString(),
      paymentId: payment._id.toString(),
      userInfo: {
        userId: user.toString(),
        userName: orderInfo.user.name || "Customer",
      },
    });

    if (!zaloPayOrder.success) {
      // Cập nhật payment status nếu tạo order thất bại
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        gatewayResponse: zaloPayOrder.data,
      });
      throw new Error("Không thể tạo đơn hàng ZaloPay");
    }

    // Cập nhật payment với thông tin từ ZaloPay
    const updatedPayment = await Payment.findByIdAndUpdate(
      payment._id,
      {
        appTransId: zaloPayOrder.app_trans_id,
        paymentUrl: zaloPayOrder.order_url,
        gatewayResponse: zaloPayOrder.data,
        status: "processing",
      },
      { new: true }
    );

    return {
      ...updatedPayment.toObject(),
      paymentUrl: zaloPayOrder.order_url,
      appTransId: zaloPayOrder.app_trans_id,
    };
  } catch (error) {
    logger.error(`[ZALOPAY] Tạo thanh toán thất bại: ${error.message}`);
    throw error;
  }
};

// Xác nhận thanh toán ZaloPay từ callback
export const confirmZaloPayPayment = async (callbackData) => {
  try {
    const isValid = zaloPayUtil.verifyCallback(callbackData);
    if (!isValid) throw new Error("Invalid callback signature");

    const { data } = callbackData;
    const embedData = JSON.parse(data.embed_data || "{}");
    const paymentId = embedData.paymentId;
    if (!paymentId) throw new Error("Payment ID không tồn tại");

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error("Payment không tồn tại");
    if (payment.method !== "zalopay") throw new Error("Payment method không hợp lệ");

    const isSuccess = String(data.return_code) === "1";

    // Cập nhật Payment
    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: isSuccess ? "completed" : "failed",
        zpTransId: data.zp_trans_id,
        paidAt: isSuccess ? new Date() : null,
        gatewayResponse: { ...payment.gatewayResponse, callback: data },
        $push: {
          timeline: {
            status: isSuccess ? "completed" : "failed",
            changedAt: new Date(),
            note: `ZaloPay callback: ${data.return_message}`,
          },
        },
      },
      { new: true }
    );

    // Cập nhật Order
    await Order.findByIdAndUpdate(
      payment.order,
      {
        payment_status: isSuccess ? "completed" : "failed",
        $push: {
          timeline: {
            status: isSuccess ? "completed" : "failed",
            changedAt: new Date(),
            note: isSuccess ? "Thanh toán ZaloPay thành công" : "Thanh toán ZaloPay thất bại",
          },
        },
      }
    );

    return updatedPayment;
  } catch (err) {
    logger.error(`[ZALOPAY] Callback thất bại: ${err.message}`);
    throw err;
  }
};

// Query ZaloPay payment status
const queryZaloPayStatus = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.method !== "zalopay") {
      throw new Error("Payment not found or invalid method");
    }

    if (!payment.appTransId) {
      throw new Error("App transaction ID not found");
    }

    const result = await zaloPayUtil.queryOrder(payment.appTransId);

    // Cập nhật payment status dựa trên kết quả query
    if (result.success && result.data.return_code === 1) {
      await Payment.findByIdAndUpdate(paymentId, {
        status: "completed",
        zpTransId: result.data.zp_trans_id,
        paidAt: new Date(),
        gatewayResponse: { ...payment.gatewayResponse, query: result.data },
      });
    }

    return result;
  } catch (error) {
    logger.error(`[ZALOPAY] Query status thất bại: ${error.message}`);
    throw error;
  }
};

// Tạo payment cho MoMo
const createMoMoPayment = async ({ order, user, amount, note }) => {
  try {
    // Lấy thông tin order
    const orderInfo = await Order.findById(order).populate("user");
    if (!orderInfo) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    // Tạo payment record trước
    const payment = await Payment.create({
      order,
      user,
      amount,
      method: "momo",
      status: "pending",
      note,
    });

    // Tạo order với MoMo
    const momoOrder = await momoUtil.createOrder({
      amount,
      orderInfo: `Thanh toán đơn hàng #${orderInfo._id}`,
      orderId: payment._id.toString(),
      userInfo: {
        userId: user.toString(),
        userName: orderInfo.user.name || "Customer",
      },
    });

    if (!momoOrder.success) {
      // Cập nhật payment status nếu tạo order thất bại
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        gatewayResponse: momoOrder.data,
      });
      throw new Error("Không thể tạo đơn hàng MoMo");
    }

    // Cập nhật payment với thông tin từ MoMo
    const updatedPayment = await Payment.findByIdAndUpdate(
      payment._id,
      {
        requestId: momoOrder.requestId,
        paymentUrl: momoOrder.payUrl,
        gatewayResponse: momoOrder.data,
        status: "processing",
      },
      { new: true }
    );

    return {
      ...updatedPayment.toObject(),
      paymentUrl: momoOrder.payUrl,
      requestId: momoOrder.requestId,
    };
  } catch (error) {
    logger.error(`[MOMO] Tạo thanh toán thất bại: ${error.message}`);
    throw error;
  }
};

// Xác nhận thanh toán MoMo từ callback
const confirmMoMoPayment = async (callbackData) => {
  try {
    // Verify callback signature
    const isValid = momoUtil.verifySignature(callbackData);
    if (!isValid) {
      throw new Error("Invalid callback signature");
    }

    const { orderId, resultCode, message, transId } = callbackData;

    if (!orderId) {
      throw new Error("Order ID not found in callback data");
    }

    // Tìm payment và cập nhật status
    const payment = await Payment.findById(orderId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.method !== "momo") {
      throw new Error("Invalid payment method");
    }

    // Cập nhật payment status
    const updatedPayment = await Payment.findByIdAndUpdate(
      orderId,
      {
        status: resultCode === 0 ? "completed" : "failed",
        momoTransId: transId,
        paidAt: resultCode === 0 ? new Date() : null,
        gatewayResponse: { ...payment.gatewayResponse, callback: callbackData },
        timeline: [
          ...payment.timeline,
          {
            status: resultCode === 0 ? "completed" : "failed",
            changedAt: new Date(),
            note: `MoMo callback: ${message}`,
          },
        ],
      },
      { new: true }
    );

    // Cập nhật order status nếu thanh toán thành công
    if (resultCode === 0) {
      await Order.findByIdAndUpdate(payment.order, {
        status: "confirmed",
        $push: {
          timeline: {
            status: "confirmed",
            changedAt: new Date(),
            note: "Thanh toán MoMo thành công",
          },
        },
      });
    }

    return updatedPayment;
  } catch (error) {
    logger.error(`[MOMO] Callback thất bại: ${error.message}`);
    throw error;
  }
};

// Query MoMo payment status
const queryMoMoStatus = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.method !== "momo") {
      throw new Error("Payment not found or invalid method");
    }

    if (!payment.requestId) {
      throw new Error("Request ID not found");
    }

    const result = await momoUtil.queryOrder(paymentId, payment.requestId);

    // Cập nhật payment status dựa trên kết quả query
    if (result.success && result.data.resultCode === 0) {
      await Payment.findByIdAndUpdate(paymentId, {
        status: "completed",
        momoTransId: result.data.transId,
        paidAt: new Date(),
        gatewayResponse: { ...payment.gatewayResponse, query: result.data },
      });
    }

    return result;
  } catch (error) {
    logger.error(`[MOMO] Query status thất bại: ${error.message}`);
    throw error;
  }
};

export const requestRefund = async (userId, { paymentId, reason }) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw Object.assign(new Error("Không tìm thấy thanh toán"), { status: 404 });
  if (payment.user.toString() !== userId.toString()) throw Object.assign(new Error("Không có quyền"), { status: 403 });
  if (payment.status !== "completed") throw Object.assign(new Error("Chỉ hoàn tiền cho thanh toán đã hoàn tất"), { status: 400 });
  if (payment.refund?.requested) throw Object.assign(new Error("Đã gửi yêu cầu hoàn tiền"), { status: 400 });

  payment.refund = {
    requested: true,
    reason,
    requestedAt: new Date(),
  };
  payment.status = "refund_requested";
  payment.timeline.push({
    status: "refund_requested",
    changedBy: userId,
    changedAt: new Date(),
    note: reason,
  });
  await payment.save();
  return payment;
};

export const getPaymentHistory = async (userId, paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw Object.assign(new Error("Không tìm thấy thanh toán"), { status: 404 });
  if (payment.user.toString() !== userId.toString()) throw Object.assign(new Error("Không có quyền"), { status: 403 });
  return payment.timeline || [];
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

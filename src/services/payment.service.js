import Payment from "../models/payment.model.js";

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
  getMyPayments,
  getPaymentDetail,
};

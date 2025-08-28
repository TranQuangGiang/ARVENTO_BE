import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import zaloPayUtil from "../utils/payment/zalopay.util.js";
import momoUtil from "../utils/payment/momo.util.js";
import { logger } from "../config/index.js";
import { PAYMENT_TIMEOUTS } from "../config/payment.config.js";

/**
 * Payment Status Sync Service
 * Handles automatic payment status synchronization with payment gateways
 */

/**
 * Sync pending payments that haven't received webhook callbacks
 */
const syncPendingPayments = async () => {
  try {
    logger.info("[PAYMENT_SYNC] Starting pending payments sync");

    // Find payments that are still pending/processing and older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const pendingPayments = await Payment.find({
      status: { $in: ["pending", "processing"] },
      createdAt: { $lt: fiveMinutesAgo },
      method: { $in: ["zalopay", "momo"] }
    }).limit(50); // Process in batches

    logger.info(`[PAYMENT_SYNC] Found ${pendingPayments.length} pending payments to sync`);

    const results = {
      success: 0,
      failed: 0,
      unchanged: 0
    };

    for (const payment of pendingPayments) {
      try {
        const syncResult = await syncSinglePayment(payment);
        results[syncResult]++;

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`[PAYMENT_SYNC] Failed to sync payment ${payment._id}: ${error.message}`);
        results.failed++;
      }
    }

    logger.info(`[PAYMENT_SYNC] Sync completed: ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    logger.error(`[PAYMENT_SYNC] Sync process failed: ${error.message}`);
    throw error;
  }
};

/**
 * Sync single payment status
 */
const syncSinglePayment = async (payment) => {
  try {
    let queryResult;

    switch (payment.method) {
      case "zalopay":
        if (!payment.appTransId) {
          logger.warn(`[PAYMENT_SYNC] ZaloPay payment ${payment._id} missing appTransId`);
          return "failed";
        }
        queryResult = await zaloPayUtil.queryOrder(payment.appTransId);
        return await handleZaloPaySyncResult(payment, queryResult);

      case "momo":
        if (!payment.requestId) {
          logger.warn(`[PAYMENT_SYNC] MoMo payment ${payment._id} missing requestId`);
          return "failed";
        }
        queryResult = await momoUtil.queryOrder(payment._id.toString(), payment.requestId);
        return await handleMoMoSyncResult(payment, queryResult);

      default:
        logger.warn(`[PAYMENT_SYNC] Unsupported payment method: ${payment.method}`);
        return "failed";
    }
  } catch (error) {
    logger.error(`[PAYMENT_SYNC] Error syncing payment ${payment._id}: ${error.message}`);
    return "failed";
  }
};

/**
 * Handle ZaloPay sync result
 */
const handleZaloPaySyncResult = async (payment, queryResult) => {
  if (!queryResult.success) {
    return "unchanged";
  }

  const { return_code, zp_trans_id, return_message } = queryResult.data;

  if (return_code === 1) {
    // Payment successful
    await updatePaymentStatus(payment, {
      status: "completed",
      zpTransId: zp_trans_id,
      paidAt: new Date(),
      gatewayResponse: { ...payment.gatewayResponse, sync: queryResult.data },
      timeline: [
        ...payment.timeline,
        {
          status: "completed",
          changedAt: new Date(),
          note: `Auto-sync: ${return_message}`
        }
      ]
    });

    await updateOrderStatus(payment.order, "confirmed", "Thanh toán ZaloPay thành công (auto-sync)");
    return "success";

  } else if (return_code === 2) {
    // Payment failed
    await updatePaymentStatus(payment, {
      status: "failed",
      gatewayResponse: { ...payment.gatewayResponse, sync: queryResult.data },
      timeline: [
        ...payment.timeline,
        {
          status: "failed",
          changedAt: new Date(),
          note: `Auto-sync: ${return_message}`
        }
      ]
    });
    return "success";
  }

  return "unchanged";
};

/**
 * Handle MoMo sync result
 */
const handleMoMoSyncResult = async (payment, queryResult) => {
  if (!queryResult.success) {
    return "unchanged";
  }

  const { resultCode, transId, message } = queryResult.data;

  if (resultCode === 0) {
    // Payment successful
    await updatePaymentStatus(payment, {
      status: "completed",
      momoTransId: transId,
      paidAt: new Date(),
      gatewayResponse: { ...payment.gatewayResponse, sync: queryResult.data },
      timeline: [
        ...payment.timeline,
        {
          status: "completed",
          changedAt: new Date(),
          note: `Auto-sync: ${message}`
        }
      ]
    });

    await updateOrderStatus(payment.order, "confirmed", "Thanh toán MoMo thành công (auto-sync)");
    return "success";

  } else if (resultCode !== 9000) { // 9000 = pending
    // Payment failed
    await updatePaymentStatus(payment, {
      status: "failed",
      gatewayResponse: { ...payment.gatewayResponse, sync: queryResult.data },
      timeline: [
        ...payment.timeline,
        {
          status: "failed",
          changedAt: new Date(),
          note: `Auto-sync: ${message}`
        }
      ]
    });
    return "success";
  }

  return "unchanged";
};

/**
 * Update payment status
 */
const updatePaymentStatus = async (payment, updateData) => {
  await Payment.findByIdAndUpdate(payment._id, updateData);
  logger.info(`[PAYMENT_SYNC] Updated payment ${payment._id} status to ${updateData.status}`);
};

/**
 * Update order status
 */
const updateOrderStatus = async (orderId, status, note) => {
  const order = await Order.findById(orderId);
  if (!order) {
    logger.warn(`[PAYMENT_SYNC] Order ${orderId} not found`);
    return;
  }

  // Chỉ cập nhật order.status và timeline nếu đang pending
  if (order.status === "pending") {
    order.status = status;
    order.timeline.push({
      status,
      changedAt: new Date(),
      note
    });
  } else {
    logger.info(`[PAYMENT_SYNC] Order ${orderId} status is "${order.status}", skipping order status update`);
  }

  // Luôn cập nhật payment_status nếu chưa cancelled hoặc completed
  if (!["cancelled", "completed"].includes(order.payment_status)) {
    if (status === "cancelled") {
      order.payment_status = order.payment_method === "cod" ? "cancelled" : "refunded";
    } else if (status === "confirmed") {
      order.payment_status = "completed";
    }
  }

  await order.save();
  logger.info(`[PAYMENT_SYNC] Updated order ${orderId}: status=${order.status}, payment_status=${order.payment_status}`);
};


/**
 * Handle expired payments (timeout)
 */
const handleExpiredPayments = async () => {
  try {
    logger.info("[PAYMENT_SYNC] Checking for expired payments");

    const now = new Date();
    const expiredPayments = await Payment.find({
      status: { $in: ["pending", "processing"] },
      $or: [
        {
          method: "zalopay",
          createdAt: { $lt: new Date(now - PAYMENT_TIMEOUTS.ZALOPAY) }
        },
        {
          method: "momo",
          createdAt: { $lt: new Date(now - PAYMENT_TIMEOUTS.MOMO) }
        }
      ]
    });

    logger.info(`[PAYMENT_SYNC] Found ${expiredPayments.length} expired payments`);

    for (const payment of expiredPayments) {
      await updatePaymentStatus(payment, {
        status: "cancelled",
        timeline: [
          ...payment.timeline,
          {
            status: "cancelled",
            changedAt: new Date(),
            note: "Payment expired (timeout)"
          }
        ]
      });
    }

    return expiredPayments.length;
  } catch (error) {
    logger.error(`[PAYMENT_SYNC] Error handling expired payments: ${error.message}`);
    throw error;
  }
};

/**
 * Full payment reconciliation
 */
const reconcilePayments = async (dateFrom, dateTo) => {
  try {
    logger.info(`[PAYMENT_SYNC] Starting payment reconciliation from ${dateFrom} to ${dateTo}`);

    const payments = await Payment.find({
      createdAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      method: { $in: ["zalopay", "momo"] },
      status: { $ne: "completed" }
    });

    const results = {
      total: payments.length,
      synced: 0,
      failed: 0
    };

    for (const payment of payments) {
      try {
        const syncResult = await syncSinglePayment(payment);
        if (syncResult === "success") {
          results.synced++;
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.failed++;
        logger.error(`[PAYMENT_SYNC] Reconciliation failed for payment ${payment._id}: ${error.message}`);
      }
    }

    logger.info(`[PAYMENT_SYNC] Reconciliation completed: ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    logger.error(`[PAYMENT_SYNC] Reconciliation process failed: ${error.message}`);
    throw error;
  }
};

export default {
  syncPendingPayments,
  syncSinglePayment,
  handleExpiredPayments,
  reconcilePayments
};

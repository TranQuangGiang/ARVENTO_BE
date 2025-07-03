import paymentSyncService from '../services/paymentSync.service.js';
import paymentSyncJob from '../jobs/paymentSyncJob.js';
import { baseResponse } from '../utils/index.js';
import { logger } from '../config/index.js';

/**
 * Payment Sync Controller
 * Handles manual payment sync operations and job management
 */

/**
 * Manually sync pending payments
 */
const syncPendingPayments = async (req, res) => {
  try {
    logger.info('[PAYMENT_SYNC_CONTROLLER] Manual sync pending payments requested');
    
    const results = await paymentSyncService.syncPendingPayments();
    
    return baseResponse.successResponse(
      res,
      results,
      'Đồng bộ thanh toán pending thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Sync pending payments failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Manually sync single payment
 */
const syncSinglePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    logger.info(`[PAYMENT_SYNC_CONTROLLER] Manual sync payment ${paymentId} requested`);
    
    const Payment = (await import('../models/payment.model.js')).default;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return baseResponse.notFoundResponse(res, null, 'Không tìm thấy thanh toán');
    }
    
    const result = await paymentSyncService.syncSinglePayment(payment);
    
    return baseResponse.successResponse(
      res,
      { paymentId, result },
      `Đồng bộ thanh toán thành công: ${result}`
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Sync single payment failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Handle expired payments
 */
const handleExpiredPayments = async (req, res) => {
  try {
    logger.info('[PAYMENT_SYNC_CONTROLLER] Handle expired payments requested');
    
    const expiredCount = await paymentSyncService.handleExpiredPayments();
    
    return baseResponse.successResponse(
      res,
      { expiredCount },
      `Đã xử lý ${expiredCount} thanh toán hết hạn`
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Handle expired payments failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Reconcile payments for a date range
 */
const reconcilePayments = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    if (!dateFrom || !dateTo) {
      return baseResponse.badRequestResponse(
        res,
        null,
        'Vui lòng cung cấp dateFrom và dateTo'
      );
    }
    
    logger.info(`[PAYMENT_SYNC_CONTROLLER] Reconcile payments from ${dateFrom} to ${dateTo} requested`);
    
    const results = await paymentSyncService.reconcilePayments(dateFrom, dateTo);
    
    return baseResponse.successResponse(
      res,
      results,
      'Đối soát thanh toán thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Reconcile payments failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Get sync job status
 */
const getJobStatus = async (req, res) => {
  try {
    const status = paymentSyncJob.getStatus();
    
    return baseResponse.successResponse(
      res,
      status,
      'Lấy trạng thái job thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Get job status failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Start sync jobs
 */
const startJobs = async (req, res) => {
  try {
    logger.info('[PAYMENT_SYNC_CONTROLLER] Start sync jobs requested');
    
    paymentSyncJob.start();
    
    return baseResponse.successResponse(
      res,
      paymentSyncJob.getStatus(),
      'Khởi động sync jobs thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Start jobs failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Stop sync jobs
 */
const stopJobs = async (req, res) => {
  try {
    logger.info('[PAYMENT_SYNC_CONTROLLER] Stop sync jobs requested');
    
    paymentSyncJob.stop();
    
    return baseResponse.successResponse(
      res,
      paymentSyncJob.getStatus(),
      'Dừng sync jobs thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Stop jobs failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Manually trigger a specific job
 */
const triggerJob = async (req, res) => {
  try {
    const { jobName } = req.params;
    
    logger.info(`[PAYMENT_SYNC_CONTROLLER] Trigger job ${jobName} requested`);
    
    const result = await paymentSyncJob.triggerJob(jobName);
    
    return baseResponse.successResponse(
      res,
      result,
      `Thực thi job ${jobName} thành công`
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Trigger job failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Get sync statistics
 */
const getStatistics = async (req, res) => {
  try {
    logger.info('[PAYMENT_SYNC_CONTROLLER] Get statistics requested');
    
    const stats = await paymentSyncJob.getStatistics();
    
    return baseResponse.successResponse(
      res,
      stats,
      'Lấy thống kê thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Get statistics failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Get payment sync health check
 */
const getHealthCheck = async (req, res) => {
  try {
    logger.info('[PAYMENT_SYNC_CONTROLLER] Health check requested');
    
    const health = await paymentSyncJob.performHealthCheck();
    
    return baseResponse.successResponse(
      res,
      health,
      'Health check thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Health check failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

/**
 * Get payment sync dashboard data
 */
const getDashboard = async (req, res) => {
  try {
    logger.info('[PAYMENT_SYNC_CONTROLLER] Dashboard data requested');
    
    const [status, stats, health] = await Promise.all([
      paymentSyncJob.getStatus(),
      paymentSyncJob.getStatistics(),
      paymentSyncJob.performHealthCheck()
    ]);
    
    const dashboard = {
      jobStatus: status,
      statistics: stats,
      health: health,
      timestamp: new Date()
    };
    
    return baseResponse.successResponse(
      res,
      dashboard,
      'Lấy dashboard data thành công'
    );
  } catch (error) {
    logger.error(`[PAYMENT_SYNC_CONTROLLER] Get dashboard failed: ${error.message}`);
    return baseResponse.errorResponse(res, null, error.message);
  }
};

export default {
  // Manual sync operations
  syncPendingPayments,
  syncSinglePayment,
  handleExpiredPayments,
  reconcilePayments,
  
  // Job management
  getJobStatus,
  startJobs,
  stopJobs,
  triggerJob,
  
  // Monitoring
  getStatistics,
  getHealthCheck,
  getDashboard
};

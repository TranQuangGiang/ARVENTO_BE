import cron from "node-cron";
import paymentSyncService from "../services/paymentSync.service.js";
import { logger } from "../config/index.js";

/**
 * Payment Sync Cron Jobs
 * Handles automatic payment status synchronization
 */

class PaymentSyncJob {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start all payment sync jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn("[PAYMENT_SYNC_JOB] Jobs already running");
      return;
    }

    logger.info("[PAYMENT_SYNC_JOB] Starting payment sync jobs");

    // Job 1: Sync pending payments every 5 minutes
    this.jobs.set(
      "syncPending",
      cron.schedule(
        "*/5 * * * *",
        async () => {
          try {
            logger.info("[PAYMENT_SYNC_JOB] Running pending payments sync");
            await paymentSyncService.syncPendingPayments();
          } catch (error) {
            logger.error(`[PAYMENT_SYNC_JOB] Pending sync failed: ${error.message}`);
          }
        },
        {
          scheduled: false,
          timezone: "Asia/Ho_Chi_Minh",
        }
      )
    );

    // Job 2: Handle expired payments every 30 minutes
    this.jobs.set(
      "handleExpired",
      cron.schedule(
        "*/30 * * * *",
        async () => {
          try {
            logger.info("[PAYMENT_SYNC_JOB] Running expired payments check");
            const expiredCount = await paymentSyncService.handleExpiredPayments();
            logger.info(`[PAYMENT_SYNC_JOB] Handled ${expiredCount} expired payments`);
          } catch (error) {
            logger.error(`[PAYMENT_SYNC_JOB] Expired payments check failed: ${error.message}`);
          }
        },
        {
          scheduled: false,
          timezone: "Asia/Ho_Chi_Minh",
        }
      )
    );

    // Job 3: Daily reconciliation at 2 AM
    this.jobs.set(
      "dailyReconciliation",
      cron.schedule(
        "0 2 * * *",
        async () => {
          try {
            logger.info("[PAYMENT_SYNC_JOB] Running daily payment reconciliation");

            // Reconcile payments from yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const results = await paymentSyncService.reconcilePayments(yesterday, today);
            logger.info(`[PAYMENT_SYNC_JOB] Daily reconciliation completed: ${JSON.stringify(results)}`);
          } catch (error) {
            logger.error(`[PAYMENT_SYNC_JOB] Daily reconciliation failed: ${error.message}`);
          }
        },
        {
          scheduled: false,
          timezone: "Asia/Ho_Chi_Minh",
        }
      )
    );

    // Job 4: Health check every hour
    this.jobs.set(
      "healthCheck",
      cron.schedule(
        "0 * * * *",
        async () => {
          try {
            logger.info("[PAYMENT_SYNC_JOB] Running payment system health check");
            await this.performHealthCheck();
          } catch (error) {
            logger.error(`[PAYMENT_SYNC_JOB] Health check failed: ${error.message}`);
          }
        },
        {
          scheduled: false,
          timezone: "Asia/Ho_Chi_Minh",
        }
      )
    );

    // Start all jobs
    this.jobs.forEach((job, name) => {
      job.start();
      logger.info(`[PAYMENT_SYNC_JOB] Started job: ${name}`);
    });

    this.isRunning = true;
    logger.info("[PAYMENT_SYNC_JOB] All payment sync jobs started successfully");
  }

  /**
   * Stop all payment sync jobs
   */
  stop() {
    if (!this.isRunning) {
      logger.warn("[PAYMENT_SYNC_JOB] Jobs not running");
      return;
    }

    logger.info("[PAYMENT_SYNC_JOB] Stopping payment sync jobs");

    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`[PAYMENT_SYNC_JOB] Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    logger.info("[PAYMENT_SYNC_JOB] All payment sync jobs stopped");
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobName) {
    try {
      logger.info(`[PAYMENT_SYNC_JOB] Manually triggering job: ${jobName}`);

      switch (jobName) {
        case "syncPending":
          return await paymentSyncService.syncPendingPayments();

        case "handleExpired":
          return await paymentSyncService.handleExpiredPayments();

        case "dailyReconciliation": {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          return await paymentSyncService.reconcilePayments(yesterday, today);
        }

        case "healthCheck":
          return await this.performHealthCheck();

        default:
          throw new Error(`Unknown job: ${jobName}`);
      }
    } catch (error) {
      logger.error(`[PAYMENT_SYNC_JOB] Manual job trigger failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform health check on payment system
   */
  async performHealthCheck() {
    try {
      const Payment = (await import("../models/payment.model.js")).default;

      // Check for stuck payments (pending for more than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const stuckPayments = await Payment.countDocuments({
        status: { $in: ["pending", "processing"] },
        createdAt: { $lt: oneHourAgo },
        method: { $in: ["zalopay", "momo"] },
      });

      // Check for failed payments in last hour
      const failedPayments = await Payment.countDocuments({
        status: "failed",
        updatedAt: { $gte: oneHourAgo },
      });

      // Check for successful payments in last hour
      const successfulPayments = await Payment.countDocuments({
        status: "completed",
        updatedAt: { $gte: oneHourAgo },
      });

      const healthStatus = {
        timestamp: new Date(),
        stuckPayments,
        failedPayments,
        successfulPayments,
        status: stuckPayments > 10 ? "warning" : "healthy",
      };

      logger.info(`[PAYMENT_SYNC_JOB] Health check: ${JSON.stringify(healthStatus)}`);

      // Alert if too many stuck payments
      if (stuckPayments > 10) {
        logger.warn(`[PAYMENT_SYNC_JOB] WARNING: ${stuckPayments} stuck payments detected`);
        // Here you could send alerts via email, Slack, etc.
      }

      return healthStatus;
    } catch (error) {
      logger.error(`[PAYMENT_SYNC_JOB] Health check error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getStatistics() {
    try {
      const Payment = (await import("../models/payment.model.js")).default;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: {
              method: "$method",
              status: "$status",
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      return {
        date: today,
        statistics: stats,
      };
    } catch (error) {
      logger.error(`[PAYMENT_SYNC_JOB] Statistics error: ${error.message}`);
      throw error;
    }
  }
}

// Create singleton instance
const paymentSyncJob = new PaymentSyncJob();

export default paymentSyncJob;

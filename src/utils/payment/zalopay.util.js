import crypto from "crypto";
import moment from "moment";
import qs from "qs";
import axios from "axios";

/**
 * ZaloPay Utility Functions
 * Docs: https://docs.zalopay.vn/
 */

class ZaloPayUtil {
  constructor() {
    this.config = {
      app_id: process.env.ZALOPAY_APP_ID,
      key1: process.env.ZALOPAY_KEY1,
      key2: process.env.ZALOPAY_KEY2,
      endpoint: process.env.ZALOPAY_ENDPOINT,
      callback_url: process.env.ZALOPAY_CALLBACK_URL,
    };
  }

  /**
   * Tạo app_trans_id unique
   */
  generateAppTransId() {
    const today = moment().format("YYMMDD");
    const timestamp = Date.now();
    return `${today}_${timestamp}`;
  }

  /**
   * Tạo MAC signature cho request
   */
  createSignature(data) {
    const hmac = crypto.createHmac("sha256", this.config.key1);
    hmac.update(data);
    return hmac.digest("hex");
  }

  /**
   * Verify MAC signature từ callback
   */
  verifyCallback(data) {
    const { mac, ...params } = data;
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    const hmac = crypto.createHmac("sha256", this.config.key2);
    hmac.update(sortedParams);
    const calculatedMac = hmac.digest("hex");

    return mac === calculatedMac;
  }

  /**
   * Tạo order với ZaloPay
   */
  async createOrder(orderData) {
    const { amount, description, orderId, paymentId, userInfo = {} } = orderData;

    const app_trans_id = this.generateAppTransId();
    const embed_data = JSON.stringify({
      orderId,
      paymentId,
      userInfo,
      redirecturl: `http://localhost:5173/thanhcong?orderId=${orderId}`,
    });


    const order = {
      app_id: this.config.app_id,
      app_trans_id,
      app_user: userInfo.userId || "user123",
      app_time: Date.now(),
      amount,
      description,
      bank_code: "",
      item: JSON.stringify([
        {
          itemid: orderId,
          itemname: description,
          itemprice: amount,
          itemquantity: 1,
        },
      ]),
      embed_data,
      callback_url: this.config.callback_url,
    };

    const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    order.mac = this.createSignature(data);

    try {
      const response = await axios.post(this.config.endpoint, order, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        transformRequest: [(data) => qs.stringify(data)],
      });

      return {
        success: response.data.return_code === 1,
        data: response.data,
        app_trans_id,
        order_url: response.data.order_url,
      };
    } catch (error) {
      throw new Error(`ZaloPay API Error: ${error.message}`);
    }
  }

  /**
   * Query order status
   */
  async queryOrder(app_trans_id) {
    const data = `${this.config.app_id}|${app_trans_id}|${this.config.key1}`;
    const mac = this.createSignature(data);

    const queryData = {
      app_id: this.config.app_id,
      app_trans_id,
      mac,
    };

    try {
      const response = await axios.post("https://sb-openapi.zalopay.vn/v2/query", qs.stringify(queryData), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return {
        success: response.data.return_code === 1,
        data: response.data,
      };
    } catch (error) {
      throw new Error(`ZaloPay Query Error: ${error.message}`);
    }
  }

  /**
   * Refund order
   */
  async refundOrder(refundData) {
    const { app_trans_id, amount, description = "Hoàn tiền đơn hàng" } = refundData;

    const timestamp = Date.now();
    const uid = `${timestamp}${Math.floor(Math.random() * 1000)}`;

    const refund = {
      app_id: this.config.app_id,
      m_refund_id: `${moment().format("YYMMDD")}_${this.config.app_id}_${uid}`,
      timestamp,
      zp_trans_id: app_trans_id,
      amount,
      description,
    };

    const data = `${refund.app_id}|${refund.zp_trans_id}|${refund.amount}|${refund.description}|${refund.timestamp}`;
    refund.mac = this.createSignature(data);

    try {
      const response = await axios.post("https://sb-openapi.zalopay.vn/v2/refund", qs.stringify(refund), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return {
        success: response.data.return_code === 1,
        data: response.data,
      };
    } catch (error) {
      throw new Error(`ZaloPay Refund Error: ${error.message}`);
    }
  }
}

export default new ZaloPayUtil();

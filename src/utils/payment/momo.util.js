import crypto from 'crypto';
import axios from 'axios';

/**
 * MoMo Utility Functions
 * Docs: https://developers.momo.vn/
 */

class MoMoUtil {
  constructor() {
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      accessKey: process.env.MOMO_ACCESS_KEY,
      secretKey: process.env.MOMO_SECRET_KEY,
      endpoint: process.env.MOMO_ENDPOINT,
      callbackUrl: process.env.MOMO_CALLBACK_URL,
      returnUrl: process.env.MOMO_RETURN_URL
    };
  }

  /**
   * Tạo signature cho MoMo request
   */
  createSignature(rawSignature) {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  /**
   * Verify signature từ callback
   */
  verifySignature(data) {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = data;

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const calculatedSignature = this.createSignature(rawSignature);
    return signature === calculatedSignature;
  }

  /**
   * Tạo order với MoMo
   */
  async createOrder(orderData) {
    const {
      amount,
      orderInfo,
      orderId,
      userInfo = {},
      extraData = ""
    } = orderData;

    const requestId = `${orderId}_${Date.now()}`;
    const orderType = "momo_wallet";

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.config.callbackUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${this.config.returnUrl}&requestId=${requestId}&requestType=captureWallet`;
    
    const signature = this.createSignature(rawSignature);

    const requestBody = {
      partnerCode: this.config.partnerCode,
      partnerName: "ARVENTO",
      storeId: "ARVENTO_STORE",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: this.config.returnUrl,
      ipnUrl: this.config.callbackUrl,
      lang: "vi",
      requestType: "captureWallet",
      autoCapture: true,
      extraData,
      orderGroupId: "",
      signature
    };

    try {
      const response = await axios.post(this.config.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: response.data.resultCode === 0,
        data: response.data,
        requestId,
        payUrl: response.data.payUrl
      };
    } catch (error) {
      throw new Error(`MoMo API Error: ${error.message}`);
    }
  }

  /**
   * Query order status
   */
  async queryOrder(orderId, requestId) {
    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
    const signature = this.createSignature(rawSignature);

    const requestBody = {
      partnerCode: this.config.partnerCode,
      requestId: `${requestId}_query_${Date.now()}`,
      orderId,
      signature,
      lang: "vi"
    };

    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/query',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.resultCode === 0,
        data: response.data
      };
    } catch (error) {
      throw new Error(`MoMo Query Error: ${error.message}`);
    }
  }

  /**
   * Refund order
   */
  async refundOrder(refundData) {
    const {
      orderId,
      requestId,
      amount,
      transId,
      description = "Hoàn tiền đơn hàng"
    } = refundData;

    const refundRequestId = `${orderId}_refund_${Date.now()}`;
    
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${refundRequestId}&transId=${transId}`;
    const signature = this.createSignature(rawSignature);

    const requestBody = {
      partnerCode: this.config.partnerCode,
      requestId: refundRequestId,
      orderId,
      amount,
      transId,
      lang: "vi",
      description,
      signature
    };

    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/refund',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.resultCode === 0,
        data: response.data
      };
    } catch (error) {
      throw new Error(`MoMo Refund Error: ${error.message}`);
    }
  }

  /**
   * Generate QR Code for payment
   */
  async generateQRCode(orderData) {
    const {
      amount,
      orderInfo,
      orderId,
      extraData = ""
    } = orderData;

    const requestId = `${orderId}_qr_${Date.now()}`;
    
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&requestId=${requestId}&requestType=qrcode`;
    const signature = this.createSignature(rawSignature);

    const requestBody = {
      partnerCode: this.config.partnerCode,
      requestId,
      amount,
      orderId,
      orderInfo,
      requestType: "qrcode",
      extraData,
      lang: "vi",
      signature
    };

    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/pos',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.resultCode === 0,
        data: response.data,
        qrCodeUrl: response.data.qrCodeUrl
      };
    } catch (error) {
      throw new Error(`MoMo QR Code Error: ${error.message}`);
    }
  }
}

export default new MoMoUtil();

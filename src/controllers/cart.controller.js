import { cartService } from '../services/cart.service.js';
import responseUtil from '../utils/response.util.js';

export const cartController = {
  async getCart(req, res) {
    try {
      const cart = await cartService.getCart(req.user._id);
      responseUtil.successResponse(res, cart);
    } catch (err) {
      responseUtil.errorResponse(res, err.message);
    }
  },

  async addToCart(req, res) {
    try {
      const { product_id, variant_id, quantity } = req.body;
      const cart = await cartService.addToCart(req.user._id, product_id, variant_id, quantity);
      responseUtil.successResponse(res, cart, 'Thêm sản phẩm vào giỏ hàng thành công');
    } catch (err) {
      responseUtil.errorResponse(res, err.message);
    }
  },

  async updateCart(req, res) {
    try {
      const { product_id, variant_id, quantity } = req.body;
      const cart = await cartService.updateCart(req.user._id, product_id, variant_id, quantity);
      responseUtil.successResponse(res, cart, 'Cập nhật giỏ hàng thành công');
    } catch (err) {
      responseUtil.errorResponse(res, err.message);
    }
  },

  async removeFromCart(req, res) {
    try {
      const { product_id, variant_id } = req.body;
      const cart = await cartService.removeItem(req.user._id, product_id, variant_id);
      responseUtil.successResponse(res, cart, 'Xoá sản phẩm khỏi giỏ thành công');
    } catch (err) {
      responseUtil.errorResponse(res, err.message);
    }
  },

  async clearCart(req, res) {
    try {
      const cart = await cartService.clearCart(req.user._id);
      responseUtil.successResponse(res, cart, 'Đã xoá toàn bộ giỏ hàng');
    } catch (err) {
      responseUtil.errorResponse(res, err.message);
    }
  },

  async applyCoupon(req, res) {
    try {
      const { code } = req.body;
      const result = await cartService.applyCoupon(req.user._id, code);
      responseUtil.successResponse(res, result.cart, `Áp dụng mã giảm ${result.discount}% thành công`);
    } catch (err) {
      responseUtil.errorResponse(res, err.message);
    }
  }
};

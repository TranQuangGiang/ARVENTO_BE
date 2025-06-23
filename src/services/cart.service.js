import cartModel from '../models/cart.model.js';
import productModel from '../models/product.model.js';
import variantModel from '../models/variant.model.js';
import couponModel from '../models/coupon.model.js';

export const cartService = {
  async getCart(userId) {
    return cartModel.findOne({ user_id: userId }).populate('items.product_id items.variant_id');
  },

  async addToCart(userId, productId, variantId, quantity) {
    let cart = await cartModel.findOne({ user_id: userId });
    const variant = await variantModel.findById(variantId);
    if (!variant) throw new Error('Biến thể không tồn tại');

    const price = variant.price;
    const total_price = price * quantity;

    if (!cart) {
      cart = await cartModel.create({
        user_id: userId,
        items: [{ product_id: productId, variant_id: variantId, quantity, price, total_price }],
        total_quantity: quantity,
        total_price
      });
    } else {
      const index = cart.items.findIndex(i => i.product_id.equals(productId) && i.variant_id.equals(variantId));
      if (index > -1) {
        cart.items[index].quantity += quantity;
        cart.items[index].total_price = cart.items[index].price * cart.items[index].quantity;
      } else {
        cart.items.push({ product_id: productId, variant_id: variantId, quantity, price, total_price });
      }
      cart.total_quantity += quantity;
      cart.total_price = cart.items.reduce((sum, i) => sum + parseFloat(i.total_price), 0);
      await cart.save();
    }
    return cart;
  },

  async updateCart(userId, productId, variantId, quantity) {
    const cart = await cartModel.findOne({ user_id: userId });
    if (!cart) throw new Error('Giỏ hàng không tồn tại');

    const index = cart.items.findIndex(i => i.product_id.equals(productId) && i.variant_id.equals(variantId));
    if (index === -1) throw new Error('Sản phẩm không tồn tại trong giỏ');

    cart.items[index].quantity = quantity;
    cart.items[index].total_price = cart.items[index].price * quantity;
    cart.total_quantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    cart.total_price = cart.items.reduce((sum, i) => sum + parseFloat(i.total_price), 0);
    await cart.save();
    return cart;
  },

  async removeItem(userId, productId, variantId) {
    const cart = await cartModel.findOne({ user_id: userId });
    if (!cart) throw new Error('Giỏ hàng không tồn tại');

    cart.items = cart.items.filter(i => !(i.product_id.equals(productId) && i.variant_id.equals(variantId)));
    cart.total_quantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    cart.total_price = cart.items.reduce((sum, i) => sum + parseFloat(i.total_price), 0);
    await cart.save();
    return cart;
  },

  async clearCart(userId) {
    return cartModel.findOneAndUpdate(
      { user_id: userId },
      { items: [], total_quantity: 0, total_price: 0 },
      { new: true }
    );
  },

  async applyCoupon(userId, couponCode) {
    const coupon = await couponModel.findOne({ code: couponCode });
    if (!coupon || coupon.expiry < new Date()) throw new Error('Mã giảm giá không hợp lệ');

    const cart = await cartModel.findOne({ user_id: userId });
    if (!cart) throw new Error('Giỏ hàng không tồn tại');

    const discount = (parseFloat(cart.total_price) * coupon.discount_percent) / 100;
    cart.total_price = parseFloat(cart.total_price) - discount;
    await cart.save();
    return { cart, discount };
  }
};

import express from 'express';
import { cartController } from '../controllers/cart.controller.js';

const router = express.Router();

router.get('/cart',cartController.getCart);
router.post('/cart/add',cartController.addToCart);
router.put('/cart/update',cartController.updateCart);
router.delete('/cart/remove',cartController.removeFromCart);
router.post('/cart/apply-coupon',cartController.applyCoupon);
router.post('/cart/clear',cartController.clearCart);

export default router;
import express from 'express';
import userRouter from './user.route.js';
import productRouter from './product.route.js';
import bannerRouter from './banner.route.js';
import authRouter from './auth.route.js';
import categoryPostRouter from './categoryPost.routes.js';
import postRouter from './post.route.js';
import categoryRouter from './category.route.js';
import couponRouter from './coupon.routes.js';
import cartRouter from './cart.route.js';
import variantRouter from './variant.route.js';

const router = express.Router();
router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/banners', bannerRouter); 
router.use('/auth', authRouter);
router.use('/posts', postRouter); 
router.use('/categoryPost', categoryPostRouter);
router.use('/categories', categoryRouter);
router.use('/coupons', couponRouter);
router.use('/carts', cartRouter);
router.use('/variants', variantRouter);

export default router;

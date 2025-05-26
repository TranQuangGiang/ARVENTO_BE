import express from 'express';
import userRouter from './user.route.js';
import productRouter from './product.route.js';
import bannerRouter from './banner.route.js';

const router = express.Router();
router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/banners', bannerRouter); 
export default router;

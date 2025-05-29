import express from 'express';
import userRouter from './user.route.js';
import productRouter from './product.route.js';
import bannerRouter from './banner.route.js';
import authRouter from './auth.route.js';
// import categoryRouter from './category.route.js';
import postRouter from './post.route.js';

const router = express.Router();
router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/banners', bannerRouter); 
router.use('/auth', authRouter);
// router.use('/categories', categoryRouter);
router.use('/posts', postRouter); 

export default router;

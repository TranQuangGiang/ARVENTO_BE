import express from 'express';
import userRouter from './user.route.js';
import bannerRouter from './banner.route.js';

const router = express.Router();

router.use('/users', userRouter);
router.use('/banners', bannerRouter); 
export default router;

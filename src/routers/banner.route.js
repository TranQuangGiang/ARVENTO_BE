import express from 'express';
import { getBanners } from '../controllers/banner.controller.js';

const router = express.Router();

// Client routes
router.get('/', getBanners); // lấy tất cả banner

export default router;


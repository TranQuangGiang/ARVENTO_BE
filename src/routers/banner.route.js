import express from 'express';
import { getBanners } from '../controllers/banner.controller.js';
import { updateBannerPosition } from '../services/banner.service.js';
import { updateBannerStatus } from '../services/banner.service.js';


const router = express.Router();

// Client routes
router.get('/', getBanners); // lấy tất cả banner
//Bật tắt banner
router.patch('/:id/visibility', updateBannerStatus);
// Thay đổi vị trí hiển thị
router.patch('/:id/position', updateBannerPosition);
export default router;


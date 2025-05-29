import express from 'express';
import * as bannerController from '../controllers/banner.controller.js';
import { uploadBannerImage } from '../middlewares/upload.middleware.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
const router = express.Router();

// Routes công khai
router.get('/', bannerController.getBanners); // Lấy tất cả banner đang active cho client
router.get('/:id', bannerController.getBannerById); // Lấy chi tiết một banner theo ID
// Routes admin (yêu cầu xác thực và phân quyền)
// Lấy tất cả banner (cả active và inactive) cho admin
// router.get('/admin/all', authenticateToken, authorizeRoles(['admin']), bannerController.getAllBanners);
router.get('/admin/all', bannerController.getAllBanners);

// Thêm banner mới
// router.post(
//   '/admin', 
//   authenticateToken, 
//   authorizeRoles(['admin']), 
//   uploadBannerImage, 
//   bannerController.createBanner
// );
router.post(
  '/admin', 
  uploadBannerImage, 
  bannerController.createBanner
);

// Cập nhật banner
// router.put(
//   '/admin/:id', 
//   authenticateToken, 
//   authorizeRoles(['admin']), 
//   uploadBannerImage, 
//   bannerController.updateBanner
// );
router.put(
  '/admin/:id',  
  uploadBannerImage, 
  bannerController.updateBanner
);

// Cập nhật trạng thái banner (bật/tắt)
// router.patch(
//   '/admin/:id/visibility', 
//   authenticateToken, 
//   authorizeRoles(['admin']), 
//   bannerController.updateBannerStatus
// );
router.patch(
  '/admin/:id/visibility', 
  bannerController.updateBannerStatus
);

// Cập nhật vị trí banner
// router.patch(
//   '/admin/:id/position', 
//   authenticateToken, 
//   authorizeRoles(['admin']), 
//   bannerController.updateBannerPosition
// );
router.patch(
  '/admin/:id/position',  
  bannerController.updateBannerPosition
);

// Xóa banner
// router.delete(
//   '/admin/:id', 
//   authenticateToken, 
//   authorizeRoles(['admin']), 
//   bannerController.deleteBanner
// );
router.delete(
  '/admin/:id',  
  bannerController.deleteBanner
);
export default router;

import * as bannerService from '../services/banner.service.js';
// import { uploadSingle } from '../middlewares/upload.middleware.js';

// Get all banners
export const getBanners = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners();
    return res.status(200).json({
      success: true,
      data: banners,
      message: 'Banners retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
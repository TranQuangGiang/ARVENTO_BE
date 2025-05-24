import * as bannerService from '../services/banner.service.js';

// Get all active banners (chỉ banner đang bật, theo position)
export const getBanners = async (req, res) => {
  try {
    const banners = await bannerService.getActiveBanners();
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

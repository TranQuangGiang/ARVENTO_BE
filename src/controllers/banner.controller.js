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
// Get all banners (for admin)
export const getAllBanners = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners();
    return res.status(200).json({
      success: true,
      data: banners,
      message: 'All banners retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Get banner by ID
export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);
    return res.status(200).json({
      success: true,
      data: banner,
      message: 'Banner retrieved successfully'
    });
  } catch (error) {
    return res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};
// Thêm banner
export const createBanner = async (req, res) => {
  try {
    const { title, link, is_active, position } = req.body;
    console.log('Request file:', req.file);
     console.log('Request body:', req.body);
    const image_url = req.file?.url;

    console.log('Image URL:', image_url);
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'Không có ảnh được upload.'
      });
    }

    const banner = await bannerService.createBanner({
      image_url,
      title,
      link,
      is_active: is_active === 'true' || is_active === true,
      position: parseInt(position) || 0
    });

    res.status(201).json({
      success: true,
      data: banner,
      message: 'Thêm banner thành công.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Cập nhật banner
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, is_active, position } = req.body;
    
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (link !== undefined) updateData.link = link;
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;
    if (position !== undefined) updateData.position = parseInt(position);
    
    // Nếu có file mới được upload
    if (req.file?.url) {
      updateData.image_url = req.file.url;
    }
    
    const banner = await bannerService.updateBanner(id, updateData);
    
    res.status(200).json({
      success: true,
      data: banner,
      message: 'Cập nhật banner thành công.'
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};
// Cập nhật trạng thái banner (bật/tắt)
export const updateBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái banner (is_active) là bắt buộc'
      });
    }
    
    const isActive = is_active === 'true' || is_active === true;
    
    const banner = await bannerService.updateBannerStatus(id, isActive);
    
    res.status(200).json({
      success: true,
      data: banner,
      message: `Banner đã được ${isActive ? 'bật' : 'tắt'} thành công.`
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// Cập nhật vị trí banner
export const updateBannerPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;
    
    if (position === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vị trí banner (position) là bắt buộc'
      });
    }
    
    const positionValue = parseInt(position);
    
    if (isNaN(positionValue)) {
      return res.status(400).json({
        success: false,
        message: 'Vị trí banner phải là số'
      });
    }
    
    const banner = await bannerService.updateBannerPosition(id, positionValue);
    
    res.status(200).json({
      success: true,
      data: banner,
      message: 'Cập nhật vị trí banner thành công.'
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// Xóa banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await bannerService.deleteBanner(id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa banner thành công.'
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};
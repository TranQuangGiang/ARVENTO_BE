import * as bannerService from '../services/banner.service.js';
import {
  validateBannerData,
  validateId,
  validateRequiredTitle,
  validateImageFile,
  validateOptionalImageFile,
  validateBannerStatus,
  validateBannerPosition,
  validateUpdateFields,
  validateUpdateTitle
} from '../validations/banner.validation.js';

// Get all active banners (chỉ banner đang bật, theo position)
export const getBanners = async (req, res) => {
  try {
    const banners = await bannerService.getActiveBanners();
    return res.status(200).json({
      success: true,
      data: banners,
      message: 'Lấy danh sách banner thành công'
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
      message: 'Lấy tất cả banner thành công'
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
    
    // Validate ID
    const idError = validateId(id);
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError
      });
    }
    
    const banner = await bannerService.getBannerById(id);
    return res.status(200).json({
      success: true,
      data: banner,
      message: 'Lấy thông tin banner thành công'
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
    
    // Validate required title
    const titleError = validateRequiredTitle(title);
    if (titleError) {
      return res.status(400).json({
        success: false,
        message: titleError
      });
    }
    
    // Validate image upload
    const imageError = validateImageFile(req.file);
    if (imageError) {
      return res.status(400).json({
        success: false,
        message: imageError
      });
    }
    
    // Validate banner data
    const bannerData = {
      title: title?.trim(),
      link: link?.trim(),
      position
    };
    
    const validationErrors = validateBannerData(bannerData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validationErrors
      });
    }
    
    const banner = await bannerService.createBanner({
      image_url: req.file.url,
      title: title.trim(),
      link: link?.trim() || null,
      is_active: is_active === 'true' || is_active === true,
      position: parseInt(position) || 0
    });

    res.status(201).json({
      success: true,
      data: banner,
      message: 'Thêm banner thành công'
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
    
    // Validate ID
    const idError = validateId(id);
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError
      });
    }
    
    // Validate update fields
    const updateFieldsError = validateUpdateFields(req.body, req.file);
    if (updateFieldsError) {
      return res.status(400).json({
        success: false,
        message: updateFieldsError
      });
    }
    
    // Validate title if provided
    const titleError = validateUpdateTitle(title);
    if (titleError) {
      return res.status(400).json({
        success: false,
        message: titleError
      });
    }
    
    // Validate image file if uploaded
    const imageError = validateOptionalImageFile(req.file);
    if (imageError) {
      return res.status(400).json({
        success: false,
        message: imageError
      });
    }
    
    const updateData = {};
    
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    
    if (link !== undefined) {
      updateData.link = link?.trim() || null;
    }
    
    if (is_active !== undefined) {
      updateData.is_active = is_active === 'true' || is_active === true;
    }
    
    if (position !== undefined) {
      updateData.position = parseInt(position);
    }
    
    if (req.file?.url) {
      updateData.image_url = req.file.url;
    }
    
    // Validate update data
    const validationErrors = validateBannerData(updateData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validationErrors
      });
    }
    
    const banner = await bannerService.updateBanner(id, updateData);
    
    res.status(200).json({
      success: true,
      data: banner,
      message: 'Cập nhật banner thành công'
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
    
    // Validate ID
    const idError = validateId(id);
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError
      });
    }
    
    // Validate banner status
    const statusError = validateBannerStatus(is_active);
    if (statusError) {
      return res.status(400).json({
        success: false,
        message: statusError
      });
    }
    
    const isActive = is_active === 'true' || is_active === true;
    
    const banner = await bannerService.updateBannerStatus(id, isActive);
    
    res.status(200).json({
      success: true,
      data: banner,
      message: `Banner đã được ${isActive ? 'bật' : 'tắt'} thành công`
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
    
    // Validate ID
    const idError = validateId(id);
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError
      });
    }
    
    // Validate banner position
    const positionError = validateBannerPosition(position);
    if (positionError) {
      return res.status(400).json({
        success: false,
        message: positionError
      });
    }
    
    const positionValue = parseInt(position);
    const banner = await bannerService.updateBannerPosition(id, positionValue);
    
    res.status(200).json({
      success: true,
      data: banner,
      message: 'Cập nhật vị trí banner thành công'
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
    
    // Validate ID
    const idError = validateId(id);
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError
      });
    }
    
    await bannerService.deleteBanner(id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa banner thành công'
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};
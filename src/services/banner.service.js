import bannerModel from "../models/banner.model.js";

// Lấy tất cả banner đang bật và sắp xếp theo position
export const getActiveBanners = async () => {
  try {
    const banners = await bannerModel.find({ is_active: true }).sort({ position: 1 }).limit(10);
    return banners;
  } catch (error) {
    throw new Error(`Error fetching active banners: ${error.message}`);
  }
};
// Lấy tất cả banner (cho trang admin)
export const getAllBanners = async () => {
  try {
    const banners = await bannerModel.find({})
      .sort({ position: 1 });
    return banners;
  } catch (error) {
    throw new Error(`Error fetching all banners: ${error.message}`);
  }
};
// Lấy banner theo ID
export const getBannerById = async (id) => {
  try {
    const banner = await bannerModel.findById(id);
    if (!banner) {
      throw new Error('Banner not found');
    }
    return banner;
  } catch (error) {
    throw new Error(`Error fetching banner: ${error.message}`);
  }
};
// Thêm banner mới
export const createBanner = async (data) => {
  try {
    return await bannerModel.create(data);
  } catch (error) {
    throw new Error(`Error creating banner: ${error.message}`);
  }
};
// Cập nhật banner
export const updateBanner = async (id, data) => {
  try {
    const banner = await bannerModel.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
    
    if (!banner) {
      throw new Error('Banner not found');
    }
    
    return banner;
  } catch (error) {
    throw new Error(`Error updating banner: ${error.message}`);
  }
};

// Cập nhật trạng thái bật/tắt hiển thị banner
export const updateBannerStatus = async (id, isActive) => {
  try {
    const updatedBanner = await bannerModel.findByIdAndUpdate(
      id,
      { is_active: isActive },
      { new: true }
    );
    
    if (!updatedBanner) {
      throw new Error('Banner not found');
    }
    
    return updatedBanner;
  } catch (error) {
    throw new Error(`Error updating banner status: ${error.message}`);
  }
};

// Cập nhật vị trí hiển thị banner
export const updateBannerPosition = async (id, position) => {
  try {
    const updatedBanner = await bannerModel.findByIdAndUpdate(
      id,
      { position },
      { new: true }
    );
    
    if (!updatedBanner) {
      throw new Error('Banner not found');
    }
    
    return updatedBanner;
  } catch (error) {
    throw new Error(`Error updating banner position: ${error.message}`);
  }
};

// Xóa banner
export const deleteBanner = async (id) => {
  try {
    const banner = await bannerModel.findByIdAndDelete(id);
    
    if (!banner) {
      throw new Error('Banner not found');
    }
    
    return { message: 'Banner deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting banner: ${error.message}`);
  }
};
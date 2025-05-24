import bannerModel from "../models/banner.model.js";

// Lấy tất cả banner đang bật và sắp xếp theo position
export const getActiveBanners = async () => {
  try {
    const banners = await bannerModel.find({ is_active: true }).sort({ position: 1 });
    return banners;
  } catch (error) {
    throw new Error(`Error fetching active banners: ${error.message}`);
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
    return updatedBanner;
  } catch (error) {
    throw new Error(`Error updating banner position: ${error.message}`);
  }
};

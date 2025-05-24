import bannerModel from "../models/banner.model.js";

// Lấy tất cả banner
export const getAllBanners = async () => {
    try {
        const banners = await bannerModel.find({}).sort({ createdAt: -1 });
        return banners;

    }catch (error) {
        throw new Error(`Error fetching banners: ${error.message}`);
    }
};
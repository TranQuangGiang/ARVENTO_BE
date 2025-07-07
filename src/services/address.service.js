import addressModel from "../models/address.model.js";
import mongoose from "mongoose";
import ghnService from './ghn.service.js';
// import ghnService from './ghn.service.js';

export const validateAddressData = async (address) => {
  // 1. Validate tỉnh/thành
  const provinces = await ghnService.getProvinces();
  const province = provinces.find(p => p.ProvinceID === address.province_id);
  if (!province) {
    throw new Error(`ID tỉnh không tồn tại trong GHN: ${address.province_id}`);
  }
  if (province.ProvinceName.trim() !== address.province.trim()) {
    throw new Error(`Tên tỉnh không khớp GHN. Phải là: ${province.ProvinceName}`);
  }

  // 2. Validate quận/huyện thuộc tỉnh đã chọn
  const districts = await ghnService.getDistricts(address.province_id);
  const district = districts.find(d => d.DistrictID === address.district_id);
  if (!district) {
    throw new Error(`ID quận/huyện không tồn tại trong GHN hoặc không thuộc tỉnh này: ${address.district_id}`);
  }
  if (district.DistrictName.trim() !== address.district.trim()) {
    throw new Error(`Tên quận/huyện không khớp GHN. Phải là: ${district.DistrictName}`);
  }

  // 3. Validate phường/xã thuộc quận đã chọn
  const wards = await ghnService.getWards(address.district_id);
  const ward = wards.find(w => w.WardCode === address.ward_code);
  if (!ward) {
    throw new Error(`Mã phường/xã không tồn tại trong GHN hoặc không thuộc quận này: ${address.ward_code}`);
  }
  if (ward.WardName.trim() !== address.ward.trim()) {
    throw new Error(`Tên phường/xã không khớp GHN. Phải là: ${ward.WardName}`);
  }
};

const getAddressesByUserId = async (userId, { page = 1, limit = 10, sort = { created_at: -1 } } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  try {
    const result = await addressModel.paginate(
      { user: userId },
      {
        page,
        limit,
        sort,
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to get addresses: ${error.message}`);
  }
};

const getAddressById = async (addressId, userId = null) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new Error("Invalid address ID");
  }

  try {
    const query = { _id: addressId };
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }
      query.user = userId;
    }

    const address = await addressModel.findOne(query).populate('user', 'name email phone');
    if (!address) {
      throw new Error("Address not found");
    }
    return address;
  } catch (error) {
    throw new Error(`Failed to get address: ${error.message}`);
  }
};

const createAddress = async (userId, addressData) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }
  const {
    province, province_id,
    district, district_id,
    ward, ward_code,
    detail, phone, isDefault, label
  } = addressData;
  // Validate tối thiểu
  if (!province || !province_id || !district || !district_id || !ward || !ward_code) {
    throw new Error("Thiếu thông tin tỉnh/thành phố, quận/huyện hoặc phường/xã");
  }
try {
    const existingAddressCount = await addressModel.countDocuments({ user: userId });
    const shouldBeDefault = existingAddressCount === 0 || isDefault;
    const newAddress = await addressModel.create({
      user: userId,
      province,
      province_id,
      district,
      district_id,
      ward,
      ward_code,
      detail,
      phone,
      label,
      isDefault: shouldBeDefault,
    });

    return await addressModel.findById(newAddress._id).populate("user", "name email phone");
  } catch (error) {
    throw new Error(`Lỗi tạo địa chỉ: ${error.message}`);
  }
};

const updateAddress = async (addressId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new Error("Invalid address ID");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  try {
    const address = await addressModel.findOne({
      _id: addressId,
      user: userId,
    });
    if (!address) {
      throw new Error(
        "Address not found or you don't have permission to update it"
      );
    }

    // Nếu set địa chỉ này thành default, bỏ default ở các địa chỉ khác
    if (updateData.isDefault === true) {
      await addressModel.updateMany(
        { user: userId, _id: { $ne: addressId } },
        { isDefault: false }
      );
    }

    Object.assign(address, updateData);
    await address.save();

    return await addressModel
      .findById(address._id)
      .populate("user", "name email phone");
  } catch (error) {
    throw new Error(`Failed to update address: ${error.message}`);
  }
};
;

const deleteAddress = async (addressId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new Error("Invalid address ID");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  try {
    const address = await addressModel.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new Error("Address not found or you don't have permission to delete it");
    }

    const wasDefault = address.isDefault;
    await addressModel.findByIdAndDelete(addressId);

    // Nếu địa chỉ vừa xóa là mặc định, set địa chỉ khác làm mặc định
    if (wasDefault) {
      const remainingAddress = await addressModel.findOne({ user: userId }).sort({ created_at: 1 });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    return { message: "Address deleted successfully" };
  } catch (error) {
    throw new Error(`Failed to delete address: ${error.message}`);
  }
};

const setDefaultAddress = async (addressId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new Error("Invalid address ID");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  try {
    const address = await addressModel.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new Error("Address not found or you don't have permission to modify it");
    }

    // Set địa chỉ này làm mặc định (middleware sẽ tự động bỏ mặc định của các địa chỉ khác)
    address.isDefault = true;
    await address.save();

    return await addressModel.findById(address._id).populate('user', 'name email phone');
  } catch (error) {
    throw new Error(`Failed to set default address: ${error.message}`);
  }
};

const getDefaultAddress = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  try {
    const defaultAddress = await addressModel.findOne({ 
      user: userId, 
      isDefault: true 
    }).populate('user', 'name email phone');
    
    return defaultAddress;
  } catch (error) {
    throw new Error(`Failed to get default address: ${error.message}`);
  }
};



export default {
  getAddressesByUserId,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  validateAddressData
};

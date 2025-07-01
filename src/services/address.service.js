import addressModel from "../models/address.model.js";
import mongoose from "mongoose";

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

  try {
    // Kiểm tra xem user đã có địa chỉ nào chưa
    const existingAddressCount = await addressModel.countDocuments({ user: userId });
    
    // Nếu đây là địa chỉ đầu tiên hoặc được đánh dấu là mặc định
    const isFirstAddress = existingAddressCount === 0;
    const shouldBeDefault = isFirstAddress || addressData.isDefault;

    const newAddress = await addressModel.create({
      ...addressData,
      user: userId,
      isDefault: shouldBeDefault
    });

    return await addressModel.findById(newAddress._id).populate('user', 'name email phone');
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Duplicate address entry");
    }
    throw new Error(`Failed to create address: ${error.message}`);
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
    const address = await addressModel.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new Error("Address not found or you don't have permission to update it");
    }

    // Cập nhật address
    Object.assign(address, updateData);
    await address.save();

    return await addressModel.findById(address._id).populate('user', 'name email phone');
  } catch (error) {
    throw new Error(`Failed to update address: ${error.message}`);
  }
};

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

const validateAddressData = (data) => {
  const errors = [];
  
  if (!data.ward || data.ward.trim() === '') {
    errors.push('Phường/Xã là bắt buộc');
  }
  
  if (!data.district || data.district.trim() === '') {
    errors.push('Quận/Huyện là bắt buộc');
  }
  
  if (!data.province || data.province.trim() === '') {
    errors.push('Tỉnh/Thành phố là bắt buộc');
  }
  
  if (data.phone && !/^[0-9+\-\s()]+$/.test(data.phone)) {
    errors.push('Số điện thoại không hợp lệ');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return true;
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

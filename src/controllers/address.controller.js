import addressService from "../services/address.service.js";
import { baseResponse, parseQueryParams } from "../utils/index.js";
import Roles from "../constants/role.enum.js";
import { validateAddressData } from '../services/address.service.js';


const getAddresses = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Kiểm tra quyền truy cập
    const isAdmin = req.user.role === Roles.ADMIN;
    const isSelf = req.user._id.toString() === userId.toString();
    
    if (!isAdmin && !isSelf) {
      return baseResponse.forbiddenResponse(res, null, "Bạn không có quyền xem địa chỉ này");
    }

    const { page, limit, sort } = parseQueryParams(
      req.query,
      {},
      [],
      'created_at'
    );
   
    const addresses = await addressService.getAddressesByUserId(userId, { page, limit, sort });
    return baseResponse.successResponse(res, addresses, "Danh sách địa chỉ");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const getMyAddresses = async (req, res) => {
  try {
    const { page, limit, sort } = parseQueryParams(
      req.query,
      {},
      [],
      'created_at'
    );

    const addresses = await addressService.getAddressesByUserId(req.user._id, { page, limit, sort });
    return baseResponse.successResponse(res, addresses, "Danh sách địa chỉ của tôi");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.role === Roles.ADMIN ? null : req.user._id;
    
    const address = await addressService.getAddressById(id, userId);
    
    // Kiểm tra quyền truy cập nếu không phải admin
    if (req.user.role !== Roles.ADMIN && address.user._id.toString() !== req.user._id.toString()) {
      return baseResponse.forbiddenResponse(res, null, "Bạn không có quyền xem địa chỉ này");
    }
    
    return baseResponse.successResponse(res, address, "Thông tin địa chỉ");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const createAddress = async (req, res) => {
  try {
      const userId = req.user._id;
    
    // Kiểm tra quyền tạo địa chỉ
    const isAdmin = req.user.role === Roles.ADMIN;
    const isSelf = req.user._id.toString() === userId.toString();
    
    if (!isAdmin && !isSelf) {
      return baseResponse.forbiddenResponse(res, null, "Bạn không có quyền tạo địa chỉ cho user này");
    }

    // Validate dữ liệu
  await validateAddressData(req.body);
    
    const newAddress = await addressService.createAddress(userId, req.body);
    return baseResponse.createdResponse(res, newAddress, "Địa chỉ đã được tạo thành công");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const createMyAddress = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return baseResponse.unauthorizedResponse(res, null, "Người dùng chưa đăng nhập");
    }

    // Validate dữ liệu
   await validateAddressData(req.body);
    
    const newAddress = await addressService.createAddress(userId, req.body);
    return baseResponse.createdResponse(res, newAddress, "Địa chỉ đã được tạo thành công");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};


const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const targetUserId =
      req.user.role === Roles.ADMIN && req.body.userId
        ? req.body.userId
        : userId;
      await validateAddressData(req.body);
    const updatedAddress = await addressService.updateAddress(
      id,
      targetUserId,
      req.body
    );

    return baseResponse.successResponse(
      res,
      updatedAddress,
      "Địa chỉ đã được cập nhật thành công"
    );
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};


const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Admin có thể xóa bất kỳ địa chỉ nào, user chỉ có thể xóa địa chỉ của mình
    const targetUserId = req.user.role === Roles.ADMIN && req.body.userId ? req.body.userId : userId;
    
    const result = await addressService.deleteAddress(id, targetUserId);
    return baseResponse.successResponse(res, result, "Địa chỉ đã được xóa thành công");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Admin có thể set default cho bất kỳ địa chỉ nào, user chỉ có thể set cho địa chỉ của mình
    const targetUserId = req.user.role === Roles.ADMIN && req.body.userId ? req.body.userId : userId;
    
    const defaultAddress = await addressService.setDefaultAddress(id, targetUserId);
    return baseResponse.successResponse(res, defaultAddress, "Đã đặt làm địa chỉ mặc định");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Kiểm tra quyền truy cập
    const isAdmin = req.user.role === Roles.ADMIN;
    const isSelf = req.user._id.toString() === userId.toString();
    
    if (!isAdmin && !isSelf) {
      return baseResponse.forbiddenResponse(res, null, "Bạn không có quyền xem địa chỉ này");
    }
    
    const defaultAddress = await addressService.getDefaultAddress(userId);
    if (!defaultAddress) {
      return baseResponse.notFoundResponse(res, null, "Không tìm thấy địa chỉ mặc định");
    }
    
    return baseResponse.successResponse(res, defaultAddress, "Địa chỉ mặc định");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const getMyDefaultAddress = async (req, res) => {
  try {
    const defaultAddress = await addressService.getDefaultAddress(req.user._id);
    if (!defaultAddress) {
      return baseResponse.notFoundResponse(res, null, "Bạn chưa có địa chỉ mặc định");
    }
    
    return baseResponse.successResponse(res, defaultAddress, "Địa chỉ mặc định của tôi");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

export default {
  getAddresses,
  getMyAddresses,
  getAddressById,
  createAddress,
  createMyAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  getMyDefaultAddress
};

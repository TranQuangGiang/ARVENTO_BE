import userService from "../services/user.service.js";
import Roles from "../constants/role.enum.js";
import { baseResponse } from "../utils/index.js";

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return baseResponse.successResponse(res, users, "User list");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return baseResponse.notFoundResponse(res, null, "User not found");

    const isSelf = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === Roles.ADMIN;
    if (!isAdmin && !isSelf) return baseResponse.forbiddenResponse(res);

    return baseResponse.successResponse(res, user);
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await userService.getMe(req.user._id);
    return baseResponse.successResponse(res, user, "Profile information");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const updateMe = async (req, res) => {
  try {
    const updated = await userService.updateMe(req.user._id, req.body);
    return baseResponse.successResponse(res, updated, "Profile updated successfully");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return baseResponse.createdResponse(res, user, "User created successfully");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const isAdmin = req.user.role === Roles.ADMIN;
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isAdmin && !isSelf) return baseResponse.forbiddenResponse(res);

    const updated = await userService.updateUser(req.params.id, req.body);
    return baseResponse.successResponse(res, updated, "User updated successfully");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    return baseResponse.successResponse(res, null, "User deleted successfully");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!Object.values(Roles).includes(role)) {
      return baseResponse.badRequestResponse(res, null, "Invalid role");
    }
    const updated = await userService.changeUserRole(req.params.id, role);
    return baseResponse.successResponse(res, updated, "User role updated successfully");
  } catch (error) {
    return baseResponse.errorResponse(res, null, error.message);
  }
};

export default {
  getAllUsers,
  getUserById,
  getMe,
  updateMe,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
};

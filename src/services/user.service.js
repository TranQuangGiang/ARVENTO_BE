import { userModel } from "../models/index.js";
import mongoose from "mongoose";

const getAllUsers = async () => {
  try {
    return await userModel.find().select("-password");
  } catch (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }
};

const getUserById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  try {
    const user = await userModel.findById(id).select("-password");
    if (!user) throw new Error("User not found");
    return user;
  } catch (error) {
    throw new Error(`Failed to get user by ID: ${error.message}`);
  }
};

const getMe = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  try {
    const user = await userModel.findById(userId).select("-password");
    if (!user) throw new Error("User not found");
    return user;
  } catch (error) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }
};

const updateMe = async (userId, data) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  try {
    const updated = await userModel.findByIdAndUpdate(userId, data, { new: true }).select("-password");
    if (!updated) throw new Error("User not found");
    return updated;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

const createUser = async (data) => {
  try {
    return await userModel.create(data);
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

const updateUser = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  try {
    const updated = await userModel.findByIdAndUpdate(id, data, { new: true }).select("-password");
    if (!updated) throw new Error("User not found");
    return updated;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

const deleteUser = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  try {
    const deleted = await userModel.findByIdAndDelete(id);
    if (!deleted) throw new Error("User not found");
    return deleted;
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

const changeUserRole = async (id, role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  try {
    const updated = await userModel.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
    if (!updated) throw new Error("User not found");
    return updated;
  } catch (error) {
    throw new Error(`Failed to change user role: ${error.message}`);
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

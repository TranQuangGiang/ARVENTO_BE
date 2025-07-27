import MembershipTier from "../models/membershipTier.model.js";

const createTier = async (data) => {
  return await MembershipTier.create(data);
};

const getAllTiers = async () => {
  return await MembershipTier.find().sort({ min_spending: 1 });
};

const getTierById = async (id) => {
  return await MembershipTier.findById(id);
};

const updateTier = async (id, data) => {
  return await MembershipTier.findByIdAndUpdate(id, data, { new: true });
};

const deleteTier = async (id) => {
  return await MembershipTier.findByIdAndDelete(id);
};

export default {
  createTier,
  getAllTiers,
  getTierById,
  updateTier,
  deleteTier,
};

import service from "../services/membershipTier.service.js";
import responseUtil from "../utils/response.util.js";
import { StatusCodes } from "http-status-codes";

const create = async (req, res) => {
  const tier = await service.createTier(req.body);
  return responseUtil.successResponse(res, tier, "Tạo tier thành công", StatusCodes.CREATED);
};

const getAll = async (req, res) => {
  const tiers = await service.getAllTiers();
  return responseUtil.successResponse(res, tiers, "Lấy danh sách tier");
};

const getById = async (req, res) => {
  const tier = await service.getTierById(req.params.id);
  if (!tier) return responseUtil.notFoundResponse(res, null, "Không tìm thấy tier");
  return responseUtil.successResponse(res, tier, "Lấy chi tiết tier");
};

const update = async (req, res) => {
  const tier = await service.updateTier(req.params.id, req.body);
  if (!tier) return responseUtil.notFoundResponse(res, null, "Không tìm thấy tier để cập nhật");
  return responseUtil.successResponse(res, tier, "Cập nhật tier thành công");
};

const remove = async (req, res) => {
  const tier = await service.deleteTier(req.params.id);
  if (!tier) return responseUtil.notFoundResponse(res, null, "Không tìm thấy tier để xóa");
  return responseUtil.successResponse(res, tier, "Xóa tier thành công");
};

export default {
  create,
  getAll,
  getById,
  update,
  remove,
};

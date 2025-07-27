import express from "express";
import controller from "../controllers/membershipTier.controller.js";
import { validate } from '../middlewares/validate.middleware.js';
import {
  createMembershipTierSchema,     // Schema kiểm tra khi tạo mới
  updateMembershipTierSchema,     // Schema kiểm tra khi cập nhật
  membershipTierIdParam           // Schema kiểm tra params chứa id
} from "../validations/membershipTier.validation.js";

// Khởi tạo router của Express
const router = express.Router();

// ================== ROUTES ==================

// [GET] /api/tiers/
// → Lấy toàn bộ danh sách các Membership Tier
router.get("/", controller.getAll);

// [POST] /api/tiers/
// → Tạo mới một Membership Tier
// → Kiểm tra dữ liệu trong req.body theo schema createMembershipTierSchema
router.post(
  "/", 
  validate({ body: createMembershipTierSchema }), 
  controller.create
);

// [GET] /api/tiers/:id
// → Lấy chi tiết Membership Tier theo ID
// → Validate req.params.id có đúng định dạng MongoDB ObjectId không
router.get(
  "/:id", 
  validate({ params: membershipTierIdParam }), 
  controller.getById
);

// [PUT] /api/tiers/:id
// → Cập nhật thông tin Membership Tier theo ID
// → Validate cả params (id) và body (dữ liệu cập nhật)
router.put(
  "/:id", 
  validate({ 
    params: membershipTierIdParam, 
    body: updateMembershipTierSchema 
  }), 
  controller.update
);

// [DELETE] /api/tiers/:id
// → Xoá một Membership Tier theo ID
// → Validate params trước khi xoá
router.delete(
  "/:id", 
  validate({ params: membershipTierIdParam }), 
  controller.remove
);
// Export router để sử dụng ở file app.js hoặc main router
export default router;

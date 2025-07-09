// src/routes/ghn.route.js
import express from "express";
import * as ghnController from "../controllers/ghn.controller.js";
import { authMiddleware } from '../middlewares/index.js'
import Roles from '../constants/role.enum.js';
import {
  validateCalculateFee,
  validateCreateOrder,
} from "../validations/ghn.validation.js";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: GHN
 *   description: API lấy dữ liệu GHN (Tỉnh, Quận, Phường)
 */
/**
 * @swagger
 * /ghn/provinces:
 *   get:
 *     summary: Lấy danh sách tỉnh/thành phố từ GHN
 *     tags: [GHN]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ProvinceID:
 *                         type: number
 *                         example: 201
 *                       ProvinceName:
 *                         type: string
 *                         example: "Hà Nội"
 *                       Code:
 *                         type: string
 *                         example: "01"
 */

router.get("/provinces", ghnController.getProvinces);
/**
 * @swagger
 * /ghn/districts:
 *   get:
 *     summary: Lấy danh sách quận/huyện theo tỉnh từ GHN
 *     tags: [GHN]
 *     parameters:
 *       - in: query
 *         name: province_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của tỉnh/thành phố GHN
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       DistrictID:
 *                         type: number
 *                         example: 1451
 *                       DistrictName:
 *                         type: string
 *                         example: "Quận Ba Đình"
 */

router.get("/districts", ghnController.getDistricts);
/**
 * @swagger
 * /ghn/wards:
 *   get:
 *     summary: Lấy danh sách phường/xã theo quận/huyện từ GHN
 *     tags: [GHN]
 *     parameters:
 *       - in: query
 *         name: district_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của quận/huyện GHN
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       WardCode:
 *                         type: string
 *                         example: "00013"
 *                       WardName:
 *                         type: string
 *                         example: "Phường Điện Biên"
 */
router.get("/wards", ghnController.getWards);
/**
 * @swagger
 * /ghn/fee:
 *   post:
 *     summary: Tính phí giao hàng từ GHN
 *     tags: [GHN]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_id
 *               - to_district_id
 *               - to_ward_code
 *               - weight
 *             properties:
 *               service_id:
 *                 type: integer
 *                 example: 53321
 *               to_district_id:
 *                 type: integer
 *                 example: 1450
 *               to_ward_code:
 *                 type: string
 *                 example: "00014"
 *               weight:
 *                 type: integer
 *                 example: 1500
 *     responses:
 *       200:
 *         description: Tính phí thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 28000
 */

router.post("/fee",authMiddleware.authenticateToken, validateCalculateFee, ghnController.calculateFee);
/**
 * @swagger
 * /ghn/create-order:
 *   post:
 *     summary: Tạo đơn vận chuyển GHN
 *     tags: [GHN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shop_id
 *               - service_id
 *               - to_name
 *               - to_phone
 *               - to_address
 *               - to_ward_code
 *               - to_district_id
 *               - weight
 *               - items
 *             properties:
 *               shop_id:
 *                 type: integer
 *                 example: 123456
 *               service_id:
 *                 type: integer
 *                 example: 53321
 *               to_name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               to_phone:
 *                 type: string
 *                 example: "0912345678"
 *               to_address:
 *                 type: string
 *                 example: "123 Đường ABC"
 *               to_ward_code:
 *                 type: string
 *                 example: "00014"
 *               to_district_id:
 *                 type: integer
 *                 example: 1450
 *               weight:
 *                 type: integer
 *                 example: 1500
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Giày thể thao"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     price:
 *                       type: number
 *                       example: 300000
 *                     weight:
 *                       type: integer
 *                       example: 500
 *     responses:
 *       200:
 *         description: Tạo đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_code:
 *                       type: string
 *                       example: "S12345678"
 */

router.post("/create-order", validateCreateOrder, ghnController.createOrder);
/**
 * @swagger
 * /ghn/order/{orderCode}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng GHN
 *     tags: [GHN]
 *     parameters:
 *       - in: path
 *         name: orderCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã đơn hàng GHN (order_code)
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_code:
 *                       type: string
 *                       example: "S12345678"
 *                     status:
 *                       type: string
 *                       example: "delivering"
 *                     total_fee:
 *                       type: number
 *                       example: 28000
 *                     expected_delivery_time:
 *                       type: string
 *                       example: "2025-07-10T15:30:00"
 */

router.get("/order/:orderCode", ghnController.orderDetail);
/**
 * @swagger
 * /ghn/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ GHN
 *     tags: [GHN]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       service_id:
 *                         type: integer
 *                         example: 53321
 *                       short_name:
 *                         type: string
 *                         example: "GHN Fast"
 *                       service_type_id:
 *                         type: integer
 *                         example: 2
 */

router.get("/services", ghnController.getServices);
export default router;

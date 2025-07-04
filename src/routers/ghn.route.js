// src/routes/ghn.route.js
import express from "express";
import * as ghnController from "../controllers/ghn.controller.js";

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

export default router;

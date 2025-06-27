import express from 'express';
import favoriteController from '../controllers/favorite.controller.js';
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Quản lý sản phẩm yêu thích (Client & Admin)
 */
//// ==== CLIENT ROUTES ==== ////

// Thêm vào yêu thích
/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id]
 *             properties:
 *               product_id:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *     responses:
 *       201:
 *         description: Đã thêm vào yêu thích
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

router.post('/',authMiddleware.authenticateToken, favoriteController.addToFavorites);

// Xóa khỏi yêu thích
/**
 * @swagger
 * /favorites/{product_id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/:product_id',authMiddleware.authenticateToken, favoriteController.removeFromFavorites);

// Lấy danh sách sản phẩm yêu thích
/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích của người dùng
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm yêu thích
 */
router.get('/', authMiddleware.authenticateToken, favoriteController.getFavorites);

// Kiểm tra sản phẩm đã được thích chưa
/**
 * @swagger
 * /favorites/check/{product_id}:
 *   get:
 *     summary: Kiểm tra sản phẩm đã được yêu thích hay chưa
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Trạng thái yêu thích
 */
router.get('/check/:product_id',authMiddleware.authenticateToken, favoriteController.checkFavorite);



//// ==== ADMIN ROUTES ==== ////

// Top sản phẩm được yêu thích nhiều nhất
/**
 * @swagger
 * /favorites/admin/popular-products:
 *   get:
 *     summary: "[Admin] Top sản phẩm được yêu thích nhiều nhất"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm phổ biến
 */
router.get('/admin/popular-products',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), favoriteController.getPopularProducts);

// Đếm số lượt thích của một sản phẩm
/**
 * @swagger
 * /favorites/admin/products/{id}/favorites-count:
 *   get:
 *     summary: "[Admin] Đếm số lượt thích của sản phẩm"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Tổng số lượt thích
 */
router.get('/admin/products/:id/favorites-count',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), favoriteController.getFavoriteCount);

// Xem người dùng đã yêu thích sản phẩm
/**
 * @swagger
 * /favorites/admin/products/{id}/favorited-by:
 *   get:
 *     summary: "[Admin] Danh sách người dùng đã yêu thích sản phẩm"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get('/admin/products/:id/favorited-by',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), favoriteController.getUsersFavoritedProduct);

export default router;

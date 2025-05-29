import express from 'express';
import { postController } from '../controllers/index.js';
import { uploadPostImages } from '../middlewares/upload.middleware.js';
import { authMiddleware } from '../middlewares/index.js'
import Roles from '../constants/role.enum.js';
const router = express.Router();


// PUBLIC ROUTES - Chỉ lấy published posts
router.get('/', postController.getAllPosts);
router.get('/category/:categoryName', postController.getPostsByCategoryName);
router.get('/categories', postController.getCategories);
router.get('/:id', postController.getPostById);



// ADMIN ROUTES - Có thể lấy tất cả posts
router.get('/admin/all', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),postController.getAllPostsAdmin);
router.get('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),postController.getPostByIdAdmin);
router.post('/admin', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),uploadPostImages, postController.createPost);
router.put('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),uploadPostImages, postController.updatePost);
router.delete('/admin/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN),postController.deletePost);
router.patch('/admin/:id/category', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), postController.updatePostCategory);

export default router;

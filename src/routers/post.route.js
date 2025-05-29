import express from 'express';
import { postController } from '../controllers/index.js';
import { uploadPostImages } from '../middlewares/upload.middleware.js';

const router = express.Router();


// PUBLIC ROUTES - Chỉ lấy published posts
router.get('/', postController.getAllPosts);
router.get('/category/:categoryName', postController.getPostsByCategoryName);
router.get('/categories', postController.getCategories);
router.get('/:id', postController.getPostById);



// ADMIN ROUTES - Có thể lấy tất cả posts
router.get('/admin/all', postController.getAllPostsAdmin);
router.get('/admin/:id', postController.getPostByIdAdmin);
router.post('/admin', uploadPostImages, postController.createPost);
router.put('/admin/:id', uploadPostImages, postController.updatePost);
router.delete('/admin/:id', postController.deletePost);
router.patch('/admin/:id/category', postController.updatePostCategory);

export default router;

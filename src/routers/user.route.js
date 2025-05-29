import express from 'express';
import { authMiddleware } from '../middlewares/index.js'
import {userController } from '../controllers/index.js'
import Roles from '../constants/role.enum.js';
const router = express.Router();

router.get('/', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.getAllUsers);
router.get('/me', authMiddleware.authenticateToken, userController.getMe);
router.put('/me', authMiddleware.authenticateToken, userController.updateMe);


router.get('/:id', authMiddleware.authenticateToken, userController.getUserById);
router.put('/:id', authMiddleware.authenticateToken, userController.updateUser);
router.post('/', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.createUser);
router.delete('/:id', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.deleteUser);
router.patch('/:id/role', authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), userController.changeUserRole);

export default router;
import express from 'express';
import optionController from '../controllers/option.controller.js';
import Roles from '../constants/role.enum.js';
import { authMiddleware } from '../middlewares/index.js'
const router = express.Router();

router.post('/batch',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), optionController.createMultipleOptions);
router.get('/', optionController.getAllOptions);
router.get('/:key', optionController.getOptionByKey);
router.put('/:key',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), optionController.updateOptionByKey);
router.delete('/:key',authMiddleware.authenticateToken, authMiddleware.authorizeRoles(Roles.ADMIN), optionController.deleteOptionByKey);

export default router;

const express = require('express');
const router = express.Router();
const auth  = require('../Middleware/Auth');
const isAdmin  = require('../Middleware/Admin.js');
const userController = require("../controller/userController")


router.get('/',auth,isAdmin,userController.getAllUsers);
router.post('/create', userController.createUser);
router.post('/findByUserName',auth, isAdmin,userController.findByUserName);
router.post('/changePassword', userController.changePassword);
router.post('/deleteUser',auth,isAdmin,userController.deleteUser);
router.post('/login', userController.login);


module.exports = router;
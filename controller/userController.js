const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key';

async function getAllUsers(req, res) {
    try {
        console.log("[getAllUsers] req.user=>",req.user);
       
        var users = await User.find();
        var data = {
            success: true,
            data: users,
            message: ""
        };
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function createUser(req, res) {
    try {
        console.log("[createUser] req=>", req.body); // log request
        const newUser = new User({ username: req.body.username, password: req.body.password }); //  tạo modeluser mới 
        await newUser.save(); // lưu model user vừa tạo vào db
        var data = {
            success: true,
            data: newUser,
            message: "thêm user thành công!"
        };
        return res.json(data);
    } catch (error) {
        console.log("[createUser] req=>", error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function findByUserName(req, res) {
    try {
        console.log("[findUserById] req=>", req.body); // log request
        var finduser = await User.findOne({ username: req.body.username });
        console.log("finduser=>", finduser);
        if (finduser == null) {
            var data = {
                success: true,
                data: null,
                message: "đéo tìm thấy user!"
            };
            return res.json(data);
        } else {
            var data = {
                success: true,
                data: finduser,
                message: "đã tìm thấy user!"
            };
            return res.json(data);
        }

    } catch (error) {
        console.log("[createUser] req=>", error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function changePassword(req, res) {
    try {
        console.log("[changePassword] req=>", req.body); // log request
        var finduser = await User.findOne({ username: req.body.username });
        console.log("finduser=>", finduser);
        if (finduser == null) {
            var data = {
                success: true,
                data: null,
                message: "đéo tìm thấy user!"
            };
            return res.json(data);
        } else {

            if (req.body.password == finduser.password) {
                finduser.password = req.body.newpassword;
                finduser.save();
                var data = {
                    success: true,
                    data: finduser,
                    message: "đổi mật khẩu thành công!"
                };
                return res.json(data);
            } else {
                var data = {
                    success: true,
                    data: null,
                    message: "sai mật khẩu!"
                };
                return res.json(data);
            }
        }
    } catch (error) {
        console.log("[createUser] req=>", error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function deleteUser(req, res) {
    try {
        console.log("[deleteUser] req.body=>", req.body); // log request

        console.log("[deleteUser] req.user=>",req.user);
       
        var finduser = await User.findOne({ username: req.body.username });
        console.log("finduser=>", finduser);
        if (finduser == null) {
            var data = {
                success: true,
                data: null,
                message: "đéo tìm thấy user để xóa!"
            };
            return res.json(data);
        } else {

            await finduser.deleteOne();
            var data = {
                success: true,
                data: null,
                message: "đã xóa user " + req.body.username
            };
            return res.json(data);
        }
        res.json(1);
    } catch (error) {
        console.log("[createUser] req=>", error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function login(req, res) {
    try {
        console.log("[findUserById] req=>", req.body); // log request
        var finduser = await User.findOne({ username: req.body.username });
        console.log("finduser=>", finduser);
        if (finduser == null) {
            var data = {
                success: true,
                data: null,
                message: "đéo tìm thấy user!"
            };
            return res.json(data);
        } else {
            if (req.body.password == finduser.password) {

                const token = jwt.sign(
                    {
                        id: finduser._id,
                        username: finduser.username,
                        role: finduser.role
                    },
                    JWT_SECRET,
                    { expiresIn: '1h' } // thời hạn của token
                );

                var data = {
                    success: true,
                    data: {
                        accesstoken: token
                    },
                    message: "đăng nhập thành công!"
                };
                return res.json(data);
            } else {
                var data = {
                    success: true,
                    data: null,
                    message: "sai mật khẩu!"
                };
                return res.json(data);
            }
        }

    } catch (error) {
        console.log("[createUser] req=>", error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports = { getAllUsers, createUser, findByUserName, changePassword, deleteUser, login }
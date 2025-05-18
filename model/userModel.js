const mongoose = require('mongoose');

const UserRole = Object.freeze({
    USER: 0,
    ADMIN: 1
});

const userschema = new mongoose.Schema({
    username : { type: String, require: true, },
    password : { type: String, require: true, },
    // role: {
    //     type: Number,
    //     enum: Object.values(UserRole), // Chỉ cho phép 0 hoặc 1
    //     default: UserRole.USER
    // }
    role : {type:  Number, default: 0},
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', userschema );
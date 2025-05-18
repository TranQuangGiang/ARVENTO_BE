const mongoose = require('mongoose');

const productschema = new mongoose.Schema({
    name : { type: String, require: true, },
    price : { type: Number, require: true, },
    image : { type: String, require: true, },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('product', productschema );
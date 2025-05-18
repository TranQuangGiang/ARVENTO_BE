const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key';

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Kiểm tra xem có header Authorization không
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Không có token!' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ!' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // gán user đã giải mã vào req để dùng tiếp
        next(); // tiếp tục middleware hoặc controller tiếp theo
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
}

module.exports = authMiddleware;
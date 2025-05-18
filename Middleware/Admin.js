function isAdmin(req, res, next) {
    if (req.user && req.user.role === 1) {
        next(); // có quyền => tiếp tục
    } else {
        return res.status(403).json({
            success: false,
            data: null,
            message: "Mày đéo phải admin!"
        });
    }
}

module.exports = isAdmin;
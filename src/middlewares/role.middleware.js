const User = require("../models/User");

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - role names (e.g. "admin")
 */
const roleCheck = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            // req.user.id comes from authMiddleware (JWT)
            const user = await User.findById(req.user.id).populate("role", "name");

            if (!user || !user.role) {
                return res.status(401).json({
                    message: "Unauthorized Access",
                });
            }

            const userRoleName = user.role.name;

            if (!allowedRoles.includes(userRoleName)) {
                return res.status(403).json({
                    message: "Forbidden: Access denied",
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                message: "Role check failed",
                error: error.message,
            });
        }
    };
};

module.exports = roleCheck;

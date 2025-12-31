const User = require("../models/User");

/**
 * Role-based access control middleware
 * @param {string[] | ...string} roles - allowed roles
 *
 * Usage:
 *  roleCheck("admin")
 *  roleCheck("admin", "teacher")
 *  roleCheck(["admin", "teacher"])
 */
const roleCheck = (roles) => {
    // Normalize roles to array
    const allowedRoles = Array.isArray(roles) ? roles : Array.from(arguments);

    return async (req, res, next) => {
        try {
            // req.user.id comes from auth middleware (JWT)
            const user = await User
                .findById(req.user.id)
                .populate("role", "name");

            if (!user || !user.role) {
                return res.status(401).json({
                    message: "Unauthorized access",
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

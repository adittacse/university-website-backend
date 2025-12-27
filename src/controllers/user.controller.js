const User = require("../models/User");
const Role = require("../models/Role");

/**
 * UPDATE USER ROLE (Admin only)
 */
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleId } = req.body;

        if (!roleId) {
            return res.status(400).json({
                message: "roleId is required",
            });
        }

        // check role exists
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(404).json({
                message: "Role not found",
            });
        }

        // update user role
        const user = await User.findByIdAndUpdate(
            id,
            { role: role._id },
            { new: true },
        ).populate("role", "name");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json({
            message: "User role updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update user role",
            error: error.message,
        });
    }
};

module.exports = { updateUserRole };
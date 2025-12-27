const User = require("../models/User");
const Role = require("../models/Role");

/**
 * GET /api/users
 * Admin only
 */
const getUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 10;
        const search = req.query.search || "";

        const query = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        };

        const total = await User.countDocuments(query);

        const users = await User.find(query)
            .populate("role", "name")
            .select("-password")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ name: "asc" });

        res.json({
            data: users,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

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

/**
 * DELETE /api/users/:id
 * Admin only (soft delete)
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete user" });
    }
};

module.exports = { getUsers, updateUserRole, deleteUser };
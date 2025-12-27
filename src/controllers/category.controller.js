const Category = require("../models/Category");

// CREATE category
const createCategory = async (req, res) => {
    try {
        const { name, parent } = req.body;

        const exists = await Category.findOne({ name, parent: parent || null });

        if (exists) {
            return res.status(409).json({ message: `Category '${name}' already exists under this parent` });
        }

        const category = await Category.create({ name, parent: parent || null });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create category",
            error: error.message,
        });
    }
};

// READ all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate("parent");
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parent } = req.body;

        const exists = await Category.findOne({
            name,
            parent: parent || null,
            _id: { $ne: id },
        });

        if (exists) {
            return res.status(409).json({ message: `Category '${name}' already exists under this parent` });
        }

        const category = await Category.findByIdAndUpdate(
            id,
            { name, parent: parent || null },
            { new: true },
        );

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
};

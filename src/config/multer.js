const multer = require("multer");
const path = require("path");
const fs = require("fs");

// const uploadDir = "uploads/notice";
const uploadDir = "uploads/notice/active";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/pdf",
        "application/zip",
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, ZIP, JPG, PNG, WEBP files are allowed"));
    }
};

const uploadNotice = multer({
    storage,
    fileFilter,
});

module.exports = uploadNotice;

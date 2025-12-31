const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        return {
            folder: "university/notices",
            resource_type: "image",          //  ONLY IMAGE
            public_id: `notice_${Date.now()}`, //  NO extension here
        };
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        //  Only images allowed
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

module.exports = upload;

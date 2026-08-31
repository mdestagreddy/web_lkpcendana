const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const isLocalhost = (req) => {
    const hostname = req.hostname || '';
    return hostname === 'localhost' || hostname === '127.0.0.1';
};

const memoryStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.'), false);
    }
};

const upload = multer({
    storage: function (req) {
        return isLocalhost(req) ? diskStorage : memoryStorage;
    },
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: fileFilter,
});

module.exports = upload;

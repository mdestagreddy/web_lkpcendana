const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = require('../middleware/upload');
const { authMiddleware } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isLocalhost = (req) => {
    const hostname = req.hostname || '';
    return hostname === 'localhost' || hostname === '127.0.0.1';
};

const isCloudinaryUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('cloudinary.com');
    } catch {
        return false;
    }
};

const getPublicIdFromUrl = (url) => {
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && parts[uploadIndex + 1] && parts[uploadIndex + 1].startsWith('v')) {
            const publicIdParts = parts.slice(uploadIndex + 2);
            const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
            return publicId;
        }
    } catch {
        // ignore
    }
    return null;
};

const deleteFromCloudinary = async (url) => {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
        throw new Error('Could not extract public_id from Cloudinary URL');
    }
    return cloudinary.uploader.destroy(publicId);
};

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await processImage(req.file, req.body, req);
        res.json({
            message: 'File uploaded successfully',
            url: result.url,
            filename: result.filename,
            originalname: result.originalname,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.size,
        });
    } catch (err) {
        console.error('Image processing error:', err);
        res.status(500).json({ error: 'Failed to process image: ' + err.message });
    }
});

router.delete('/upload', authMiddleware, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL gambar wajib diisi' });
    }

    try {
        if (isCloudinaryUrl(url)) {
            const result = await deleteFromCloudinary(url);
            if (result.result !== 'ok' && result.result !== 'not found') {
                return res.status(500).json({ error: 'Gagal menghapus gambar dari Cloudinary' });
            }
            return res.json({ message: 'Gambar berhasil dihapus dari Cloudinary', url });
        }

        let filename;
        try {
            filename = path.basename(new URL(url).pathname);
        } catch {
            filename = path.basename(url);
        }
        filename = decodeURIComponent(filename);
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            console.warn('Delete image: file not found', { url, filename, filePath });
            return res.status(404).json({ error: 'File tidak ditemukan', filename, filePath });
        }

        fs.unlinkSync(filePath);

        const thumbName = path.parse(filename).name + '_thumb' + path.extname(filename);
        const thumbPath = path.join(uploadDir, thumbName);
        if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
        }

        res.json({ message: 'Gambar berhasil dihapus', filename });
    } catch (err) {
        console.error('Delete image error:', err);
        res.status(500).json({ error: 'Gagal menghapus gambar: ' + err.message });
    }
});

router.post('/delete', authMiddleware, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL gambar wajib diisi' });
    }

    try {
        if (isCloudinaryUrl(url)) {
            const result = await deleteFromCloudinary(url);
            if (result.result !== 'ok' && result.result !== 'not found') {
                return res.status(500).json({ error: 'Gagal menghapus gambar dari Cloudinary' });
            }
            return res.json({ message: 'Gambar berhasil dihapus dari Cloudinary', url });
        }

        let filename;
        try {
            filename = path.basename(new URL(url).pathname);
        } catch {
            filename = path.basename(url);
        }
        filename = decodeURIComponent(filename);
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            console.warn('Delete image: file not found', { url, filename, filePath });
            return res.status(404).json({ error: 'File tidak ditemukan', filename, filePath });
        }

        fs.unlinkSync(filePath);

        const thumbName = path.parse(filename).name + '_thumb' + path.extname(filename);
        const thumbPath = path.join(uploadDir, thumbName);
        if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
        }

        res.json({ message: 'Gambar berhasil dihapus', filename });
    } catch (err) {
        console.error('Delete image error:', err);
        res.status(500).json({ error: 'Gagal menghapus gambar: ' + err.message });
    }
});

router.post('/upload/batch', authMiddleware, upload.array('files', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
        const results = [];
        for (const file of req.files) {
            const result = await processImage(file, req.body, req);
            results.push(result);
        }
        res.json({ message: 'Files uploaded successfully', files: results });
    } catch (err) {
        console.error('Batch image processing error:', err);
        res.status(500).json({ error: 'Failed to process images: ' + err.message });
    }
});

const reviewStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const reviewMemoryStorage = multer.memoryStorage();

const publicReviewUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: upload.fileFilter,
});

router.post('/review', publicReviewUpload.array('images', 5), async (req, res) => {
    console.log('Review upload received:', { files: (req.files || []).map(f => ({ name: f.originalname, size: f.size, filename: f.filename })), bodyKeys: Object.keys(req.body || {}) });
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
        const results = [];
        for (const file of req.files) {
            const result = await processImage(file, req.body, req);
            results.push(result.url);
        }
        res.json({ message: 'Review images uploaded successfully', images: results });
    } catch (err) {
        console.error('Review image upload error:', err);
        res.status(500).json({ error: 'Failed to upload review images: ' + err.message });
    }
});

const THUMB_SIZE = { width: 480, height: 480 };

async function generateThumbnail(image) {
    return image
        .clone()
        .resize({ width: THUMB_SIZE.width, height: THUMB_SIZE.height, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
}

async function processImage(file, params, req) {
    const {
        resize_width,
        resize_height,
        quality = 80,
        format,
        custom_filename,
        generate_thumbnail = 'false',
    } = params;

    try {
        const imageBuffer = file.buffer || fs.readFileSync(file.path);
        let image = sharp(imageBuffer);
        const metadata = await image.metadata();

        const targetWidth = parseInt(resize_width) || 0;
        const targetHeight = parseInt(resize_height) || 0;
        const qualityNum = parseInt(quality) || 80;

        if (targetWidth > 0 || targetHeight > 0) {
            const resizeOptions = { fit: 'inside', withoutEnlargement: true };
            if (targetWidth > 0) resizeOptions.width = targetWidth;
            if (targetHeight > 0) resizeOptions.height = targetHeight;
            image = image.resize(resizeOptions);
        }

        const outputFormat = format || path.extname(file.originalname).replace('.', '') || 'jpeg';
        let outputBuffer;

        switch (outputFormat.toLowerCase()) {
            case 'png':
                outputBuffer = await image.png({ quality: qualityNum, compressionLevel: 9 }).toBuffer();
                break;
            case 'webp':
                outputBuffer = await image.webp({ quality: qualityNum }).toBuffer();
                break;
            case 'gif':
                outputBuffer = await image.gif({ quality: qualityNum }).toBuffer();
                break;
            case 'jpeg':
            case 'jpg':
            default:
                outputBuffer = await image.jpeg({ quality: qualityNum, mozjpeg: true, progressive: true }).toBuffer();
                break;
        }

        const originalBase = path.parse(file.originalname).name;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const nameBase = custom_filename ? path.parse(custom_filename).name : originalBase;
        const processedFilename = `${nameBase}_${uniqueSuffix}.${outputFormat}`;
        const processedPath = path.join(uploadDir, processedFilename);

        if (isLocalhost(req)) {
            fs.writeFileSync(processedPath, outputBuffer);
            try {
                if (file.path) fs.unlinkSync(file.path);
            } catch (unlinkErr) {
                console.warn('Failed to delete temp file:', unlinkErr.message);
            }
        } else {
            try {
                if (file.path) fs.unlinkSync(file.path);
            } catch (unlinkErr) {
                console.warn('Failed to delete temp file:', unlinkErr.message);
            }

            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: process.env.CLOUDINARY_FOLDER || 'lkpcendana',
                        resource_type: 'auto',
                        public_id: processedFilename.replace(/\.[^/.]+$/, ''),
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(outputBuffer);
            });

            const outputMetadata = await image.metadata();

            let thumbnailUrl = null;
            if (generate_thumbnail === 'true') {
                try {
                    const thumbBuffer = await generateThumbnail(image);
                    const thumbUploadResult = await new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: process.env.CLOUDINARY_FOLDER || 'lkpcendana',
                                resource_type: 'auto',
                                public_id: `${processedFilename.replace(/\.[^/.]+$/, '')}_thumb`,
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        stream.end(thumbBuffer);
                    });
                    thumbnailUrl = thumbUploadResult.secure_url;
                } catch (thumbErr) {
                    console.error('Thumbnail generation/upload error:', thumbErr);
                }
            }

            return {
                filename: processedFilename,
                originalname: file.originalname,
                url: uploadResult.secure_url,
                thumbnail_url: thumbnailUrl,
                width: outputMetadata.width,
                height: outputMetadata.height,
                format: outputFormat,
                size: uploadResult.bytes || outputBuffer.length,
            };
        }

        const outputMetadata = await image.metadata();
        const actualWidth = outputMetadata.width;
        const actualHeight = outputMetadata.height;

        let thumbnailUrl = null;
        if (generate_thumbnail === 'true') {
            try {
                const thumbBuffer = await generateThumbnail(image);
                const thumbName = `${nameBase}_thumb.${outputFormat}`;
                const thumbPath = path.join(uploadDir, thumbName);
                fs.writeFileSync(thumbPath, thumbBuffer);
                const protocol = (req.protocol === 'https' || req.secure) ? 'https' : 'http';
                const host = req.get('host');
                thumbnailUrl = `${protocol}://${host}/uploads/${encodeURIComponent(thumbName)}`;
            } catch (thumbErr) {
                console.error('Thumbnail generation error:', thumbErr);
            }
        }

        const protocol = (req.protocol === 'https' || req.secure) ? 'https' : 'http';
        const host = req.get('host');
        const encodedFilename = encodeURIComponent(processedFilename);
        const fileUrl = `${protocol}://${host}/uploads/${encodedFilename}`;

        return {
            filename: processedFilename,
            originalname: file.originalname,
            url: fileUrl,
            thumbnail_url: thumbnailUrl,
            width: actualWidth,
            height: actualHeight,
            format: outputFormat,
            size: outputBuffer.length,
        };
    } catch (err) {
        if (file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (unlinkErr) {
                console.warn('Failed to delete temp file during error cleanup:', unlinkErr.message);
            }
        }
        throw err;
    }
}

module.exports = router;

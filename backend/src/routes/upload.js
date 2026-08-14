const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { authMiddleware } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.SERVER_PORT || 5000}`;

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await processImage(req.file, req.body);
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

router.delete('/upload', authMiddleware, (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL gambar wajib diisi' });
    }

    try {
        const filename = path.basename(new URL(url).pathname);
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: 'Gambar berhasil dihapus', filename });
    } catch (err) {
        console.error('Delete image error:', err);
        res.status(500).json({ error: 'Gagal menghapus gambar: ' + err.message });
    }
});

router.post('/delete', authMiddleware, (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL gambar wajib diisi' });
    }

    try {
        let filename = path.basename(new URL(url).pathname);
        filename = decodeURIComponent(filename);
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            console.warn('Delete image: file not found', { url, filename, filePath });
            return res.status(404).json({ error: 'File tidak ditemukan', filename, filePath });
        }

        fs.unlinkSync(filePath);
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
            const result = await processImage(file, req.body);
            results.push(result);
        }
        res.json({ message: 'Files uploaded successfully', files: results });
    } catch (err) {
        console.error('Batch image processing error:', err);
        res.status(500).json({ error: 'Failed to process images: ' + err.message });
    }
});

async function processImage(file, params) {
    const {
        resize_width,
        resize_height,
        quality = 80,
        format,
        custom_filename,
    } = params;

    try {
        const imageBuffer = fs.readFileSync(file.path);
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

        fs.writeFileSync(processedPath, outputBuffer);
        try {
            fs.unlinkSync(file.path);
        } catch (unlinkErr) {
            console.warn('Failed to delete temp file:', unlinkErr.message);
        }

        const fileUrl = `uploads/${processedFilename}`;

        const outputMetadata = await image.metadata();
        const actualWidth = outputMetadata.width;
        const actualHeight = outputMetadata.height;

        return {
            filename: processedFilename,
            originalname: file.originalname,
            url: fileUrl,
            width: actualWidth,
            height: actualHeight,
            format: outputFormat,
            size: outputBuffer.length,
        };
    } catch (err) {
        if (fs.existsSync(file.path)) {
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

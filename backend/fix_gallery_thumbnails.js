const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2');

const uploadDir = path.join(__dirname, 'uploads');
const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.SERVER_PORT || 5000}`;

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_SCHEME || 'db_server',
});

async function generateThumbnail(imageUrl) {
    try {
        const urlPath = new URL(imageUrl).pathname;
        const filename = path.basename(urlPath);
        const sourcePath = path.join(uploadDir, filename);
        if (!fs.existsSync(sourcePath)) {
            console.log('  Source not found:', filename);
            return null;
        }
        const ext = path.extname(filename);
        const thumbName = `${path.parse(filename).name}_thumb${ext}`;
        const thumbPath = path.join(uploadDir, thumbName);

        await sharp(sourcePath)
            .resize({ width: 480, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toFile(thumbPath);

        return `${baseUrl}/uploads/${thumbName}`;
    } catch (err) {
        console.error('  Thumbnail generation error:', err.message);
        return null;
    }
}

async function main() {
    const [rows] = await db.promise().query('SELECT id, image_url, thumbnail_url FROM gallery_items');
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
        console.log(`Processing gallery id ${row.id}...`);

        let needsThumb = false;

        if (!row.thumbnail_url) {
            needsThumb = true;
            console.log('  Missing thumbnail_url');
        } else {
            try {
                const urlPath = new URL(row.thumbnail_url).pathname;
                const thumbFilename = path.basename(urlPath);
                const thumbPath = path.join(uploadDir, thumbFilename);
                if (!fs.existsSync(thumbPath)) {
                    needsThumb = true;
                    console.log('  Thumbnail file missing on disk:', thumbFilename);
                }
            } catch {
                needsThumb = true;
                console.log('  Invalid thumbnail_url');
            }
        }

        if (!needsThumb) {
            console.log('  Skipping, thumbnail OK');
            skipped++;
            continue;
        }

        const newThumb = await generateThumbnail(row.image_url);
        if (!newThumb) {
            console.log('  Failed to generate thumbnail');
            failed++;
            continue;
        }

        await db.promise().query('UPDATE gallery_items SET thumbnail_url = ? WHERE id = ?', [newThumb, row.id]);
        console.log('  Updated thumbnail_url:', newThumb);
        updated++;
    }

    console.log(`\nDone. updated=${updated}, skipped=${skipped}, failed=${failed}`);
    db.end();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

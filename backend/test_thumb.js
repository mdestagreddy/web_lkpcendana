const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');
const filename = 'Tampak Depan_1920x3048_q80.jpeg';
const sourcePath = path.join(uploadDir, filename);
const ext = path.extname(filename);
const thumbName = `${path.parse(filename).name}_thumb${ext}`;
const thumbPath = path.join(uploadDir, thumbName);

console.log('Source exists:', fs.existsSync(sourcePath));
console.log('Thumb path:', thumbPath);

sharp(sourcePath)
  .resize({ width: 480, fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 80, progressive: true })
  .toFile(thumbPath)
  .then(() => {
    console.log('Thumbnail created:', fs.existsSync(thumbPath));
    if (fs.existsSync(thumbPath)) {
      const stats = fs.statSync(thumbPath);
      console.log('Thumbnail size:', stats.size, 'bytes');
    }
  })
  .catch(err => console.error('Error:', err.message));

export function getCloudinaryThumbnail(url, options = {}) {
    const width = options.width || 480;
    const height = options.height || 480;
    const crop = options.crop || 'fill';
    const quality = options.quality || 'auto';
    const fetchFormat = options.fetchFormat || 'auto';

    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }

    const transform = `w_${width},h_${height},c_${crop},q_${quality},f_${fetchFormat}`;

    return url.replace(/\/image\/upload\//, `/image/upload/${transform}/`);
}

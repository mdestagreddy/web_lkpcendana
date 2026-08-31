const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';
import { getCloudinaryThumbnail } from '../utils/cloudinary';

function getLocalThumbnailUrl(src) {
    if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        return src;
    }
    const resolved = src.startsWith('/uploads/') ? src : `${API_BASE_URL}/uploads/${src}`;
    const urlObj = new URL(resolved, API_BASE_URL);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname);
    const base = pathname.slice(0, -ext.length);
    return `${urlObj.origin}${base}_thumb${ext}`;
}

export default function Image({
    src,
    alt = '',
    style,
    onLoad,
    className,
    thumbnailWidth,
    thumbnailHeight,
    ...rest
}) {
    if (!src) return null;

    const isAbsoluteUrl = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:');
    let imgSrc = src;
    if (!isAbsoluteUrl) {
        imgSrc = `${API_BASE_URL}/uploads/${src}`;
    }

    if (thumbnailWidth || thumbnailHeight) {
        if (imgSrc.includes('cloudinary.com')) {
            imgSrc = getCloudinaryThumbnail(imgSrc, {
                width: thumbnailWidth || 480,
                height: thumbnailHeight || 480,
            });
        } else {
            imgSrc = getLocalThumbnailUrl(imgSrc);
        }
    }

    return (
        <img
            src={imgSrc}
            alt={alt}
            style={style}
            onLoad={onLoad}
            className={className}
            {...rest}
        />
    );
}

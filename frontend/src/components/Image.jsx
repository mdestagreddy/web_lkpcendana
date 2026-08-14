const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

export default function Image({
    src,
    alt = '',
    style,
    onLoad,
    className,
    ...rest
}) {
    if (!src) return null;

    const isAbsoluteUrl = src.startsWith('http://') || src.startsWith('https://');

    let imgSrc = src;
    if (!isAbsoluteUrl) {
        imgSrc = `${API_BASE_URL}/uploads/${src}`;
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

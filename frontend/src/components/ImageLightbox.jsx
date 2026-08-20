import { useState, useCallback } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ZoomIn } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

function resolveImageUrl(src) {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
    return `${API_BASE_URL}/uploads/${src}`;
}

export default function ImageLightbox({ images }) {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const slides = images
        .map(resolveImageUrl)
        .filter(Boolean)
        .map(src => ({ src }));

    const handleClick = useCallback((idx) => {
        setIndex(idx);
        setOpen(true);
    }, []);

    if (slides.length === 0) return null;

    return (
        <>
            <div className="review-images lightbox-trigger">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className="lightbox-thumb"
                        onClick={() => handleClick(idx)}
                        title="Lihat gambar ukuran penuh"
                    >
                        <img src={resolveImageUrl(img)} alt={`Ulasan gambar ${idx + 1}`} loading="lazy" />
                        <span className="lightbox-overlay">
                            <ZoomIn size={20} />
                        </span>
                    </button>
                ))}
            </div>
            <Lightbox
                open={open}
                close={() => setOpen(false)}
                slides={slides}
                index={index}
            />
        </>
    );
}

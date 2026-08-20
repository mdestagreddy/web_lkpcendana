import { useState, useCallback, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/plugins/captions.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { ZoomIn } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

function resolveImageUrl(src) {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
    return `${API_BASE_URL}/uploads/${src}`;
}

export default function ImageLightbox({ items }) {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const slides = items
        .map(item => typeof item === 'string' ? { src: item } : item)
        .map(item => ({ src: resolveImageUrl(item.src), title: item.author, description: item.text }))
        .filter(slide => slide.src);

    const handleClick = useCallback((idx) => {
        setIndex(idx);
        setOpen(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [open]);

    if (slides.length === 0) return null;

    return (
        <>
            <div className="review-images lightbox-trigger">
                {slides.map((slide, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className="lightbox-thumb"
                        onClick={() => handleClick(idx)}
                        title="Lihat gambar ukuran penuh"
                    >
                        <img src={slide.src} alt={slide.title ? `Ulasan oleh ${slide.title}` : `Ulasan gambar ${idx + 1}`} loading="lazy" />
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
                plugins={[Captions, Zoom]}
                zoom={{ scrollToZoom: true, wheelZoomDistanceFactor: 80, maxZoom: 8, maxZoomPixelRatio: 8, pinchZoomV4: true }}
                noScroll={{ disabled: false }}
                carousel={{ padding: '72px' }}
                styles={{
                    container: {
                        '--yarl__color_backdrop': 'rgba(15, 23, 42, 0.55)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                    },
                    slide: {
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    captionsTitleContainer: {
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    },
                    captionsTitle: {
                        color: '#f1f5f9',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                    },
                    captionsDescriptionContainer: {
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    },
                    captionsDescription: {
                        color: '#e2e8f0',
                        fontSize: '0.85rem',
                    },
                }}
            />
        </>
    );
}

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { ZoomIn } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

function resolveImageUrl(src) {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
    return `${API_BASE_URL}/uploads/${src}`;
}

export default function ImageLightbox({ items, open: controlledOpen, onClose, index: controlledIndex, hidden }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [internalIndex, setInternalIndex] = useState(0);
    const [viewIndex, setViewIndex] = useState(0);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const index = controlledIndex !== undefined ? controlledIndex : internalIndex;

    const slides = useMemo(() => {
        return items
            .map(item => typeof item === 'string' ? { src: item } : item)
            .map(item => ({ src: resolveImageUrl(item.src), author: item.author, text: item.text }))
            .filter(slide => slide.src);
    }, [items]);

    const currentSlide = useMemo(() => {
        return open && slides[viewIndex] ? slides[viewIndex] : null;
    }, [open, viewIndex, slides]);

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
        } else {
            setInternalOpen(false);
        }
    }, [onClose]);

    const handleClick = useCallback((idx) => {
        if (controlledIndex === undefined) setInternalIndex(idx);
        setViewIndex(idx);
        if (controlledOpen === undefined) setInternalOpen(true);
    }, [controlledIndex, controlledOpen]);

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
            <div className={`review-images lightbox-trigger${hidden ? " hidden" : ""}`}>
                {slides.map((slide, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className="lightbox-thumb"
                        onClick={() => handleClick(idx)}
                        title="Lihat gambar ukuran penuh"
                    >
                        <img src={slide.src} alt={slide.author ? `Ulasan oleh ${slide.author}` : `Ulasan gambar ${idx + 1}`} loading="lazy" />
                        <span className="lightbox-overlay">
                            <ZoomIn size={20} />
                        </span>
                    </button>
                ))}
            </div>
            <Lightbox
                open={open}
                close={handleClose}
                slides={slides}
                index={index}
                plugins={[Zoom]}
                zoom={{ scrollToZoom: true, wheelZoomDistanceFactor: 80, maxZoom: 8, maxZoomPixelRatio: 8, pinchZoomV4: true }}
                animation={{ swipe: 250, navigation: 250, easing: { swipe: 'ease-out', navigation: 'ease-in-out', fade: 'ease' } }}
                carousel={{ padding: '72px' }}
                on={{ view: ({ index: idx }) => { setViewIndex(idx); } }}
                styles={{
                    container: {
                        '--yarl__color_backdrop': 'rgba(15, 23, 42, 0.55)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                    },
                    slide: {
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingBottom: '128px',
                    },
                }}
            />
            {open && currentSlide && typeof document !== 'undefined' && createPortal(
                <div className="lightbox-captions" aria-live="polite">
                    {currentSlide?.author && (
                        <div className="lightbox-caption-title">{currentSlide.author}</div>
                    )}
                    {currentSlide?.text && (
                        <div className="lightbox-caption-desc">{currentSlide.text}</div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}

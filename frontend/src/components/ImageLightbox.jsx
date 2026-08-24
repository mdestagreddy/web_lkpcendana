import { useState, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/plugins/captions.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { ZoomIn } from 'lucide-react';
import FlexIcon from './FlexIcon';
import './ImageLightbox.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

function resolveImageUrl(src) {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
    return `${API_BASE_URL}/uploads/${src}`;
}

const ImageLightboxComponent = ({ items, multiTrigger, open: controlledOpen, onClose, index: controlledIndex, hidden, rounded, className, thumbWidth, thumbHeight, onOpen }, ref) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const [internalIndex, setInternalIndex] = useState(0);
    const [internalItems, setInternalItems] = useState([]);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const index = controlledIndex !== undefined ? controlledIndex : internalIndex;
    const activeItems = multiTrigger ? internalItems : items;

    const wrapperClassName = [
        'lightbox-trigger',
        (rounded != null && rounded) || rounded == null ? 'rounded' : '',
        hidden ? 'hidden' : '',
        className || '',
    ]
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    const slides = useMemo(() => {
        return activeItems
            .map(item => typeof item === 'string' ? { src: item } : item)
            .map(item => ({ src: resolveImageUrl(item.src), title: item.author, description: item.text }))
            .filter(slide => slide.src);
    }, [activeItems]);

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
        } else {
            setInternalOpen(false);
        }
    }, [onClose]);

    const handleClick = useCallback((idx) => {
        if (controlledIndex === undefined) setInternalIndex(idx);
        if (controlledOpen === undefined) setInternalOpen(true);
    }, [controlledIndex, controlledOpen]);

    const openLightbox = useCallback((newItems, idx = 0) => {
        setInternalItems(newItems);
        setInternalIndex(idx);
        setInternalOpen(true);
        onOpen?.(newItems, idx);
    }, [onOpen]);

    useImperativeHandle(ref, () => ({ openLightbox }), [openLightbox]);

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

    const singleSlide = slides.length === 1;

    return (
        <>
            {!multiTrigger ? (
                <div className={wrapperClassName}>
                    {slides.map((slide, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="lightbox-thumb"
                            onClick={() => handleClick(idx)}
                            title="Lihat gambar ukuran penuh"
                            style={{
                                width: thumbWidth ?? '100px',
                                height: thumbHeight ?? '100px'
                            }}
                        >
                            <img src={slide.src} alt={slide.title ? `Ulasan oleh ${slide.title}` : `Ulasan gambar ${idx + 1}`} loading="lazy" />
                            <span className="lightbox-overlay">
                                <FlexIcon Icon={ZoomIn} size={20} />
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}
            <Lightbox
                open={open}
                close={handleClose}
                slides={slides}
                index={index}
                className={singleSlide ? 'yarl__single_slide' : ''}
                plugins={[Captions, Zoom]}
                zoom={{ scrollToZoom: true, wheelZoomDistanceFactor: 80, maxZoom: 8, maxZoomPixelRatio: 8, pinchZoomV4: true }}
                animation={{ swipe: singleSlide ? 0 : 250, navigation: singleSlide ? 0 : 250, easing: { swipe: 'ease-out', navigation: 'ease-in-out', fade: 'ease' } }}
                carousel={{ padding: '72px' }}
                controller={{ disableSwipeNavigation: singleSlide }}
                navigation={!singleSlide}
                styles={{
                    container: {
                        '--yarl__color_backdrop': 'rgba(15, 23, 42, 0.55)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                    },
                    slide: {
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    captionsContainer: {
                        position: 'fixed',
                        bottom: 24,
                        left: 0,
                        right: 0,
                        zIndex: 99999,
                    },
                    captionsTitleContainer: {
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                    },
                    captionsTitle: {
                        color: '#f1f5f9',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                    },
                    captionsDescriptionContainer: {
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                    },
                    captionsDescription: {
                        color: '#e2e8f0',
                        fontSize: '0.85rem',
                    },
                }}
            />
        </>
    );
};

export default forwardRef(ImageLightboxComponent);

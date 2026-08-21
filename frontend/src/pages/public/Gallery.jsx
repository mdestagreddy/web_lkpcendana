import { useState, useEffect, useMemo, useRef } from 'react';
import { publicApi } from '../../services/api';
import { LayoutGrid, Filter, ZoomIn } from 'lucide-react';
import ImageLightbox from '../../components/ImageLightbox';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Gallery.css';

export default function Gallery() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const lightboxRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        publicApi.getGallery(filter ? { category: filter } : {}).then(data => {
            setItems(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter]);

    const categories = [...new Set(items.map(item => item.kategori))];

    const lightboxItems = useMemo(() => items.map(item => ({ src: item.image_url, author: item.kategori || '', text: item.caption || '' })), [items]);

    return (
        <div className="gallery-page">
            <div className="container">
                <h1>Galeri</h1>
                <div className="filter-buttons">
                    <button
                        className={!filter ? 'active' : ''}
                        onClick={() => setFilter('')}
                    >
                        <LayoutGrid size={16} /> Semua
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={filter === cat ? 'active' : ''}
                            onClick={() => setFilter(cat)}
                        >
                            <Filter size={16} /> {cat.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="gallery-grid">
                        {items.map((item, idx) => (
                            <div key={item.id} className="gallery-item">
                                {item.image_url ? (
                                    <div className="gallery-item-image" onClick={() => lightboxRef.current?.openLightbox(lightboxItems, idx)}>
                                        <Image src={item.image_url} alt={item.alt_text || item.caption} loading="lazy" />
                                        <div className="gallery-item-overlay">
                                            <ZoomIn size={20} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="gallery-placeholder">Tidak ada gambar</div>
                                )}
                                <div className="caption">
                                    <p>{item.caption}</p>
                                    <span className="category-tag">{item.kategori}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ImageLightbox ref={lightboxRef} multiTrigger items={lightboxItems} />
        </div>
    );
}

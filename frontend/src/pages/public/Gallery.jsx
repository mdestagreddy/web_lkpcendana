import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { LayoutGrid, Filter } from 'lucide-react';
import './Gallery.css';

export default function Gallery() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [brokenImages, setBrokenImages] = useState({});

    useEffect(() => {
        setLoading(true);
        publicApi.getGallery(filter ? { category: filter } : {}).then(data => {
            setItems(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter]);

    const categories = [...new Set(items.map(item => item.kategori))];

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
                    <p className="loading">Memuat...</p>
                ) : (
                    <div className="gallery-grid">
                        {items.map(item => (
                            <div key={item.id} className="gallery-item">
                                {brokenImages[item.id] ? (
                                    <div className="gallery-placeholder">Tidak ada gambar</div>
                                ) : (
                                    <img
                                        src={item.thumbnail_url || item.image_url}
                                        alt={item.alt_text || item.caption}
                                        onError={() => {
                                            if (!brokenImages[item.id]) {
                                                setBrokenImages(prev => ({ ...prev, [item.id]: true }));
                                            }
                                        }}
                                    />
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
        </div>
    );
}

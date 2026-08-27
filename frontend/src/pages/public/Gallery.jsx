import { useState, useEffect, useMemo, useRef } from 'react';
import { publicApi } from '../../services/api';
import { LayoutGrid, Filter, ZoomIn } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import ImageLightbox from '../../components/ImageLightbox';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import './Gallery.css';

const PAGE_SIZE = 12;

export default function Gallery() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const lightboxRef = useRef(null);

    function load() {
        setLoading(true);
        publicApi.getGallery({ ...(filter ? { category: filter } : {}), limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
            if (result && typeof result === 'object' && 'data' in result) {
                setItems(result.data);
                setTotal(result.total);
            } else {
                setItems(result);
                setTotal(result?.length || 0);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    useEffect(() => { load(); }, [filter, page]);

    const categories = useMemo(() => [...new Set(items.map(item => item.kategori))], [items]);

    const lightboxItems = useMemo(() => items.map((item, _idx) => ({ src: item.image_url, author: item.kategori || '', text: item.caption || '' })), [items]);

    return (
        <div className="gallery-page">
            <div className="container">
                <h1>Galeri</h1>
                <div className="filter-buttons">
                    <button
                        className={!filter ? 'active' : ''}
                        onClick={() => setFilter('')}
                    >
                        <FlexIcon Icon={LayoutGrid} size={16}>Semua</FlexIcon>
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={filter === cat ? 'active' : ''}
                            onClick={() => setFilter(cat)}
                        >
                                <FlexIcon Icon={Filter} size={16}>{cat.replace(/_/g, ' ')}</FlexIcon>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <div className="gallery-grid">
                            {items.map((item, mapIdx) => (
                                <div key={item.id} className="gallery-item">
                                    {item.image_url ? (
                                        <div className="gallery-item-image" onClick={() => lightboxRef.current?.openLightbox(lightboxItems, mapIdx)}>
                                            <Image src={item.image_url} alt={item.alt_text || item.caption} loading="lazy" />
                                            <div className="gallery-item-overlay">
                                                <FlexIcon Icon={ZoomIn} size={20} />
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
                        <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </>
                )}
            </div>
            <ImageLightbox ref={lightboxRef} multiTrigger items={lightboxItems} />
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { Search, Tag, Signal, ArrowRight } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import './Programs.css';

const PAGE_SIZE = 9;

export default function Programs() {
    const [programs, setPrograms] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState({});
    const [loading, setLoading] = useState(true);

    function load() {
        setLoading(true);
        publicApi.getPrograms({ ...filter, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
            if (result && typeof result === 'object' && 'data' in result) {
                setPrograms(result.data);
                setTotal(result.total);
            } else {
                setPrograms(result);
                setTotal(result?.length || 0);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    useEffect(() => { load(); }, [filter, page]);

    return (
        <div className="programs-page">
            <div className="container">
                <h1>Program Kursus</h1>
                <div className="filters">
                    <select value={filter.type || ''} onChange={e => setFilter({ ...filter, type: e.target.value || undefined })}>
                        <option value="">Semua Tipe</option>
                        <option value="offline">Offline</option>
                        <option value="online">Online</option>
                    </select>
                    <select value={filter.level || ''} onChange={e => setFilter({ ...filter, level: e.target.value || undefined })}>
                        <option value="">Semua Level</option>
                        <option value="Pemula">Pemula</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Expert">Expert</option>
                    </select>
                    <div className="search-input-wrapper">
                        <FlexIcon Icon={Search} size={18} />
                        <input
                            type="text"
                            placeholder="Cari program..."
                            value={filter.category || ''}
                            onChange={e => setFilter({ ...filter, category: e.target.value || undefined })}
                        />
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <div className="programs-grid">
                            {programs.map(program => (
                                <div key={program.id} className="program-card">
                                    <div className="program-image-wrapper">
                                        {program.image_url ? (
                                            <Image src={program.image_url} alt={program.title} className="program-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div className="program-image-placeholder">Tidak ada gambar</div>
                                        )}
                                    </div>
                                    <span className="badges">
                                        <span className="badge"><FlexIcon Icon={Tag} size={14}>{program.category.toUpperCase()}</FlexIcon></span>
                                        <span className="level-badge"><FlexIcon Icon={Signal} size={14}>{program.level}</FlexIcon></span>
                                    </span>
                                    <h3>{program.title}</h3>
                                    <p>{program.description}</p>
                                    <div className="program-meta">
                                        <span>{program.type === 'online' ? 'Online' : 'Offline'}</span>
                                        {program.duration_minutes > 0 && (
                                            <span>{Math.floor(program.duration_minutes / 60)}j {program.duration_minutes % 60}m</span>
                                        )}
                                    </div>
                                    <Link to={`/programs/${program.id}`} className="btn btn-primary"><FlexIcon Icon={ArrowRight} size={18}>Lihat Detail</FlexIcon></Link>
                                </div>
                            ))}
                        </div>
                        <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </>
                )}
            </div>
        </div>
    );
}

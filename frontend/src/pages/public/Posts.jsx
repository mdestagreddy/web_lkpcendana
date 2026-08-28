import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import './Posts.css';

const PAGE_SIZE = 9;

export default function Posts() {
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [categories, setCategories] = useState([]);
    const [filter, setFilter] = useState({});
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            publicApi.getPosts({ ...filter, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
            publicApi.getCategories(),
        ]).then(([result, cats]) => {
            if (result && typeof result === 'object' && 'data' in result) {
                setPosts(result.data);
                setTotal(result.total);
            } else {
                setPosts(result);
                setTotal(result?.length || 0);
            }
            setCategories(cats);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter, page]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="posts-page">
            <div className="container">
                <h1>Artikel</h1>
                <div className="filters">
                    <select value={filter.category || ''} onChange={e => setFilter({ ...filter, category: e.target.value || undefined })}>
                        <option value="">Semua Kategori</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <div className="posts-list">
                            {posts.map(post => (
                                <article key={post.id} className="post-card">
                                    {post.featured_image && (
                                        <div className="post-image-wrapper">
                                            <Image src={post.featured_image} alt={post.title} className="post-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                        </div>
                                    )}
                                    <div className="post-body">
                                        <div className="post-meta">
                                            {post.category_name && (
                                                <span className="post-category"><FlexIcon Icon={Tag} size={14}>{post.category_name}</FlexIcon></span>
                                            )}
                                            {post.published_at && (
                                                <span className="post-date"><FlexIcon Icon={Calendar} size={14}>{new Date(post.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</FlexIcon></span>
                                            )}
                                        </div>
                                        <h2>{post.title}</h2>
                                        {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
                                        <Link to={`/posts/${post.id}`} className="btn btn-primary"><FlexIcon Icon={ArrowRight} size={16}>Baca Selengkapnya</FlexIcon></Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </>
                )}
            </div>
        </div>
    );
}

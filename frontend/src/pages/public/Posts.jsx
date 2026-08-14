import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import './Posts.css';

export default function Posts() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filter, setFilter] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            publicApi.getPosts(filter),
            publicApi.getCategories(),
        ]).then(([data, cats]) => {
            setPosts(data);
            setCategories(cats);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [filter]);

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
                    <p className="loading">Memuat...</p>
                ) : posts.length === 0 ? (
                    <p className="no-posts">Belum ada artikel yang dipublikasikan.</p>
                ) : (
                    <div className="posts-list">
                        {posts.map(post => (
                            <article key={post.id} className="post-card">
                                {post.featured_image && (
                                    <div className="post-image-wrapper">
                                        <img src={post.featured_image} alt={post.title} className="post-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                                    </div>
                                )}
                                <div className="post-body">
                                    <div className="post-meta">
                                        {post.category_name && (
                                            <span className="post-category"><Tag size={14} /> {post.category_name}</span>
                                        )}
                                        {post.published_at && (
                                            <span className="post-date"><Calendar size={14} /> {new Date(post.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        )}
                                    </div>
                                    <h2>{post.title}</h2>
                                    {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
                                    <Link to={`/posts/${post.id}`} className="btn btn-primary"><ArrowRight size={16} /> Baca Selengkapnya</Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import './PostDetail.css';

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        publicApi.getPost(id).then(data => {
            setPost(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;
    if (!post) return <div className="container"><p>Artikel tidak ditemukan.</p></div>;

    return (
        <div className="post-detail-page">
            <div className="container">
                <Link to="/posts" className="back-link"><ArrowLeft size={18} /> Kembali ke Artikel</Link>
                <article className="post-detail">
                    <header className="post-detail-header">
                        <div className="post-detail-meta">
                            {post.category_name && (
                                <span className="post-category"><Tag size={16} /> {post.category_name}</span>
                            )}
                            {post.published_at && (
                                <span className="post-date"><Calendar size={16} /> {new Date(post.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            )}
                        </div>
                        <h1>{post.title}</h1>
                    </header>
                    {post.featured_image && (
                        <div className="post-detail-image">
                            <img src={post.featured_image} alt={post.title} onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                    )}
                    <div className="post-detail-content" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                </article>
            </div>
        </div>
    );
}

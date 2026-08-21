import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { Calendar, Tag } from 'lucide-react';
import Image from '../../components/Image';
import ImageLightbox from '../../components/ImageLightbox';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackLink from '../../components/BackLink';
import './PostDetail.css';

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [articleImages, setArticleImages] = useState([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        setLoading(true);
        publicApi.getPost(id).then(data => {
            setPost(data);
            setLoading(false);
            if (data && data.content) {
                const imgs = extractImagesFromHtml(data.content);
                setArticleImages(imgs);
            }
        }).catch(() => setLoading(false));
    }, [id]);

    const extractImagesFromHtml = (html) => {
        if (!html || typeof html !== 'string') return [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const results = [];
        const imgTags = doc.querySelectorAll('img');
        imgTags.forEach(img => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('data:')) return;
            const figure = img.closest('figure');
            const caption = figure ? (figure.querySelector('figcaption')?.textContent?.trim() || '') : '';
            results.push({ src, caption });
        });
        return results;
    };

    const handleContentClick = (e) => {
        const target = e.target;
        if (target.tagName === 'IMG' && !target.closest('.post-detail-image')) {
            const src = target.getAttribute('src');
            if (!src || src.startsWith('data:')) return;
            const idx = articleImages.findIndex(item => item.src === src);
            if (idx >= 0) {
                setLightboxIndex(idx);
                setLightboxOpen(true);
            }
        }
    };

    const renderContent = () => {
        if (!post || !post.content) return null;
        let html = post.content;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const imgTags = doc.querySelectorAll('img');
        imgTags.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('data:')) {
                img.style.cursor = 'zoom-in';
                img.setAttribute('data-lightbox', 'true');
            }
        });
        return doc.body.innerHTML;
    };

    if (loading) return <div className="container"><LoadingSpinner /></div>;
    if (!post) return <div className="container"><p>Artikel tidak ditemukan.</p></div>;

    return (
        <div className="post-detail-page">
            <div className="container">
                <BackLink to="/posts" label="Kembali ke Artikel" />
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
                            <Image src={post.featured_image} alt={post.title} onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                    )}
                    <div className="post-detail-content" onClick={handleContentClick} dangerouslySetInnerHTML={{ __html: renderContent() || post.content || '' }} />
                </article>
                {articleImages.length > 0 && (
                    <ImageLightbox
                        hidden={true}
                        open={lightboxOpen}
                        index={lightboxIndex}
                        onClose={() => setLightboxOpen(false)}
                        items={articleImages.map(item => ({ src: item.src, author: post.title, text: item.caption || 'Artikel' }))}
                    />
                )}
            </div>
        </div>
    );
}

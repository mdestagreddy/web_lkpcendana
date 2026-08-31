import { useState, useEffect, useRef, useCallback } from 'react';
import { publicApi, API_BASE_URL } from '../../services/api';
import { Send, Camera, X } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import ImageLightbox from '../../components/ImageLightbox';
import LoadingSpinner from '../../components/LoadingSpinner';
import StarRating from '../../components/StarRating';
import Alert from '../../components/Alert';
import SecurityCaptcha from '../../components/SecurityCaptcha';
import Pagination from '../../components/Pagination';
import { compressImage } from '../../utils/imageCompress';
import './Reviews.css';

const PAGE_SIZE = 10;

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [captchaId, setCaptchaId] = useState(null);
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [previewImages, setPreviewImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hpConfirm, setHpConfirm] = useState('');
    const [hpToken, setHpToken] = useState(null);
    const hpTokenRef = useRef(null);
    const fileInputRef = useRef(null);
    const isiRef = useRef(null);

    const [form, setForm] = useState({ nama: '', rating: 5, isi: '', images: [] });

    const loadReviews = useCallback(() => {
        setLoading(true);
        publicApi.getReviews({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).then(result => {
            if (result && typeof result === 'object' && 'data' in result) {
                setReviews(result.data);
                setTotal(result.total);
            } else {
                setReviews(result);
                setTotal(result?.length || 0);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [page]);

    useEffect(() => { loadReviews(); }, [loadReviews]);

    const autoResize = useCallback(() => {
        const el = isiRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 400)}px`;
    }, []);

    useEffect(() => { autoResize(); }, [form.isi, autoResize]);

    useEffect(() => {
        if (!captchaId) loadCaptcha();
    }, [captchaId]);

    function loadCaptcha() {
        publicApi.getCaptcha().then(data => {
            setCaptchaId(data.captchaId);
            setCaptchaSvg(data.svg);
            setCaptchaInput('');
            setHpToken(data.hpToken || null);
        }).catch(() => {});
    }

    useEffect(() => {
        if (hpTokenRef.current) {
            hpTokenRef.current.value = JSON.stringify(hpToken || '');
        }
    }, [hpToken]);

    function handleFileChange(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setPreviewImages(prev => [...prev, ...files]);
    }

    function removeImage(index) {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    }

    async function uploadReviewImages() {
        if (previewImages.length === 0) return [];
        setUploadingImages(true);
        const uploaded = [];
        try {
            for (const file of previewImages) {
                const compressedFile = await compressImage(file, {
                    maxWidth: 1920,
                    maxHeight: 1920,
                    maxSizeBytes: 4.5 * 1024 * 1024,
                    mimeType: file.type,
                });

                const formData = new FormData();
                formData.append('images', compressedFile);
                const res = await fetch(`${API_BASE_URL}/api/upload/review`, {
                    method: 'POST',
                    body: formData,
                });
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`Upload failed ${res.status}: ${txt}`);
                }
                const data = await res.json();
                console.log('[Review] Upload response:', data);
                if (data.images && data.images.length > 0) {
                    uploaded.push(...data.images);
                } else if (data.url) {
                    uploaded.push(data.url);
                }
            }
        } catch (err) {
            console.error('[Review] Upload review images error:', err);
            setError(err.message || 'Gagal mengunggah gambar. Silakan coba lagi.');
            uploaded.length = 0;
        } finally {
            setUploadingImages(false);
        }
        console.log('[Review] Uploaded URLs:', uploaded);
        return uploaded;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!captchaInput || !captchaId) {
            setError('Silakan isi kode captcha');
            return;
        }

        setSubmitting(true);
        let uploadedImageUrls = [];
        try {
            if (previewImages.length > 0) {
                uploadedImageUrls = await uploadReviewImages();
                if (uploadedImageUrls.length === 0 && previewImages.length > 0) {
                    setError('Gagal mengunggah gambar. Silakan coba lagi.');
                    setSubmitting(false);
                    return;
                }
            }

            await publicApi.createReview({
                nama: form.nama,
                rating: parseInt(form.rating),
                isi: form.isi,
                images: uploadedImageUrls,
                captchaId,
                captchaText: captchaInput,
                hp_confirm: hpConfirm,
                hp_token: hpTokenRef.current ? hpTokenRef.current.value : hpToken,
            });
            console.log('[Review] Created with images:', uploadedImageUrls);

            setSuccess('Ulasan berhasil dikirim dan sedang menunggu persetujuan admin.');
            setForm({ nama: '', rating: 5, isi: '', images: [] });
            setPreviewImages([]);
            setCaptchaId(null);
            loadReviews();
        } catch (err) {
            setError(err.message || 'Gagal mengirim ulasan. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return (
        <div className="reviews-page">
            <div className="container">
                <h1>Ulasan</h1>
                <p className="page-subtitle">Bagikan pengalaman Anda di LKP Cendana</p>

                {success && <Alert type="success">{success}</Alert>}
                {error && <Alert type="error">{error}</Alert>}

                <div className="reviews-layout">
                    <div className="reviews-list-section">
                        <h2>Ulasan dari Peserta</h2>
                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <>
                                <div className="reviews-list">
                                    {reviews.map(review => {
                                        let imgs = [];
                                        if (review.images) {
                                            if (Array.isArray(review.images)) {
                                                imgs = review.images;
                                            } else if (typeof review.images === 'string') {
                                                try { imgs = JSON.parse(review.images); } catch { imgs = []; }
                                            }
                                        }
                                        return (
                                            <div key={review.id} className="review-card">
                                                <div className="review-card-header">
                                                    <div className="review-avatar">
                                                        {review.nama?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="review-meta">
                                                        <h4>{review.nama}</h4>
                                                        <div className="review-stars-small"><StarRating rating={review.rating} /></div>
                                                    </div>
                                                </div>
                                                <p className="review-text">{review.isi}</p>
                                                {imgs.length > 0 && (
                                                    <ImageLightbox style={{ marginBottom: '0.5rem' }} items={imgs.map(src => ({ src, author: review.nama, text: review.isi }))} />
                                                )}
                                                <span className="review-date">{formatDate(review.created_at)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
                            </>
                        )}
                    </div>

                    <div className="review-form-section">
                        <h2>Tulis Ulasan</h2>
                        <form onSubmit={handleSubmit} className="review-form">
                            <div className="form-group">
                                <label htmlFor="nama">Nama *</label>
                                <input
                                    id="nama"
                                    placeholder="Nama lengkap Anda"
                                    value={form.nama}
                                    onChange={e => setForm({ ...form, nama: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Rating *</label>
                                <div className="star-rating"><StarRating rating={form.rating} onChange={rating => setForm({ ...form, rating })} /></div>
                                <span className="rating-label">{form.rating} / 5</span>
                            </div>
                            <div className="form-group">
                                <label htmlFor="isi">Ulasan *</label>
                                <textarea
                                    ref={isiRef}
                                    id="isi"
                                    placeholder="Ceritakan pengalaman Anda..."
                                    value={form.isi}
                                    onChange={e => setForm({ ...form, isi: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Gambar (opsional, maks 5)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary upload-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImages || previewImages.length >= 5}
                                >
                                    <FlexIcon Icon={Camera} size={16}>{uploadingImages ? 'Mengunggah...' : `Tambah Gambar (${previewImages.length}/5)`}</FlexIcon>
                                </button>
                                {previewImages.length > 0 && (
                                    <div className="image-previews">
                                        {previewImages.map((file, idx) => (
                                            <div key={idx} className="image-preview">
                                                <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} />
                                                <button type="button" className="remove-img" onClick={() => removeImage(idx)}>
                                                    <FlexIcon Icon={X} size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <SecurityCaptcha
                                loadCaptcha={loadCaptcha}
                                captchaSvg={captchaSvg}
                                captchaInput={captchaInput}
                                onCaptchaChange={e => setCaptchaInput(e.target.value)}
                                inputId="captcha"
                                refreshLabel="Refresh"
                                refreshIcon={Send}
                                loading={submitting}
                            />
                            <input type="text" name="hp_confirm" value={hpConfirm} onChange={e => setHpConfirm(e.target.value)} style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }} tabIndex={-1} autoComplete="off" />
                            <input type="hidden" name="hp_token" ref={hpTokenRef} autoComplete="off" readOnly />
                            <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
                                    {submitting ? <LoadingSpinner text="Mengirim..." size="sm" className="inline" /> : <FlexIcon Icon={Send} size={16}>Kirim Ulasan</FlexIcon>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

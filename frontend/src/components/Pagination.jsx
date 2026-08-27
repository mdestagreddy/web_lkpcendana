import { useMemo } from 'react';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from 'lucide-react';
import './Pagination.css';

export default function Pagination({ total, page, pageSize, onPageChange }) {
    const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    const pageNumbers = useMemo(() => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) pages.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    }, [page, totalPages]);

    if (totalPages <= 1) return null;

    return (
        <div className="pagination-wrapper">
            {total > 0 && (
                <div className="pagination-info">
                    Menampilkan {start}–{end} dari {total} data
                </div>
            )}
            <div className="pagination-controls">
                <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => onPageChange(1)}
                    title="Pertama"
                >
                    <ChevronFirst size={16} />
                </button>
                <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    title="Sebelumnya"
                >
                    <ChevronLeft size={16} />
                </button>
                {pageNumbers.map((p, idx) =>
                    p === '...' ? (
                        <span key={`e-${idx}`} className="pagination-ellipsis">…</span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            className={`pagination-btn ${p === page ? 'active' : ''}`}
                            onClick={() => onPageChange(p)}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                    title="Berikutnya"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(totalPages)}
                    title="Terakhir"
                >
                    <ChevronLast size={16} />
                </button>
            </div>
        </div>
    );
}

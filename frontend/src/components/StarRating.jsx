import { Star } from 'lucide-react';
import FlexIcon from './FlexIcon';
import './StarRating.css';

function StarRating({ rating = 0, onChange, readonly = false, size = 18 }) {
    return (
        <div className="star-rating">
            {Array.from({ length: 5 }, (_, i) => (
                <button
                    key={i}
                    type="button"
                    className={`star-btn ${!readonly ? 'interactive' : ''} ${i < rating ? 'filled' : ''}`}
                    onClick={!readonly ? () => onChange?.(i + 1) : undefined}
                    disabled={readonly}
                    aria-label={`Bintang ${i + 1}`}
                >
                    <FlexIcon Icon={Star} size={size} fill={i < rating ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );
}

export default StarRating;

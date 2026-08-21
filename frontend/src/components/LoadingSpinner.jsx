import './LoadingSpinner.css';

function LoadingSpinner({ text = 'Memuat...', size = 'md', className = '', ...props }) {
    return (
        <div className={`loading-spinner ${size} ${className}`} {...props}>
            {text && <span className="loading-spinner-text">{text}</span>}
        </div>
    );
}

export default LoadingSpinner;

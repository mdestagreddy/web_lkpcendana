import './Alert.css';

function Alert({ type = 'error', children, onClose }) {
    return (
        <div className={`alert alert-${type}`} role="alert">
            {children}
            {onClose && (
                <button type="button" className="alert-close" onClick={onClose} aria-label="Tutup">
                    &times;
                </button>
            )}
        </div>
    );
}

export default Alert;

import './FormField.css';

function FormField({ id, label, type = 'text', value, onChange, placeholder, required, fullWidth, options, rows, className = '', children, icon, ...props }) {
    const baseInputClass = 'form-field-input';
    const inputClass = `${baseInputClass}${className ? ` ${className}` : ''}`;

    const handleChange = (e) => {
        onChange?.(e.target.value);
    };

    const inputElement = type === 'select' && options ? (
        <select id={id} value={value} onChange={handleChange} className={inputClass} required={required} {...props}>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ) : type === 'textarea' ? (
        <textarea id={id} value={value} onChange={handleChange} placeholder={placeholder} className={inputClass} rows={rows || 3} required={required} {...props} />
    ) : (
        <input id={id} type={type} value={value} onChange={handleChange} placeholder={placeholder} className={inputClass} required={required} {...props} />
    );

    return (
        <div className={`form-field ${fullWidth ? 'form-field--full' : ''}`}>
            {label && (
                <label htmlFor={id} className="form-field-label">
                    {icon && <span className="form-field-icon">{icon}</span>}
                    {label}
                </label>
            )}
            {inputElement}
            {children}
        </div>
    );
}

export default FormField;

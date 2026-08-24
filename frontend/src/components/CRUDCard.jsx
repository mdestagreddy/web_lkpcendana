import { Pencil, Trash2 } from 'lucide-react';
import FlexIcon from './FlexIcon';
import './CRUDCard.css';

function CRUDCard({ item, onEdit, onDelete, title, subtitle, description, meta, actions, className = '' }) {
    const cardClasses = `generic-card ${className}`.trim();

    return (
        <div className={cardClasses}>
            <div className="generic-card-header">
                <div className="generic-card-title">
                    {title}
                    {subtitle && <span className="generic-card-sub">{subtitle}</span>}
                </div>
                <div className="generic-card-actions">
                    {actions || (
                        <>
                            {onEdit && <button type="button" onClick={() => onEdit(item)} className="btn btn-small btn-primary"><FlexIcon Icon={Pencil} size={14}>Edit</FlexIcon></button>}
                            {onDelete && <button type="button" onClick={() => onDelete(item.id)} className="btn btn-small btn-danger"><FlexIcon Icon={Trash2} size={14}>Hapus</FlexIcon></button>}
                        </>
                    )}
                </div>
            </div>
            {description && <p className="generic-card-desc">{description}</p>}
            {meta && <div className="generic-card-meta">{meta}</div>}
        </div>
    );
}

export default CRUDCard;

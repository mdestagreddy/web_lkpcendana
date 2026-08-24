import { Check } from 'lucide-react';
import FlexIcon from './FlexIcon';
import './CustomCheckbox.css';

export default function CustomCheckbox({ id, checked, onChange, children, ...props }) {
    return (
        <label className="custom-checkbox-wrapper" htmlFor={id}>
            <span className="custom-checkbox">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={e => onChange?.(e.target.checked)}
                    {...props}
                />
                <span className="custom-checkbox-box" aria-hidden="true">
                    <FlexIcon Icon={Check} size={14} strokeWidth={3} />
                </span>
            </span>
            {children && <span className="custom-checkbox-label">{children}</span>}
        </label>
    );
}

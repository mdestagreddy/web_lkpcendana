import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackLink.css';

function BackLink({ to = '..', label = 'Kembali' }) {
    return (
        <Link to={to} className="back-link">
            <ArrowLeft size={18} />
            {label}
        </Link>
    );
}

export default BackLink;

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FlexIcon from './FlexIcon';
import './BackLink.css';

function BackLink({ to = '..', label = 'Kembali' }) {
    return (
        <Link to={to} className="back-link">
            <FlexIcon Icon={ArrowLeft} size={18}>{label}</FlexIcon>
        </Link>
    );
}

export default BackLink;

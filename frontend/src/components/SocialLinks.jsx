import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import FlexIcon from './FlexIcon';
import './SocialLinks.css';

const iconMap = {
    facebook: FaFacebook,
    instagram: FaInstagram,
    twitter: SiX,
    x: SiX,
    youtube: FaYoutube,
};

const labelMap = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'X',
    x: 'X',
    youtube: 'YouTube',
};

function SocialLinks({ links = [], size = 18, showLabel = false }) {
    const items = links
        .filter(link => link.url && link.url !== '#')
        .map(link => {
            const Icon = iconMap[link.platform?.toLowerCase()];
            if (!Icon) return null;
            return (
                <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={labelMap[link.platform?.toLowerCase()] || link.platform}>
                    <FlexIcon Icon={Icon} size={size}>
                        {showLabel && <span className="social-label">{labelMap[link.platform?.toLowerCase()] || link.platform}</span>}
                    </FlexIcon>
                </a>
            );
        })
        .filter(Boolean);

    if (items.length === 0) return null;

    return <div className="social-links">{items}</div>;
}

export default SocialLinks;

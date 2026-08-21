import { Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { useState, useEffect } from 'react';
import { Monitor, Wifi, ClipboardList, MapPin, Phone, Mail } from 'lucide-react';
import SocialLinks from './SocialLinks';
import './Footer.css';

export default function Footer() {
    const [settings, setSettings] = useState({});
    const [institution, setInstitution] = useState({});

    useEffect(() => {
        publicApi.getSiteSettings().then(setSettings);
        publicApi.getInstitution().then(data => {
            if (Array.isArray(data)) {
                const map = {};
                data.forEach(item => { map[item.key_name] = item.value; });
                setInstitution(map);
            } else if (data && typeof data === 'object') {
                setInstitution(data);
            }
        });
    }, []);

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h3>{institution.name || 'LKP Cendana'}</h3>
                    {institution.address && (
                        <p><MapPin size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom', flexShrink: 0 }} />{institution.address}</p>
                    )}
                    {(institution.phone || institution.email) && (
                        <p>
                            {institution.phone && <><Phone size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom', flexShrink: 0 }} />{institution.phone}</>}<br />
                            {institution.email && <><Mail size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom', flexShrink: 0 }} />{institution.email}</>}
                        </p>
                    )}
                </div>
                <div className="footer-section">
                    <h4>Program Unggulan</h4>
                    <ul>
                        <li><Link to="/programs?type=offline"><Monitor size={16} /> Offline Classes</Link></li>
                        <li><Link to="/programs?type=online"><Wifi size={16} /> Online Courses</Link></li>
                        <li><Link to="/registration"><ClipboardList size={16} /> Pendaftaran</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Ikuti Kami</h4>
                    <SocialLinks
                        links={[
                            { platform: 'facebook', url: settings.facebook_url },
                            { platform: 'instagram', url: settings.instagram_url },
                            { platform: 'twitter', url: settings.twitter_url },
                            { platform: 'youtube', url: settings.youtube_url },
                        ]}
                        showLabel
                    />
                </div>
            </div>
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} {institution.name || 'LKP Cendana'}. All rights reserved.</p>
            </div>
        </footer>
    );
}

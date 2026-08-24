import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { MapPin, Phone, Mail } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import SocialLinks from '../../components/SocialLinks';
import './Contact.css';

export default function Contact() {
    const [institution, setInstitution] = useState({});
    const [settings, setSettings] = useState({});

    useEffect(() => {
        Promise.all([
            publicApi.getInstitution(),
            publicApi.getSiteSettings(),
        ]).then(([inst, set]) => {
            setInstitution(inst || {});
            setSettings(set || {});
        });
    }, []);

    return (
        <div className="contact-page">
            <div className="container">
                <h1>Kontak Kami</h1>
                <div className="contact-grid">
                    <div className="contact-info">
                        <h2>Informasi Kontak</h2>
                        <p><FlexIcon Icon={MapPin} size={18}>{institution.address}</FlexIcon></p>
                        <p><FlexIcon Icon={Phone} size={18}>{institution.phone}</FlexIcon></p>
                        <p><FlexIcon Icon={Mail} size={18}>{institution.email}</FlexIcon></p>
                    </div>
                    <div className="social-info">
                        <h2>Media Sosial</h2>
                        <SocialLinks
                            links={[
                                { platform: 'facebook', url: settings.facebook_url },
                                { platform: 'instagram', url: settings.instagram_url },
                                { platform: 'twitter', url: settings.twitter_url },
                                { platform: 'youtube', url: settings.youtube_url },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

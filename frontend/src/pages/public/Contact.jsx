import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
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
                        <p><MapPin size={18} /> {institution.address}</p>
                        <p><Phone size={18} /> {institution.phone}</p>
                        <p><Mail size={18} /> {institution.email}</p>
                    </div>
                    <div className="social-info">
                        <h2>Media Sosial</h2>
                        {settings.facebook_url && (
                            <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer"><FaFacebook size={18} /> Facebook</a>
                        )}
                        {settings.instagram_url && (
                            <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer"><FaInstagram size={18} /> Instagram</a>
                        )}
                        {settings.twitter_url && (
                            <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer"><SiX size={18} /> X</a>
                        )}
                        {settings.youtube_url && (
                            <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer"><FaYoutube size={18} /> YouTube</a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

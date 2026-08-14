import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { User } from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import './Instructors.css';

export default function Instructors() {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        publicApi.getInstructors().then(data => {
            setInstructors(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="container"><p>Memuat...</p></div>;

    return (
        <div className="instructors-page">
            <div className="container">
                <h1>Instruktur Kami</h1>
                <div className="instructors-grid">
                    {instructors.map(instructor => (
                        <div key={instructor.id} className="instructor-card">
                            <div className="instructor-photo">
                                {instructor.foto ? (
                                    <img src={instructor.foto} alt={instructor.nama} />
                                ) : (
                                    <div className="placeholder"><User size={48} strokeWidth={1} /></div>
                                )}
                            </div>
                            <h3>{instructor.nama}</h3>
                            <p className="role">{instructor.role}</p>
                            <p className="bio">{instructor.bio}</p>
                            <div className="social-links">
                                {instructor.facebook_url && instructor.facebook_url !== '#' && (
                                    <a href={instructor.facebook_url} target="_blank" rel="noopener noreferrer"><FaFacebook size={18} /></a>
                                )}
                                {instructor.twitter_url && instructor.twitter_url !== '#' && (
                                    <a href={instructor.twitter_url} target="_blank" rel="noopener noreferrer"><SiX size={18} /></a>
                                )}
                                {instructor.instagram_url && instructor.instagram_url !== '#' && (
                                    <a href={instructor.instagram_url} target="_blank" rel="noopener noreferrer"><FaInstagram size={18} /></a>
                                )}
                                {instructor.youtube_url && instructor.youtube_url !== '#' && (
                                    <a href={instructor.youtube_url} target="_blank" rel="noopener noreferrer"><FaYoutube size={18} /></a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

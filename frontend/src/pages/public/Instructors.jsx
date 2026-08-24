import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { User } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import SocialLinks from '../../components/SocialLinks';
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

    if (loading) return <div className="container"><LoadingSpinner /></div>;

    return (
        <div className="instructors-page">
            <div className="container">
                <h1>Instruktur Kami</h1>
                <div className="instructors-grid">
                    {instructors.map(instructor => (
                        <div key={instructor.id} className="instructor-card">
                            <div className="instructor-photo">
                                {instructor.foto ? (
                                    <Image src={instructor.foto} alt={instructor.nama} />
                                ) : (
                                    <div className="placeholder">                                    <FlexIcon Icon={User} size={48} strokeWidth={1} /></div>
                                )}
                            </div>
                            <h3>{instructor.nama}</h3>
                            <p className="role">{instructor.role}</p>
                            <p className="bio">{instructor.bio}</p>
                            <SocialLinks
                                links={[
                                    { platform: 'facebook', url: instructor.facebook_url },
                                    { platform: 'twitter', url: instructor.twitter_url },
                                    { platform: 'instagram', url: instructor.instagram_url },
                                    { platform: 'youtube', url: instructor.youtube_url },
                                ]}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

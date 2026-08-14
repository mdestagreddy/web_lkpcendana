import { useState, useEffect } from 'react';
import { publicApi } from '../../services/api';
import { Building2, Eye, Flag, Users, Info, MapPin, Phone, Mail, Calendar, Award } from 'lucide-react';
import './About.css';

export default function About() {
    const [institution, setInstitution] = useState({});
    const [visionMission, setVisionMission] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            publicApi.getInstitution(),
            publicApi.getVisionMission(),
            publicApi.getInstructors(),
        ]).then(([inst, vm, instr]) => {
            setInstitution(inst);
            setVisionMission(vm);
            setInstructors(instr);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="container"><p className="loading">Memuat...</p></div>;

    const vision = visionMission.filter(vm => vm.type === 'vision');
    const missions = visionMission.filter(vm => vm.type === 'mission');

    return (
        <div className="about-page">
            <div className="container">
                <h1><Info size={28} /> Tentang Kami</h1>

                <section className="about-section">
                    <h2><Building2 size={22} /> Profil Lembaga</h2>
                    {institution.welcome_message && (
                        <p className="institution-desc welcome-message">
                            {institution.welcome_message}
                        </p>
                    )}
                    <p className="institution-desc">
                        {institution.name} adalah Lembaga Pelatihan Kerja di Samarinda yang telah beroperasi sejak tahun {institution.established_year}. 
                        Kami berkomitmen mencetak Sumber Daya Manusia yang berkualitas dengan tenaga pengajar berkompeten.
                    </p>
                    <div className="info-grid">
                        {institution.address && (
                            <div className="info-item">
                                <MapPin size={18} />
                                <div>
                                    <strong>Alamat</strong>
                                    <p>{institution.address}</p>
                                </div>
                            </div>
                        )}
                        {institution.phone && (
                            <div className="info-item">
                                <Phone size={18} />
                                <div>
                                    <strong>Telepon</strong>
                                    <p>{institution.phone}</p>
                                </div>
                            </div>
                        )}
                        {institution.email && (
                            <div className="info-item">
                                <Mail size={18} />
                                <div>
                                    <strong>Email</strong>
                                    <p>{institution.email}</p>
                                </div>
                            </div>
                        )}
                        {institution.established_year && (
                            <div className="info-item">
                                <Calendar size={18} />
                                <div>
                                    <strong>Tahun Berdiri</strong>
                                    <p>{institution.established_year}</p>
                                </div>
                            </div>
                        )}
                        {institution.accreditation && (
                            <div className="info-item">
                                <Award size={18} />
                                <div>
                                    <strong>Akreditasi</strong>
                                    <p>{institution.accreditation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {vision.length > 0 && (
                    <section className="about-section">
                        <h2><Eye size={22} /> Visi</h2>
                        <p>{vision[0].content}</p>
                    </section>
                )}

                {missions.length > 0 && (
                    <section className="about-section">
                        <h2><Flag size={22} /> Misi</h2>
                        <ol>
                            {missions.map((mission, _index) => (
                                <li key={mission.id}>{mission.content}</li>
                            ))}
                        </ol>
                    </section>
                )}

                {instructors.length > 0 && (
                    <section className="about-section">
                        <h2><Users size={22} /> Instruktur Kami</h2>
                        <div className="instructors-grid">
                            {instructors.map(instructor => (
                                <div key={instructor.id} className="instructor-card">
                                    <h3>{instructor.nama}</h3>
                                    <p className="role">{instructor.role}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

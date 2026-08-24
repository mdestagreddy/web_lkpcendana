import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { Layers, UserPlus } from 'lucide-react';
import FlexIcon from '../../components/FlexIcon';
import Image from '../../components/Image';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackLink from '../../components/BackLink';
import './ProgramDetail.css';

export default function ProgramDetail() {
    const { id } = useParams();
    const [program, setProgram] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            publicApi.getProgram(id),
            publicApi.getProgramModules(id),
        ]).then(([prog, mods]) => {
            setProgram(prog);
            setModules(mods);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="container"><LoadingSpinner /></div>;
    if (!program) return <div className="container"><p>Program tidak ditemukan</p></div>;

    return (
        <div className="program-detail">
            <div className="container">
                <BackLink to="/programs" label="Kembali ke Program" />
                <div className="program-header">
                    <div className="program-image-wrapper">
                        {program.image_url ? (
                            <Image src={program.image_url} alt={program.title} className="program-image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                            <div className="program-image-placeholder">Tidak ada gambar</div>
                        )}
                    </div>
                    <span className="badges">
                        <span className="badge">{program.category.toUpperCase()}</span>
                        <span className="level-badge">{program.level}</span>
                    </span>
                    <h1>{program.title}</h1>
                    <p className="description">{program.description}</p>
                    <div className="meta">
                        <span>Tipe Program: {program.type === 'online' ? 'Online' : 'Offline'}</span>
                        {program.duration_minutes > 0 && (
                            <span>Duration: {Math.floor(program.duration_minutes / 60)}j {program.duration_minutes % 60}m</span>
                        )}
                    </div>
                </div>

                {modules.length > 0 && (
                    <div className="modules-section">
                        <h2><FlexIcon Icon={Layers} size={24} /> Modul Program</h2>
                        <ul className="modules-list">
                            {modules.map((mod, index) => (
                                <li key={mod.id}>{index + 1}. {mod.name}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {program.type === 'offline' ? <Link to="/registration" className="btn btn-primary btn-large"><FlexIcon Icon={UserPlus} size={20}>Daftar Sekarang</FlexIcon></Link> : ""}
            </div>
        </div>
    );
}

INSERT IGNORE INTO users (nama, email, password, role) VALUES
('Administrator', 'admin@cendanatraining.com', '$2b$10$kxAqr3juXXu2y7FjNycI4OB7SVyAGAzpU2ahhNP4zJZLLXVwpiIDm', 'superadmin');

SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'token_version';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT DEFAULT 0')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

INSERT IGNORE INTO institution_info (key_name, value) VALUES
('name', 'LKP Cendana'),
('address', 'Jalan Cendana No. 07 Samarinda, Kalimantan Timur'),
('phone', '0813-4621-7133'),
('email', 'cendanatraining@gmail.com'),
('established_year', '2003'),
('accreditation', 'A from BAN-PNF'),
('welcome_message', 'Selamat Datang di LKP Cendana');

INSERT IGNORE INTO site_settings (key_name, value) VALUES
('facebook_url', 'https://facebook.com/lpk.cendana.5'),
('instagram_url', 'https://instagram.com/lkpcendana'),
('twitter_url', 'https://twitter.com/lkpcendana'),
('youtube_url', 'https://www.youtube.com/@cendanatraining9510'),
('header_image', ''),
('logo_image', ''),
('favicon', '');

INSERT IGNORE INTO vision_mission (type, content, sort_order) VALUES
('vision', 'Mewujudkan Lembaga yang Unggul, Berkualitas, Mandiri dengan lulusan yang mampu bersaing di dunia kerja', 1),
('mission', 'Meningkatkan Mutu Lembaga, Tenaga Pendidik dan Kependidikan', 1),
('mission', 'Menyelenggarakan Pendidikan yang dibutuhkan di Dunia Kerja', 2),
('mission', 'Meningkatkan wawasan kewirausahaan kepada Peserta Didik', 3),
('mission', 'Membangun Kerjasama dan Networking DUDI', 4),
('mission', 'Menjalin Kerjasama dengan Instansi terkait', 5);

INSERT IGNORE INTO programs (title, slug, category, level, duration_minutes, description, type, is_featured, sort_order) VALUES
('Driving Training Program', 'driving-training-program', 'mengemudi', 'Pemula', 0, 'Pelatihan mengemudi mobil yang sangat cocok untuk pemula. Disusun berdasarkan Standar Kompetensi Kurikulum Nasional dengan materi lengkap mulai dari Defensive Driving, Zero Accident, Good Driving, dan 8+ materi lainnya.', 'offline', 1, 1),
('Belajar Menggunakan Aplikasi Desain Grafis', 'belajar-aplikasi-desain-grafis', 'desain grafis', 'Pemula', 144, 'Pelatihan dasar penggunaan aplikasi desain grafis untuk pemula.', 'online', 0, 1),
('Membuat Desain Digital & Cetak Untuk Menjadi Perancang Grafis', 'desain-digital-cetak-perancang-grafis', 'desain grafis', 'Intermediate', 198, 'Pelatihan menengah untuk membuat desain digital dan cetak profesional.', 'online', 0, 2),
('Mudah Bikin Website Pakai WordPress', 'mudah-bikin-website-wordpress', 'web desain', 'Intermediate', 276, 'Pelatihan menengah pembuatan website menggunakan WordPress.', 'online', 0, 3),
('Menguasai Dasar Pemasaran Digital bagi Tenaga Spesialis Pemasaran', 'dasar-pemasaran-digital-spesialis', 'digital marketing', 'Pemula', 144, 'Pelatihan dasar pemasaran digital untuk tenaga spesialis pemasaran.', 'online', 0, 4),
('Belajar Digital Marketing untuk Wirausaha Online', 'digital-marketing-wirausaha-online', 'digital marketing', 'Intermediate', 198, 'Pelatihan menengah digital marketing untuk wirausaha online.', 'online', 0, 5),
('Teknik Membersihkan Data Untuk Para Data Analisis', 'teknik-membersihkan-data-analisis', 'data mining', 'Expert', 276, 'Pelatihan expert teknik membersihkan data untuk analisis data.', 'online', 0, 6),
('Office Application', 'office-application', 'office application', 'Pemula', 0, 'Pelatihan aplikasi perkantoran untuk pemula.', 'offline', 0, 7),
('Hidroponik', 'hidroponik', 'hidroponik', 'Pemula', 0, 'Pelatihan budidaya hidroponik untuk pemula.', 'offline', 0, 8);

INSERT IGNORE INTO program_modules (program_id, name, sort_order) VALUES
(1, 'Defensive Driving', 1),
(1, 'Zero Accident', 2),
(1, 'Good Driving', 3),
(1, 'Mengemudi Jalan Raya', 4),
(1, 'Mengemudi Jalan Tanjakan', 5),
(1, 'Mengemudi Jalan Menurun', 6),
(1, 'Mengemudi di Cuaca Buruk', 7),
(1, 'Mengemudi di Kota', 8),
(1, 'Mengemudi di Luar Kota', 9),
(1, 'Mengemudi di Malam Hari', 10),
(1, 'Mengemudi dengan Kondisi Darurat', 11),
(1, 'Mengemudi dengan Kendaraan Baru', 12);

INSERT IGNORE INTO instructors (nama, slug, role, bio, foto, facebook_url, twitter_url, youtube_url, sort_order) VALUES
('Agus Idianto', 'agus-idianto', 'Instruktur Mengemudi', 'Instruktur mengemudi profesional dengan pengalaman bertahun-tahun.', 'agus-idianto-ok.png', 'https://facebook.com/agusidianto', '#', '#', 1),
('Amelia Widya', 'amelia-widya', 'Instruktur Digital Marketing', 'Instruktur digital marketing dengan keahlian strategi pemasaran modern.', 'Amalia-ok2.png', 'https://facebook.com/ameliawidya', '#', '#', 2),
('Riduan', 'riduan', 'Instruktur Desain Grafis', 'Instruktur desain grafis dengan pengalaman kerja di industri kreatif.', 'mas-sopo.png', '#', '#', '#', 3),
('Yani Dwi Astuti', 'yani-dwi-astuti', 'Instruktur Aplikasi Perkantoran', 'Instruktur aplikasi perkantoran dengan keahlian Microsoft Office.', 'lala.png', '#', '#', '#', 4);

INSERT IGNORE INTO testimonials (nama, lokasi, isi, foto, is_featured, sort_order) VALUES
('Amanda', 'Samarinda', 'Selama saya kursus di LK Cendana saya mendapatkan ilmu yang sangat aplikatif dalam dunia kerja...', 'testimoni/amanda.jpg', 1, 1),
('Image FC', 'Samarinda', 'Belajar di LK Cendana sangat memudahkan saya dalam memahami pelajaran, sebab cara mengajarnya sangat mudah dipahami...', 'testimoni/image-fc.jpg', 1, 2),
('Nur Fitriani', 'Samarinda', 'Kurikulum yang diajarkan di LK Cendana sangat up to date dengan tempat kerja saya...', 'testimoni/nur-fitriani.jpg', 1, 3),
('Fajar', 'Samarinda seberang', 'Fasilitasnya lengkap dan tenaga pengajarnya juga telaten dan sabar...', 'testimoni/fajar.jpg', 1, 4);

INSERT IGNORE INTO gallery_items (kategori, caption, image_url, thumbnail_url, alt_text, sort_order) VALUES
('gedung_pelatihan', 'Tampak Depan', 'fasilitas/WhatsApp-Image-2021-11-03-at-10.58.08.jpeg', 'fasilitas/thumb-WhatsApp-Image-2021-11-03-at-10.58.08.jpeg', 'Tampak depan gedung pelatihan', 1),
('gedung_pelatihan', 'Front Office', 'fasilitas/front-office.jpeg', 'fasilitas/thumb-front-office.jpeg', 'Front office', 2),
('gedung_pelatihan', 'Ruang Admin', 'fasilitas/WhatsApp-Image-2021-11-03-at-10.58.05.jpeg', 'fasilitas/thumb-WhatsApp-Image-2021-11-03-at-10.58.05.jpeg', 'Ruang administrasi', 3),
('gedung_pelatihan', 'Ruang Tamu', 'fasilitas/WhatsApp-Image-2021-11-03-at-10.58.15.jpeg', 'fasilitas/thumb-WhatsApp-Image-2021-11-03-at-10.58.15.jpeg', 'Ruang tamu', 4),
('ruang_kelas', 'Ruang Kursus Office', 'fasilitas/ruang-kelas-3.jpeg', 'fasilitas/thumb-ruang-kelas-3.jpeg', 'Ruang kelas office', 1),
('ruang_kelas', 'Ruang Digital Marketing', 'fasilitas/ruang-kelas-2.jpeg', 'fasilitas/thumb-ruang-kelas-2.jpeg', 'Ruang kelas digital marketing', 2),
('ruang_kelas', 'Ruang Desain Grafis', 'fasilitas/ruang-kelas-1.jpeg', 'fasilitas/thumb-ruang-kelas-1.jpeg', 'Ruang kelas desain grafis', 3),
('ruang_kelas', 'Ruang Digital Marketing 2', 'fasilitas/WhatsApp-Image-2021-11-03-at-10.57.54-1.jpeg', 'fasilitas/thumb-WhatsApp-Image-2021-11-03-at-10.57.54-1.jpeg', 'Ruang digital marketing', 4),
('kegiatan_kelas', 'Kelas Desain Grafis 1', 'galeri/kelas-desain-grafis-1.jpg', 'galeri/thumb-kelas-desain-grafis-1.jpg', 'Kegiatan kelas desain grafis', 1),
('kegiatan_kelas', 'Kelas Desain Grafis 2', 'galeri/kelas-desain-grafis-2.jpg', 'galeri/thumb-kelas-desain-grafis-2.jpg', 'Kegiatan kelas desain grafis', 2),
('kegiatan_kelas', 'Kelas Kewirausahaan 1', 'galeri/kelas-kewirausahaan-1.jpg', 'galeri/thumb-kelas-kewirausahaan-1.jpg', 'Kegiatan kelas kewirausahaan', 3),
('kegiatan_kelas', 'Kelas Kewirausahaan 2', 'galeri/kelas-kewirausahaan-2.jpg', 'galeri/thumb-kelas-kewirausahaan-2.jpg', 'Kegiatan kelas kewirausahaan', 4),
('kegiatan_kelas', 'Kelas Kewirausahaan 3', 'galeri/kelas-kewirausahaan-3.jpg', 'galeri/thumb-kelas-kewirausahaan-3.jpg', 'Kegiatan kelas kewirausahaan', 5),
('kegiatan_kelas', 'Kelas Kewirausahaan 4', 'galeri/kelas-kewirausahaan-4.jpg', 'galeri/thumb-kelas-kewirausahaan-4.jpg', 'Kegiatan kelas kewirausahaan', 6),
('kegiatan_kelas', 'Kelas Teknisi Komputer 1', 'galeri/kelas-teknisi-komputer-1.jpg', 'galeri/thumb-kelas-teknisi-komputer-1.jpg', 'Kegiatan kelas teknisi komputer', 7),
('kegiatan_kelas', 'Kelas Teknisi Komputer 2', 'galeri/kelas-teknisi-komputer-2.jpg', 'galeri/thumb-kelas-teknisi-komputer-2.jpg', 'Kegiatan kelas teknisi komputer', 8),
('kegiatan_kelas', 'Kelas Mengemudi 1', 'galeri/kelas-mengemudi-1.jpg', 'galeri/thumb-kelas-mengemudi-1.jpg', 'Kegiatan kelas mengemudi', 9),
('kegiatan_kelas', 'Kelas Mengemudi 2', 'galeri/kelas-mengemudi-2.jpg', 'galeri/thumb-kelas-mengemudi-2.jpg', 'Kegiatan kelas mengemudi', 10),
('kegiatan_kelas', 'Kelas Mengemudi 3', 'galeri/kelas-mengemudi-3.jpg', 'galeri/thumb-kelas-mengemudi-3.jpg', 'Kegiatan kelas mengemudi', 11),
('kegiatan_kelas', 'Kelas Mengemudi 4', 'galeri/kelas-mengemudi-4.jpg', 'galeri/thumb-kelas-mengemudi-4.jpg', 'Kegiatan kelas mengemudi', 12);

INSERT IGNORE INTO categories (name, slug, description) VALUES
('Food', 'food', 'Kategori makanan'),
('Life Style', 'life-style', 'Kategori gaya hidup'),
('Nature', 'nature', 'Kategori alam'),
('News', 'news', 'Kategori berita'),
('Sports', 'sports', 'Kategori olahraga'),
('Technology', 'technology', 'Kategori teknologi'),
('Testimonials', 'testimonials', 'Kategori testimoni'),
('Travel', 'travel', 'Kategori perjalanan');

INSERT IGNORE INTO privacy_policies (content, version, effective_date, is_current) VALUES
('Kebijakan Privasi Cendana Training Center. Terakhir diperbarui: 27 Januari 2024.', '1.0', '2024-01-27', 1);

INSERT IGNORE INTO reviews (nama, email, rating, isi, images, is_active) VALUES
('Andi Prasetyo', 'andi@example.com', 5, 'Pelatihan yang sangat bermanfaat! Instruktur sangat kompeten dan materi sesuai kebutuhan dunia kerja.', NULL, 1),
('Siti Nurhaliza', 'siti@example.com', 4, 'Fasilitas lengkap dan nyaman. Materi pelatihan mudah dipahami.', NULL, 1),
('Budi Santoso', 'budi@example.com', 5, 'Sangat membantu meningkatkan kemampuan saya. Recommended!', NULL, 1);

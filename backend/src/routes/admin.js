const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

function normalizePublishedAt(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed + ' 00:00:00';
    }
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
        return trimmed;
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

router.use(authMiddleware);

async function generateThumbnail(imageUrl) {
    try {
        const urlPath = new URL(imageUrl).pathname;
        const filename = path.basename(urlPath);
        const sourcePath = path.join(__dirname, '../../uploads', filename);
        if (!fs.existsSync(sourcePath)) return null;
        const ext = path.extname(filename);
        const thumbName = `${path.parse(filename).name}_thumb${ext}`;
        const thumbPath = path.join(__dirname, '../../uploads', thumbName);
        await sharp(sourcePath)
            .resize({ width: 480, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toFile(thumbPath);
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.SERVER_PORT || 5000}`;
        return `${baseUrl}/uploads/${thumbName}`;
    } catch (err) {
        console.error('Thumbnail generation error:', err);
        return null;
    }
}

router.get('/programs', (req, res) => {
    db.query('SELECT * FROM programs ORDER BY sort_order ASC, created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/programs', (req, res) => {
    const { title, slug, category, level, duration_minutes, description, type, is_featured, is_active, sort_order, image_url } = req.body;
    if (!title || !slug) return res.status(400).json({ error: 'title and slug are required' });
    db.query(
        'INSERT INTO programs (title, slug, category, level, duration_minutes, description, type, is_featured, is_active, sort_order, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, category || null, level || 'Pemula', duration_minutes || 0, description || null, type || 'offline', is_featured ? 1 : 0, is_active !== false ? 1 : 0, sort_order || 0, image_url || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: result.insertId, message: 'Program created successfully' });
        }
    );
});

router.put('/programs/:id', (req, res) => {
    const { title, slug, category, level, duration_minutes, description, type, is_featured, is_active, sort_order, image_url } = req.body;
    db.query(
        'UPDATE programs SET title = ?, slug = ?, category = ?, level = ?, duration_minutes = ?, description = ?, type = ?, is_featured = ?, is_active = ?, sort_order = ?, image_url = ? WHERE id = ?',
        [title, slug, category || null, level || 'Pemula', duration_minutes || 0, description || null, type || 'offline', is_featured ? 1 : 0, is_active !== false ? 1 : 0, sort_order || 0, image_url || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Program updated successfully' });
        }
    );
});

router.delete('/programs/:id', (req, res) => {
    db.query('DELETE FROM programs WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Program deleted successfully' });
    });
});

router.get('/programs/:id/modules', (req, res) => {
    db.query('SELECT * FROM program_modules WHERE program_id = ? ORDER BY sort_order ASC', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/programs/:id/modules', (req, res) => {
    const { name, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    db.query('INSERT INTO program_modules (program_id, name, sort_order) VALUES (?, ?, ?)', [req.params.id, name, sort_order || 0], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, message: 'Module added successfully' });
    });
});

router.put('/programs/:programId/modules/:moduleId', (req, res) => {
    const { name, sort_order } = req.body;
    db.query('UPDATE program_modules SET name = ?, sort_order = ? WHERE id = ? AND program_id = ?', [name, sort_order || 0, req.params.moduleId, req.params.programId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Module updated successfully' });
    });
});

router.delete('/programs/:programId/modules/:moduleId', (req, res) => {
    db.query('DELETE FROM program_modules WHERE id = ? AND program_id = ?', [req.params.moduleId, req.params.programId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Module deleted successfully' });
    });
});

router.get('/instructors', (req, res) => {
    db.query('SELECT * FROM instructors ORDER BY sort_order ASC, created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/instructors', (req, res) => {
    const { nama, slug, role, bio, foto, facebook_url, twitter_url, instagram_url, youtube_url, sort_order, is_active } = req.body;
    if (!nama || !slug) return res.status(400).json({ error: 'nama and slug are required' });
    db.query(
        'INSERT INTO instructors (nama, slug, role, bio, foto, facebook_url, twitter_url, instagram_url, youtube_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nama, slug, role || null, bio || null, foto || null, facebook_url || null, twitter_url || null, instagram_url || null, youtube_url || null, sort_order || 0, is_active !== false ? 1 : 0],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: result.insertId, message: 'Instructor created successfully' });
        }
    );
});

router.put('/instructors/:id', (req, res) => {
    const { nama, slug, role, bio, foto, facebook_url, twitter_url, instagram_url, youtube_url, sort_order, is_active } = req.body;
    db.query(
        'UPDATE instructors SET nama = ?, slug = ?, role = ?, bio = ?, foto = ?, facebook_url = ?, twitter_url = ?, instagram_url = ?, youtube_url = ?, sort_order = ?, is_active = ? WHERE id = ?',
        [nama, slug, role || null, bio || null, foto || null, facebook_url || null, twitter_url || null, instagram_url || null, youtube_url || null, sort_order || 0, is_active !== false ? 1 : 0, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Instructor updated successfully' });
        }
    );
});

router.delete('/instructors/:id', (req, res) => {
    db.query('DELETE FROM instructors WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Instructor deleted successfully' });
    });
});

router.get('/testimonials', (req, res) => {
    db.query('SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/testimonials', (req, res) => {
    const { nama, lokasi, isi, foto, is_featured, sort_order, is_active } = req.body;
    if (!nama || !isi) return res.status(400).json({ error: 'nama and isi are required' });
    db.query(
        'INSERT INTO testimonials (nama, lokasi, isi, foto, is_featured, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nama, lokasi || null, isi, foto || null, is_featured ? 1 : 0, sort_order || 0, is_active !== false ? 1 : 0],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: result.insertId, message: 'Testimonial created successfully' });
        }
    );
});

router.put('/testimonials/:id', (req, res) => {
    const { nama, lokasi, isi, foto, is_featured, sort_order, is_active } = req.body;
    db.query(
        'UPDATE testimonials SET nama = ?, lokasi = ?, isi = ?, foto = ?, is_featured = ?, sort_order = ?, is_active = ? WHERE id = ?',
        [nama, lokasi || null, isi, foto || null, is_featured ? 1 : 0, sort_order || 0, is_active !== false ? 1 : 0, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Testimonial updated successfully' });
        }
    );
});

router.delete('/testimonials/:id', (req, res) => {
    db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Testimonial deleted successfully' });
    });
});

router.get('/gallery', (req, res) => {
    db.query('SELECT * FROM gallery_items ORDER BY kategori ASC, sort_order ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/gallery', async (req, res) => {
    const { kategori, caption, image_url, thumbnail_url, alt_text, sort_order, is_active } = req.body;
    if (!kategori || !image_url) return res.status(400).json({ error: 'kategori and image_url are required' });
    let finalThumbnail = thumbnail_url;
    if (!finalThumbnail) {
        finalThumbnail = await generateThumbnail(image_url);
    } else if (finalThumbnail) {
        try {
            const urlPath = new URL(finalThumbnail).pathname;
            const filename = path.basename(urlPath);
            const thumbPath = path.join(__dirname, '../../uploads', filename);
            if (!fs.existsSync(thumbPath)) {
                finalThumbnail = await generateThumbnail(image_url);
            }
        } catch {
            finalThumbnail = await generateThumbnail(image_url);
        }
    }
    db.query(
        'INSERT INTO gallery_items (kategori, caption, image_url, thumbnail_url, alt_text, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [kategori, caption || null, image_url, finalThumbnail || null, alt_text || null, sort_order || 0, is_active !== false ? 1 : 0],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: result.insertId, message: 'Gallery item created successfully' });
        }
    );
});

router.put('/gallery/:id', async (req, res) => {
    const { kategori, caption, image_url, thumbnail_url, alt_text, sort_order, is_active } = req.body;
    let finalThumbnail = thumbnail_url;
    if (!finalThumbnail) {
        finalThumbnail = await generateThumbnail(image_url);
    } else if (finalThumbnail) {
        try {
            const urlPath = new URL(finalThumbnail).pathname;
            const filename = path.basename(urlPath);
            const thumbPath = path.join(__dirname, '../../uploads', filename);
            if (!fs.existsSync(thumbPath)) {
                finalThumbnail = await generateThumbnail(image_url);
            }
        } catch {
            finalThumbnail = await generateThumbnail(image_url);
        }
    }
    db.query(
        'UPDATE gallery_items SET kategori = ?, caption = ?, image_url = ?, thumbnail_url = ?, alt_text = ?, sort_order = ?, is_active = ? WHERE id = ?',
        [kategori, caption || null, image_url, finalThumbnail || null, alt_text || null, sort_order || 0, is_active !== false ? 1 : 0, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Gallery item updated successfully' });
        }
    );
});

router.delete('/gallery/:id', (req, res) => {
    db.query('DELETE FROM gallery_items WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Gallery item deleted successfully' });
    });
});

router.get('/users', (req, res) => {
    db.query('SELECT id, nama, email, role, avatar, created_at, updated_at FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/users', async (req, res) => {
    const { nama, email, password, role, avatar } = req.body;
    if (!nama || !email || !password) return res.status(400).json({ error: 'nama, email, and password are required' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (nama, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)',
            [nama, email, hashedPassword, role || 'admin', avatar || null],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: result.insertId, message: 'User created successfully' });
            }
        );
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.put('/users/:id', async (req, res) => {
    const { nama, email, password, role, avatar } = req.body;
    if (!nama || !email) return res.status(400).json({ error: 'nama and email are required' });
    try {
        let query = 'UPDATE users SET nama = ?, email = ?, role = ?, avatar = ? WHERE id = ?';
        const params = [nama, email, role || 'admin', avatar || null, req.params.id];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET nama = ?, email = ?, password = ?, role = ?, avatar = ? WHERE id = ?';
            params.splice(2, 0, hashedPassword);
        }

        db.query(query, params, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'User updated successfully' });
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted successfully' });
    });
});

router.get('/institution-info', (req, res) => {
    db.query('SELECT * FROM institution_info', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.put('/institution-info/:key', (req, res) => {
    const { value } = req.body;
    db.query('UPDATE institution_info SET value = ? WHERE key_name = ?', [value, req.params.key], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Institution info updated successfully' });
    });
});

router.get('/vision-mission', (req, res) => {
    db.query('SELECT * FROM vision_mission ORDER BY type ASC, sort_order ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/vision-mission', (req, res) => {
    const { type, content, sort_order } = req.body;
    if (!type || !content) return res.status(400).json({ error: 'type and content are required' });
    db.query('INSERT INTO vision_mission (type, content, sort_order) VALUES (?, ?, ?)', [type, content, sort_order || 0], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, message: 'Vision/Mission created successfully' });
    });
});

router.put('/vision-mission/:id', (req, res) => {
    const { type, content, sort_order } = req.body;
    db.query('UPDATE vision_mission SET type = ?, content = ?, sort_order = ? WHERE id = ?', [type, content, sort_order || 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Vision/Mission updated successfully' });
    });
});

router.delete('/vision-mission/:id', (req, res) => {
    db.query('DELETE FROM vision_mission WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Vision/Mission deleted successfully' });
    });
});

router.get('/site-settings', (req, res) => {
    db.query('SELECT * FROM site_settings', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.put('/site-settings/:key', (req, res) => {
    const { value } = req.body;
    db.query('UPDATE site_settings SET value = ? WHERE key_name = ?', [value, req.params.key], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Site setting updated successfully' });
    });
});

router.get('/posts', (req, res) => {
    db.query('SELECT p.*, c.name as category_name, c.slug as category_slug FROM posts p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/posts', (req, res) => {
    const { title, slug, content, excerpt, featured_image, category_id, author_id, status, published_at } = req.body;
    if (!title || !slug) return res.status(400).json({ error: 'title and slug are required' });
    if (published_at && String(published_at).trim()) {
        const testDate = new Date(published_at);
        if (isNaN(testDate.getTime())) {
            return res.status(400).json({ error: 'Format tanggal publikasi tidak valid. Gunakan YYYY-MM-DD atau format ISO 8601' });
        }
    }
    const normalizedPublishedAt = normalizePublishedAt(published_at);
    db.query('SELECT id FROM posts WHERE slug = ?', [slug], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.status(409).json({ error: 'Slug sudah digunakan, silakan gunakan slug lain' });
        }
        db.query(
            'INSERT INTO posts (title, slug, content, excerpt, featured_image, category_id, author_id, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, slug, content || null, excerpt || null, featured_image || null, category_id || null, author_id || null, status || 'draft', normalizedPublishedAt],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: result.insertId, message: 'Post created successfully' });
            }
        );
    });
});

router.put('/posts/:id', (req, res) => {
    const { title, slug, content, excerpt, featured_image, category_id, author_id, status, published_at } = req.body;
    if (!title || !slug) return res.status(400).json({ error: 'title and slug are required' });
    if (published_at && String(published_at).trim()) {
        const testDate = new Date(published_at);
        if (isNaN(testDate.getTime())) {
            return res.status(400).json({ error: 'Format tanggal publikasi tidak valid. Gunakan YYYY-MM-DD atau format ISO 8601' });
        }
    }
    const normalizedPublishedAt = normalizePublishedAt(published_at);
    db.query('SELECT id FROM posts WHERE slug = ? AND id != ?', [slug, req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.status(409).json({ error: 'Slug sudah digunakan, silakan gunakan slug lain' });
        }
        db.query(
            'UPDATE posts SET title = ?, slug = ?, content = ?, excerpt = ?, featured_image = ?, category_id = ?, author_id = ?, status = ?, published_at = ? WHERE id = ?',
            [title, slug, content || null, excerpt || null, featured_image || null, category_id || null, author_id || null, status || 'draft', normalizedPublishedAt, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Post updated successfully' });
            }
        );
    });
});

router.delete('/posts/:id', (req, res) => {
    db.query('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Post deleted successfully' });
    });
});

router.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/categories', (req, res) => {
    const { name, slug, description } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
    db.query('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, message: 'Category created successfully' });
    });
});

router.put('/categories/:id', (req, res) => {
    const { name, slug, description } = req.body;
    db.query('UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?', [name, slug, description || null, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category updated successfully' });
    });
});

router.delete('/categories/:id', (req, res) => {
    db.query('DELETE FROM categories WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category deleted successfully' });
    });
});

router.get('/org-chart', (req, res) => {
    db.query('SELECT * FROM org_chart_nodes ORDER BY sort_order ASC, created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/org-chart', (req, res) => {
    const { nama, role, parent_id, foto, sort_order } = req.body;
    if (!nama) return res.status(400).json({ error: 'nama is required' });
    db.query('INSERT INTO org_chart_nodes (nama, role, parent_id, foto, sort_order) VALUES (?, ?, ?, ?, ?)', [nama, role || null, parent_id || null, foto || null, sort_order || 0], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, message: 'Org chart node created successfully' });
    });
});

router.put('/org-chart/:id', (req, res) => {
    const { nama, role, parent_id, foto, sort_order } = req.body;
    db.query('UPDATE org_chart_nodes SET nama = ?, role = ?, parent_id = ?, foto = ?, sort_order = ? WHERE id = ?', [nama, role || null, parent_id || null, foto || null, sort_order || 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Org chart node updated successfully' });
    });
});

router.delete('/org-chart/:id', (req, res) => {
    db.query('DELETE FROM org_chart_nodes WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Org chart node deleted successfully' });
    });
});

router.get('/privacy-policies', (req, res) => {
    db.query('SELECT * FROM privacy_policies ORDER BY effective_date DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/privacy-policies', (req, res) => {
    const { content, version, effective_date, is_current } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    db.query(
        'INSERT INTO privacy_policies (content, version, effective_date, is_current) VALUES (?, ?, ?, ?)',
        [content, version || null, effective_date || null, is_current ? 1 : 0],
        (err, result) => {
            if (err) {
                console.error('Error creating privacy policy:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: result.insertId, message: 'Privacy policy created successfully' });
        }
    );
});

router.put('/privacy-policies/:id', (req, res) => {
    const { content, version, effective_date, is_current } = req.body;
    db.query(
        'UPDATE privacy_policies SET content = ?, version = ?, effective_date = ?, is_current = ? WHERE id = ?',
        [content, version || null, effective_date || null, is_current ? 1 : 0, req.params.id],
        (err) => {
            if (err) {
                console.error('Error updating privacy policy:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Privacy policy updated successfully' });
        }
    );
});

router.delete('/privacy-policies/:id', (req, res) => {
    db.query('DELETE FROM privacy_policies WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Privacy policy deleted successfully' });
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/programs', (req, res) => {
    const { type, level, category, featured } = req.query;
    let query = 'SELECT * FROM programs WHERE is_active = 1';
    const params = [];

    if (type) { query += ' AND type = ?'; params.push(type); }
    if (level) { query += ' AND level = ?'; params.push(level); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (featured === 'true') { query += ' AND is_featured = 1'; }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/programs/featured', (req, res) => {
    db.query('SELECT * FROM programs WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/programs/:id', (req, res) => {
    db.query('SELECT * FROM programs WHERE id = ? AND is_active = 1', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Program not found' });
        res.json(results[0]);
    });
});

router.get('/programs/:id/modules', (req, res) => {
    db.query('SELECT * FROM program_modules WHERE program_id = ? ORDER BY sort_order ASC', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/instructors', (req, res) => {
    db.query('SELECT * FROM instructors WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/instructors/:id', (req, res) => {
    db.query('SELECT * FROM instructors WHERE id = ? AND is_active = 1', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Instructor not found' });
        res.json(results[0]);
    });
});

router.get('/testimonials', (req, res) => {
    const { featured } = req.query;
    let query = 'SELECT * FROM testimonials WHERE is_active = 1';
    if (featured === 'true') query += ' AND is_featured = 1';
    query += ' ORDER BY sort_order ASC, created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/gallery', (req, res) => {
    const { category } = req.query;
    let query = 'SELECT * FROM gallery_items WHERE is_active = 1';
    const params = [];
    if (category) { query += ' AND kategori = ?'; params.push(category); }
    query += ' ORDER BY kategori ASC, sort_order ASC';
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/institution', (req, res) => {
    db.query('SELECT * FROM institution_info', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const info = {};
        results.forEach(row => { info[row.key_name] = row.value; });
        res.json(info);
    });
});

router.get('/vision-mission', (req, res) => {
    db.query('SELECT * FROM vision_mission ORDER BY type ASC, sort_order ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/site-settings', (req, res) => {
    db.query('SELECT * FROM site_settings', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        results.forEach(row => { settings[row.key_name] = row.value; });
        res.json(settings);
    });
});

router.get('/posts', (req, res) => {
    const { category, status } = req.query;
    let query = 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const params = [];
    if (category) { query += ' AND c.slug = ?'; params.push(category); }
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    else { query += ' AND p.status = "published"'; }
    query += ' ORDER BY p.published_at DESC';
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/posts/:id', (req, res) => {
    db.query('SELECT p.*, c.name as category_name, c.slug as category_slug FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Post not found' });
        res.json(results[0]);
    });
});

router.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/org-chart', (req, res) => {
    db.query('SELECT * FROM org_chart_nodes ORDER BY sort_order ASC, created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/privacy-policy', (req, res) => {
    db.query('SELECT * FROM privacy_policies WHERE is_current = 1 LIMIT 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Privacy policy not found' });
        res.json(results[0]);
    });
});

module.exports = router;

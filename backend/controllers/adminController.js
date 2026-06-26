const pool = require('../database');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }
        
        const hashedPwd = await bcrypt.hash(password, 10);
        try {
            const { rows } = await pool.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id', 
                [username, hashedPwd, role || 'user']
            );
            res.status(201).json({ success: true, message: 'User created successfully', userId: rows[0].id });
        } catch (err) {
            if (err.code === '23505' || err.message.includes('UNIQUE')) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }
            throw err;
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

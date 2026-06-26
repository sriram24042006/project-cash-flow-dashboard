const pool = require('../database');

// Helper to sanitize input
const sanitizeText = (text) => {
    if (!text) return text;
    return text.toString().replace(/<[^>]*>?/gm, '').replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
};

const logAudit = async (projectId, action, changedBy = 'System_User') => {
    try {
        await pool.query(`INSERT INTO audit_logs (project_id, action, changed_by) VALUES ($1, $2, $3)`, [projectId, action, changedBy]);
    } catch (err) {
        console.error("Error writing audit log:", err.message);
    }
};

// GET /api/payments
exports.getPayments = async (req, res, next) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM payments ORDER BY created_at DESC`);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/payments
exports.createPayment = async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Empty payload rejected", code: 400 });
        }

        let { project_id, Projects, monthly, inflows, status } = req.body;
        
        if (!project_id || !Projects || !monthly || inflows === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields: project_id, Projects, monthly, inflows", code: 400 });
        }

        Projects = sanitizeText(Projects);
        monthly = sanitizeText(monthly);
        status = sanitizeText(status);

        const sql = `INSERT INTO payments (project_id, "Projects", monthly, inflows, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const result = await pool.query(sql, [project_id, Projects, monthly, inflows, status || 'active']);
        const newId = result.rows[0].id;
        
        logAudit(project_id, `Payment added: $${inflows} for ${monthly}`);

        const rowRes = await pool.query(`SELECT * FROM payments WHERE id = $1`, [newId]);
        res.status(201).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// PUT /api/payments/:id
exports.updatePayment = async (req, res, next) => {
    try {
        const paymentId = req.params.id;
        let { project_id, Projects, monthly, inflows, status } = req.body;

        if (!project_id || !Projects || !monthly || inflows === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields: project_id, Projects, monthly, inflows", code: 400 });
        }

        Projects = sanitizeText(Projects);
        monthly = sanitizeText(monthly);
        status = sanitizeText(status);

        const sql = `
            UPDATE payments 
            SET project_id = $1, "Projects" = $2, monthly = $3, inflows = $4, status = $5, updated_at = NOW()
            WHERE id = $6
        `;

        const result = await pool.query(sql, [project_id, Projects, monthly, inflows, status || 'active', paymentId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found', code: 404 });
        }

        logAudit(project_id, `Updated payment: $${inflows} for ${monthly}`);

        const rowRes = await pool.query(`SELECT * FROM payments WHERE id = $1`, [paymentId]);
        res.status(200).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/payments/:id
exports.removePayment = async (req, res, next) => {
    try {
        const paymentId = req.params.id;
        
        const { rows } = await pool.query(`SELECT project_id, monthly, inflows FROM payments WHERE id = $1`, [paymentId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found', code: 404 });
        }
        
        const { project_id, monthly, inflows } = rows[0];

        await pool.query(`DELETE FROM payments WHERE id = $1`, [paymentId]);
        
        logAudit(project_id, `Deleted payment: $${inflows} for ${monthly}`);
        
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

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

// GET /api/contracts
exports.getContracts = async (req, res, next) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM contracts ORDER BY created_at DESC`);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/contracts
exports.createContracts = async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Empty payload rejected", code: 400 });
        }

        let { Projects, monthly, inflows, status } = req.body;
        
        if (!Projects || !monthly || inflows === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields: Projects, monthly, inflows", code: 400 });
        }

        Projects = sanitizeText(Projects);
        monthly = sanitizeText(monthly);
        status = sanitizeText(status);

        const projectRes = await pool.query(`SELECT id FROM project_cash_flow_forecasting WHERE "Projects" = $1 LIMIT 1`, [Projects]);
        const projectId = projectRes.rows.length > 0 ? projectRes.rows[0].id : null;

        const sql = `INSERT INTO contracts (project_id, "Projects", monthly, inflows, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const result = await pool.query(sql, [projectId, Projects, monthly, inflows, status || 'active']);
        const newId = result.rows[0].id;
        
        if (projectId) {
            logAudit(projectId, `Contract added: $${inflows} for ${monthly}`);
        }

        const rowRes = await pool.query(`SELECT * FROM contracts WHERE id = $1`, [newId]);
        res.status(201).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// PUT /api/contracts/:id
exports.updateContract = async (req, res, next) => {
    try {
        const contractId = req.params.id;
        let { Projects, monthly, inflows, status } = req.body;

        if (!Projects || !monthly || inflows === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields: Projects, monthly, inflows", code: 400 });
        }

        Projects = sanitizeText(Projects);
        monthly = sanitizeText(monthly);
        status = sanitizeText(status);

        const projectRes = await pool.query(`SELECT id FROM project_cash_flow_forecasting WHERE "Projects" = $1 LIMIT 1`, [Projects]);
        const projectId = projectRes.rows.length > 0 ? projectRes.rows[0].id : null;

        const sql = `
            UPDATE contracts 
            SET project_id = $1, "Projects" = $2, monthly = $3, inflows = $4, status = $5, updated_at = NOW()
            WHERE id = $6
        `;

        const result = await pool.query(sql, [projectId, Projects, monthly, inflows, status || 'active', contractId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Contract not found', code: 404 });
        }

        if (projectId) {
            logAudit(projectId, `Updated contract: $${inflows} for ${monthly}`);
        }

        const rowRes = await pool.query(`SELECT * FROM contracts WHERE id = $1`, [contractId]);
        res.status(200).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/contracts/:id
exports.removeContract = async (req, res, next) => {
    try {
        const contractId = req.params.id;
        
        const { rows } = await pool.query(`SELECT project_id, monthly, inflows FROM contracts WHERE id = $1`, [contractId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Contract not found', code: 404 });
        }
        
        const { project_id, monthly, inflows } = rows[0];

        await pool.query(`DELETE FROM contracts WHERE id = $1`, [contractId]);
        
        if (project_id) {
            logAudit(project_id, `Deleted contract: $${inflows} for ${monthly}`);
        }
        
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

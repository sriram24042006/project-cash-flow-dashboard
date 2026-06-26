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

// GET /api/inventory
exports.getInventory = async (req, res, next) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM inventory ORDER BY created_at DESC`);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

// POST /api/inventory
exports.createInventory = async (req, res, next) => {
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

        const sql = `INSERT INTO inventory (project_id, "Projects", monthly, inflows, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const result = await pool.query(sql, [projectId, Projects, monthly, inflows, status || 'active']);
        const newId = result.rows[0].id;
        
        if (projectId) {
            logAudit(projectId, `Inventory added: $${inflows} for ${monthly}`);
        }

        const rowRes = await pool.query(`SELECT * FROM inventory WHERE id = $1`, [newId]);
        res.status(201).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// PUT /api/inventory/:id
exports.updateInventory = async (req, res, next) => {
    try {
        const inventoryId = req.params.id;
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
            UPDATE inventory 
            SET project_id = $1, "Projects" = $2, monthly = $3, inflows = $4, status = $5, updated_at = NOW()
            WHERE id = $6
        `;

        const result = await pool.query(sql, [projectId, Projects, monthly, inflows, status || 'active', inventoryId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Inventory not found', code: 404 });
        }

        if (projectId) {
            logAudit(projectId, `Updated inventory: $${inflows} for ${monthly}`);
        }

        const rowRes = await pool.query(`SELECT * FROM inventory WHERE id = $1`, [inventoryId]);
        res.status(200).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/inventory/:id
exports.removeInventory = async (req, res, next) => {
    try {
        const inventoryId = req.params.id;
        
        const { rows } = await pool.query(`SELECT project_id, monthly, inflows FROM inventory WHERE id = $1`, [inventoryId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Inventory not found', code: 404 });
        }
        
        const { project_id, monthly, inflows } = rows[0];

        await pool.query(`DELETE FROM inventory WHERE id = $1`, [inventoryId]);
        
        if (project_id) {
            logAudit(project_id, `Deleted inventory: $${inflows} for ${monthly}`);
        }
        
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

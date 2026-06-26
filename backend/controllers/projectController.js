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

// Helper for audit logs
const logAudit = async (projectId, action, changedBy = 'System_User') => {
    try {
        await pool.query(`INSERT INTO audit_logs (project_id, action, changed_by) VALUES ($1, $2, $3)`, [projectId, action, changedBy]);
    } catch (err) {
        console.error("Error writing audit log:", err.message);
    }
};

// POST /api/project_cash_flow_forecasting
exports.createProject = async (req, res, next) => {
    try {
        let { Projects, client, billing, monthly, inflows, status } = req.body;
        
        if (!Projects || !client || !billing || !monthly || inflows === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields: Projects, client, billing, monthly, inflows", code: 400 });
        }

        Projects = sanitizeText(Projects);
        client = sanitizeText(client);
        billing = sanitizeText(billing);
        monthly = sanitizeText(monthly);
        
        if (!status) {
            status = 'pending';
        } else {
            status = sanitizeText(status).toLowerCase();
            if (status !== 'pending' && status !== 'active') {
                return res.status(400).json({ success: false, message: "New projects must be created with status 'pending' or 'active'.", code: 400 });
            }
        }

        const sql = `INSERT INTO project_cash_flow_forecasting ("Projects", client, billing, monthly, inflows, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
        const result = await pool.query(sql, [Projects, client, billing, monthly, inflows, status]);
        const newId = result.rows[0].id;
        
        logAudit(newId, `Created project ${Projects}`);

        const rowRes = await pool.query(`SELECT * FROM project_cash_flow_forecasting WHERE id = $1`, [newId]);
        res.status(201).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// GET /api/project_cash_flow_forecasting
exports.getProjects = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const { status, search, sortBy, order } = req.query;
        let query = `SELECT * FROM project_cash_flow_forecasting`;
        let countQuery = `SELECT COUNT(*) as total FROM project_cash_flow_forecasting`;
        let params = [];
        let conditions = [];

        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }
        
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`"Projects" ILIKE $${params.length}`); // Postgres uses ILIKE for case-insensitive
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ` + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        // Safe sort column mapping
        const validSortColumns = {
            'Projects': '"Projects"',
            'monthly': 'monthly',
            'inflows': 'inflows',
            'status': 'status',
            'created_at': 'created_at'
        };
        const sortColumn = validSortColumns[sortBy] || 'created_at';
        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

        params.push(limit, offset);
        query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT $${params.length - 1} OFFSET $${params.length}`;

        // Get count
        const countParams = params.slice(0, params.length - 2);
        const countRes = await pool.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0].total);

        // Get data
        const dataRes = await pool.query(query, params);

        res.status(200).json({
            success: true,
            data: dataRes.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/project_cash_flow_forecasting/:id
exports.getProjectById = async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const projectRes = await pool.query(`SELECT * FROM project_cash_flow_forecasting WHERE id = $1`, [projectId]);
        
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found', code: 404 });
        }
        const projectRow = projectRes.rows[0];

        const auditRes = await pool.query(`SELECT * FROM audit_logs WHERE project_id = $1 ORDER BY timestamp DESC`, [projectId]);
        projectRow.audit_logs = auditRes.rows;

        res.status(200).json({ success: true, data: projectRow });
    } catch (error) {
        next(error);
    }
};

// GET /api/project_cash_flow_forecasting/:id/detail
exports.getProjectDetail = async (req, res, next) => {
    try {
        const projectId = req.params.id;
        
        const sql = `
            SELECT 
                pcf.*,
                p.id as pay_id, p.monthly as pay_monthly, p.inflows as pay_inflows, p.status as pay_status,
                c.id as cust_id, c.monthly as cust_monthly, c.inflows as cust_inflows, c.status as cust_status
            FROM project_cash_flow_forecasting pcf
            LEFT JOIN payments p ON p.project_id = pcf.id
            LEFT JOIN customers c ON c.project_id = pcf.id
            WHERE pcf.id = $1
        `;

        const { rows } = await pool.query(sql, [projectId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found', code: 404 });
        }

        const projectData = {
            id: rows[0].id,
            Projects: rows[0].Projects || rows[0].projects, // Account for lowercasing if happened
            monthly: rows[0].monthly,
            inflows: rows[0].inflows,
            status: rows[0].status,
            client: rows[0].client,
            billing: rows[0].billing,
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at,
            payments: [],
            customers: []
        };

        const addedPayments = new Set();
        const addedCustomers = new Set();

        rows.forEach(row => {
            if (row.pay_id && !addedPayments.has(row.pay_id)) {
                projectData.payments.push({
                    id: row.pay_id,
                    monthly: row.pay_monthly,
                    inflows: row.pay_inflows,
                    status: row.pay_status
                });
                addedPayments.add(row.pay_id);
            }
            if (row.cust_id && !addedCustomers.has(row.cust_id)) {
                projectData.customers.push({
                    id: row.cust_id,
                    monthly: row.cust_monthly,
                    inflows: row.cust_inflows,
                    status: row.cust_status
                });
                addedCustomers.add(row.cust_id);
            }
        });

        // Fetch audit logs
        const auditRes = await pool.query(`SELECT * FROM audit_logs WHERE project_id = $1 ORDER BY timestamp DESC`, [projectId]);
        projectData.audit_logs = auditRes.rows;
        
        res.status(200).json({ success: true, data: projectData });
    } catch (error) {
        next(error);
    }
};

// PUT /api/project_cash_flow_forecasting/:id
exports.updateProject = async (req, res, next) => {
    try {
        const projectId = req.params.id;
        let { Projects, client, billing, monthly, inflows, status } = req.body;

        if (!Projects || !client || !billing || !monthly || inflows === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields: Projects, client, billing, monthly, inflows", code: 400 });
        }

        Projects = sanitizeText(Projects);
        client = sanitizeText(client);
        billing = sanitizeText(billing);
        monthly = sanitizeText(monthly);
        status = sanitizeText(status);

        const sql = `
            UPDATE project_cash_flow_forecasting 
            SET "Projects" = $1, client = $2, billing = $3, monthly = $4, inflows = $5, status = $6, updated_at = NOW()
            WHERE id = $7
        `;

        const result = await pool.query(sql, [Projects, client, billing, monthly, inflows, status, projectId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Project not found', code: 404 });
        }

        logAudit(projectId, `Updated project details: ${Projects}`);

        const rowRes = await pool.query(`SELECT * FROM project_cash_flow_forecasting WHERE id = $1`, [projectId]);
        res.status(200).json({ success: true, data: rowRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/project_cash_flow_forecasting/:id/status
exports.updateProjectStatus = async (req, res, next) => {
    try {
        const projectId = req.params.id;
        let { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required", code: 400 });
        }

        status = sanitizeText(status).toLowerCase();

        // 1. Fetch current status
        const { rows } = await pool.query(`SELECT status FROM project_cash_flow_forecasting WHERE id = $1`, [projectId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found', code: 404 });
        }

        const currentStatus = rows[0].status.toLowerCase();

        // Strict Stage Management Rules
        const validTransitions = {
            'pending': ['active', 'cancelled'],
            'active': ['completed', 'on hold', 'cancelled', 'archived'],
            'on hold': ['active', 'cancelled'],
            'completed': ['archived'], // Terminal state
            'archived': [],
            'cancelled': []  // Terminal state
        };

        if (currentStatus !== status) {
            const allowedNextStates = validTransitions[currentStatus] || [];
            if (!allowedNextStates.includes(status)) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Invalid state transition from '${currentStatus}' to '${status}'. Allowed: ${allowedNextStates.join(', ') || 'none'}`, 
                    code: 400 
                });
            }
        }

        const sql = `
            UPDATE project_cash_flow_forecasting 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
        `;

        await pool.query(sql, [status, projectId]);
        
        const changedBy = req.user ? req.user.username : 'System_User';
        logAudit(projectId, `Status changed from ${currentStatus} to ${status}`, changedBy);

        res.status(200).json({ success: true, message: "Status updated successfully", status });
    } catch (error) {
        next(error);
    }
};

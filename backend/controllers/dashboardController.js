const pool = require('../database');

// GET /api/dashboard/summary
exports.getDashboardSummary = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as "totalProjects",
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as "activeProjects",
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as "completedProjects",
                SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as "archivedProjects",
                SUM(inflows) as "totalInflows"
            FROM project_cash_flow_forecasting
        `;

        const { rows } = await pool.query(query);
        const row = rows[0] || {};
        
        res.status(200).json({
            success: true,
            data: {
                totalProjects: parseInt(row.totalProjects) || 0,
                activeProjects: parseInt(row.activeProjects) || 0,
                completedProjects: parseInt(row.completedProjects) || 0,
                archivedProjects: parseInt(row.archivedProjects) || 0,
                totalInflows: parseFloat(row.totalInflows) || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

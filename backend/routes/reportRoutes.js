const express = require('express');
const router = express.Router();
const forecastingEngine = require('../services/forecastingEngine');

// GET /api/reports/summary
router.get('/summary', async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        
        const dateRegex = /^\d{4}-\d{2}$/;
        if (startDate && !dateRegex.test(startDate)) {
            return res.status(400).json({ success: false, message: "Invalid startDate format. Expected YYYY-MM", code: 400 });
        }
        if (endDate && !dateRegex.test(endDate)) {
            return res.status(400).json({ success: false, message: "Invalid endDate format. Expected YYYY-MM", code: 400 });
        }

        const report = await forecastingEngine.generateSummaryReport(startDate, endDate);
        if (report.success) {
            res.status(200).json(report);
        } else {
            res.status(500).json(report);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;

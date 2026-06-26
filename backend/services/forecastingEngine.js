const pool = require('../database');

/**
 * Calculates the monthly aggregated 60-day forward liquidity position projection.
 * It queries inflows and outflows across the tables and mathematically processes the net position.
 */
exports.generateSummaryReport = async (startDate, endDate) => {
    try {
        // Step 1: Query the database for all necessary tables. 
        // We use Promise.all to fetch all data simultaneously for performance.
        const queries = [
            fetchTableData('project_cash_flow_forecasting'),
            fetchTableData('customers'),
            fetchTableData('contracts'),
            fetchTableData('payments'),
            fetchTableData('inventory')
        ];

        const [projects, customers, contracts, payments, inventory] = await Promise.all(queries);

        // Step 2: Initialize aggregation structures
        // We'll map data by the 'monthly' key to aggregate inflows and outflows per month.
        const monthlyData = {};
        let totalMilestonesInflow = 0;
        let totalOutflows = 0;
        
        // Track project-specific outflows to calculate budget ceilings
        const projectOutflows = {};
        const alerts = [];

        // Helper function to safely parse numerical values (defends against null/undefined/NaN)
        const safeNum = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        // Helper function to aggregate data into the monthly map
        const aggregate = (dataArray, isOutflow) => {
            // Defenses against empty arrays or null responses
            if (!dataArray || dataArray.length === 0) return;

            dataArray.forEach(item => {
                // Postgres lowercases unquoted columns in results by default if selected without quotes,
                // but we explicitly selected `"Projects"`, so it should retain the casing. We'll check both.
                const month = item.monthly || 'Unknown';
                const amount = safeNum(item.inflows);
                const projectName = item.Projects || item.projects || 'Unknown Project';

                // Initialize the month grouping if it doesn't exist
                if (!monthlyData[month]) {
                    monthlyData[month] = { month, inflow: 0, outflow: 0, net: 0 };
                }
                
                // Initialize project specific tracking
                if (!projectOutflows[projectName]) {
                    projectOutflows[projectName] = 0;
                }

                // Add to the appropriate bucket
                if (isOutflow) {
                    monthlyData[month].outflow += amount;
                    totalOutflows += amount;
                    projectOutflows[projectName] += amount;
                } else {
                    monthlyData[month].inflow += amount;
                    totalMilestonesInflow += amount;
                }
                
                // Check active month (Critical Milestone Deadline)
                const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
                if (month === currentMonthStr && amount > 0) {
                    // Deduplicate alerts for same project/month
                    const msg = `Critical Milestone: Action required for ${projectName} in current month (${month})`;
                    if (!alerts.find(a => a.message === msg)) {
                        alerts.push({ type: 'milestone', message: msg, project: projectName });
                    }
                }
            });
        };

        // Step 3: Categorize and aggregate
        // Inflows: Client billing milestones, baseline project forecasts, contracts
        aggregate(projects, false);
        aggregate(customers, false);
        aggregate(contracts, false);

        // Outflows: Contractor payments and material procurements (inventory)
        aggregate(payments, true);
        aggregate(inventory, true);

        // Step 4: Calculate the mathematical net liquidity position for each month
        const timeSeriesArray = Object.values(monthlyData).map(data => {
            // Net Liquidity = Total Inflows - Total Outflows for that specific month
            data.net = data.inflow - data.outflow;
            return data;
        });

        // Step 5: Sort the time-series array to prepare for 60-day forward projection
        // Assuming 'monthly' is a sortable string like 'YYYY-MM'. If 'Unknown', it drops to the bottom.
        timeSeriesArray.sort((a, b) => a.month.localeCompare(b.month));

        // Check for budget ceiling breaches (Synthetic cap: $100,000 outflows)
        Object.keys(projectOutflows).forEach(proj => {
            if (proj !== 'Unknown Project' && projectOutflows[proj] > 100000) {
                alerts.push({ 
                    type: 'budget_ceiling', 
                    message: `Budget Alert: ${proj} has exceeded the $100k outflow ceiling (Total: $${projectOutflows[proj].toFixed(2)})`, 
                    project: proj 
                });
            }
        });

        // Date range filtering logic
        let filterStart = startDate;
        let filterEnd = endDate;

        if (!filterStart && !filterEnd) {
            // 60-day forward window fallback logic
            const now = new Date();
            filterStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const endObj = new Date(now.getFullYear(), now.getMonth() + 2, 1);
            filterEnd = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}`;
        }

        const filteredTimeSeries = timeSeriesArray.filter(data => {
            let isValid = true;
            if (filterStart) isValid = isValid && data.month >= filterStart;
            if (filterEnd) isValid = isValid && data.month <= filterEnd;
            return isValid;
        });

        // Step 6: Return the structured clean payload
        return {
            success: true,
            totals: {
                totalMilestonesInflow,
                totalOutflows,
                netLiquidityPosition: totalMilestonesInflow - totalOutflows
            },
            timeSeries: filteredTimeSeries,
            alerts: alerts
        };

    } catch (error) {
        // Return a safe fallback structure if the database query fails entirely
        console.error("Forecasting Engine Error:", error);
        return {
            success: false,
            totals: { totalMilestonesInflow: 0, totalOutflows: 0, netLiquidityPosition: 0 },
            timeSeries: [],
            alerts: [],
            error: "Failed to generate report due to database error.",
            code: 500
        };
    }
};

/**
 * Helper function to wrap pg queries in a Promise
 */
async function fetchTableData(tableName) {
    try {
        const result = await pool.query(`SELECT "Projects", monthly, inflows FROM ${tableName}`);
        return result.rows;
    } catch (err) {
        console.warn(`Warning: Could not fetch data from ${tableName}`);
        return [];
    }
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const projectRoutes = require('./routes/projectRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const contractsRoutes = require('./routes/contractsRoutes');
const customersRoutes = require('./routes/customersRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://cash-flow-forecasting.netlify.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));

// Health route
app.get('/health', (req, res) => {
    if (db) {
        res.status(200).json({ status: "ok", project: "project-cash-flow-forecasting", database: "connected" });
    } else {
        res.status(500).json({ status: "error", database: "disconnected", code: 500 });
    }
});

// API Routes
app.use('/api/project_cash_flow_forecasting', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Serve Frontend Static Files only if dist exists
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API Route Not Found', code: 404 });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        code: err.status || 500
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
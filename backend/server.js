require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
    'https://cash-flow-forecasting.netlify.app/'  // ← replace with your actual Netlify URL
  ],
  credentials: true
}));

// Limit payload size to 100kb to defend against extreme oversized data
app.use(express.json({ limit: '100kb' }));

// Middleware to explicitly catch malformed JSON inputs (SyntaxError)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload format', code: 400 });
    }
    next(err);
});

// Basic health route
app.get('/reset-admin', async (req, res) => {
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('Admin@1234', 10);
  await db.query('UPDATE users SET password=$1 WHERE username=$2', [hash, 'admin']);
  res.json({ message: 'Password reset to Admin@1234' });
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

// 404 Handler for unknown routes
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API Route Not Found', code: 404 });
});

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        code: err.status || 500
    });
});

// Serve Frontend Static Files for unified deployment
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    // console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

async function initializeTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create Users table (new for Auth)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('Table users is ready.');

        // Seed default admin if no users exist
        const res = await client.query('SELECT COUNT(*) as count FROM users');
        if (res.rows[0].count === '0' || res.rows[0].count === 0) {
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'changeme_on_first_login';
            if (!process.env.DEFAULT_ADMIN_PASSWORD) {
                console.warn('WARNING: DEFAULT_ADMIN_PASSWORD not set. Using insecure default. Change this immediately after first login.');
            }
            const hashedPwd = await bcrypt.hash(defaultPassword, 10);
            await client.query(
                `INSERT INTO users (username, password, role) VALUES ($1, $2, $3)`,
                ['admin', hashedPwd, 'admin']
            );
            console.log('Default admin user created.');
        }

        // 2. Create Project Cash Flow table
        const createProjectTableQuery = `
            CREATE TABLE IF NOT EXISTS project_cash_flow_forecasting (
                id SERIAL PRIMARY KEY,
                "Projects" TEXT,
                client TEXT NOT NULL DEFAULT '',
                billing TEXT NOT NULL DEFAULT '',
                monthly TEXT,
                inflows REAL,
                status TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        await client.query(createProjectTableQuery);
        console.log('Table project_cash_flow_forecasting is ready.');

        await client.query('CREATE INDEX IF NOT EXISTS idx_project_cash_flow_forecasting_projects ON project_cash_flow_forecasting ("Projects")');
        await client.query('CREATE INDEX IF NOT EXISTS idx_project_cash_flow_forecasting_status ON project_cash_flow_forecasting (status)');

        // 3. Create related tables with foreign key to project_cash_flow_forecasting
        const tables = [
            'payments',
            'customers',
            'inventory',
            'contracts'
        ];

        for (const table of tables) {
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS ${table} (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER REFERENCES project_cash_flow_forecasting(id) ON DELETE CASCADE,
                    "Projects" TEXT,
                    monthly TEXT,
                    inflows REAL,
                    status TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `;
            await client.query(createTableQuery);
            console.log(`Table ${table} is ready.`);
            
            await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_projects ON ${table} ("Projects")`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table} (status)`);
        }

        // 4. Create Audit Logs table
        const createAuditLogsQuery = `
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                project_id INTEGER,
                action TEXT,
                changed_by TEXT,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        await client.query(createAuditLogsQuery);
        console.log('Table audit_logs is ready.');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs (project_id)`);

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error initializing tables:', err.message);
    } finally {
        client.release();
    }
}

// Automatically initialize tables
initializeTables().catch(err => console.error("Initialization failed:", err));

module.exports = pool;

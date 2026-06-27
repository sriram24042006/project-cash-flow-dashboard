const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateAdmin() {
    const client = await pool.connect();
    try {
        console.log("Updating admin user...");
        const password = 'Admin@2026';
        const username = 'Admin';
        
        const hashedPwd = await bcrypt.hash(password, 10);
        
        // Check if Admin exists
        const res = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (res.rows.length > 0) {
            // Update existing Admin
            await client.query('UPDATE users SET password = $1, role = $2 WHERE username = $3', [hashedPwd, 'admin', username]);
            console.log("Admin user updated.");
        } else {
            // Delete old admin if exists
            await client.query('DELETE FROM users WHERE username = $1', ['admin']);
            // Create new Admin
            await client.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, hashedPwd, 'admin']);
            console.log("Admin user created.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

updateAdmin();

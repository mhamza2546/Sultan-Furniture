const mysql = require('mysql2/promise');
const crypto = require('crypto');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sultan_erp',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

async function ensureColumn(connection, table, column, definitionSql) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column]
  );

  if ((rows?.[0]?.cnt ?? 0) > 0) return;
  try {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definitionSql}`);
  } catch (e) {
    // Safe on repeated startups / concurrent restarts
    if (e?.code === 'ER_DUP_FIELDNAME') return;
    throw e;
  }
}

async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL (XAMPP).');

    // Materials
    await connection.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        qty DECIMAL(10,2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inventory Logs — every IN/OUT movement with date
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_name VARCHAR(255) NOT NULL,
        type ENUM('IN','OUT') NOT NULL,
        qty DECIMAL(10,2) NOT NULL,
        reason VARCHAR(255) DEFAULT 'Manual Entry',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BOM Recipes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        material_id INT NOT NULL,
        qty_required DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
      )
    `);

    // Production Jobs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(50) PRIMARY KEY,
        product VARCHAR(255) NOT NULL,
        stage VARCHAR(50) NOT NULL DEFAULT 'Pending',
        is_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing job audit columns (for monthly reporting)
    await ensureColumn(connection, 'jobs', 'updated_at', 'updated_at TIMESTAMP NULL DEFAULT NULL');
    await ensureColumn(connection, 'jobs', 'finished_at', 'finished_at TIMESTAMP NULL DEFAULT NULL');

    // Job stage logs (tracks "forward" movements properly)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS job_stage_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id VARCHAR(50) NOT NULL,
        product VARCHAR(255) NOT NULL,
        from_stage VARCHAR(50) NOT NULL,
        to_stage VARCHAR(50) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_job_stage_changed_at (changed_at),
        INDEX idx_job_stage_job_id (job_id)
      )
    `);

    // Labour Payouts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS labour_payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        worker_name VARCHAR(255) NOT NULL DEFAULT 'General Labour',
        job_type VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        rate_per_unit DECIMAL(10,2) NOT NULL,
        total_payout DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Worker Ledger (New)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        job_role VARCHAR(255) DEFAULT 'General Labour',
        balance DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS worker_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        worker_id INT NOT NULL,
        type ENUM('EARNING', 'PAYMENT') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
      )
    `);

    // Sales & Installments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        product VARCHAR(255) NOT NULL DEFAULT 'Furniture Item',
        total_amount DECIMAL(10,2) NOT NULL,
        down_payment DECIMAL(10,2) NOT NULL DEFAULT 0,
        balance_due DECIMAL(10,2) NOT NULL,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin Account (Single User Lockdown)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_account (
        id INT PRIMARY KEY DEFAULT 1,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    const [adminRows] = await connection.query('SELECT password FROM admin_account WHERE id = 1');
    const adminEmail = process.env.ADMIN_EMAIL || 'raoabrar412@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = hashPassword(adminPassword);

    if (!adminRows.length) {
      await connection.query(
        'INSERT INTO admin_account (id, email, password) VALUES (1, ?, ?)',
        [adminEmail, hashedPassword]
      );
    } else {
      const storedPassword = adminRows[0].password || '';
      if (!/^[a-f0-9]{64}$/.test(storedPassword)) {
        await connection.query(
          'UPDATE admin_account SET password = ? WHERE id = 1',
          [hashPassword(storedPassword)]
        );
      }
      await connection.query('UPDATE admin_account SET email = ? WHERE id = 1', [adminEmail]);
    }

    // Temporary OTP store
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_otps (
        id INT PRIMARY KEY DEFAULT 1,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    // Private Vault (Owner's Eyes Only)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS private_vault (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure amount column exists in older instances
    await ensureColumn(connection, 'private_vault', 'amount', 'amount DECIMAL(10,2) DEFAULT 0');

    connection.release();
    console.log('✅ All database tables verified/created.');
  } catch (error) {
    console.error('❌ MySQL connection failed. Make sure XAMPP MySQL is running.', error.message);
  }
}

module.exports = { pool, initDB };

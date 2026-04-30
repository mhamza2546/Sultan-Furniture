const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sultan_furniture_erp'
  });

  console.log('Connected to DB');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact VARCHAR(50),
        category VARCHAR(100),
        balance DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Vendors table checked/created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        type ENUM('BILL', 'PAYMENT') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        material_id INT NULL,
        qty DECIMAL(15, 2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
    );
  `);
  console.log('Vendor Transactions table checked/created');

  await connection.end();
}

setup().catch(console.error);

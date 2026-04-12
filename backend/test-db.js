const mysql = require('mysql2/promise');

async function check() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: ''
    });
    console.log("Connected to MySQL server!");
    
    await connection.query("CREATE DATABASE IF NOT EXISTS sultan_erp;");
    console.log("Database sultan_erp created or verified!");
    
    connection.destroy();
  } catch (err) {
    console.error("MYSQL ERROR:", err);
  }
}

check();

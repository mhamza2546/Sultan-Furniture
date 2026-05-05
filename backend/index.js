require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { initDB, pool } = require('./database');

const FRONTEND_ORIGINS = [
  'http://localhost:5173', 
  'https://sultan-furniture.vercel.app',
  ...(process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : [])
].map(o => o.trim());

const app = express();

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or matching origins
    if (!origin || FRONTEND_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

// Init Database Tables on startup
initDB();

app.get('/', (req, res) => {
  res.send("Abrar's Furniture ERP API — Running ✅");
});

const nodemailer = require('nodemailer');

// Set up Mailer (Use Gmail App Password in .env)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'raoabrar412@gmail.com',
    pass: process.env.SMTP_PASS || 'demo'
  }
});

async function sendMail(to, subject, text) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
     console.log(`\n\n[MAIL MOCK] 📧 To: ${to} \nSubject: ${subject} \nBody:\n${text}\n\n(Configure SMTP_EMAIL and SMTP_PASS in .env to send real emails)\n`);
     return;
  }
  try {
     await transporter.sendMail({
       from: `"Abrar's ERP" <${process.env.SMTP_EMAIL}>`,
       to,
       subject,
       text
     });
  } catch(e) {
     console.error('Mail Error:', e.message);
  }
}

// ============================================================
// AUTHENTICATION & SINGLE ADMIN LOCKDOWN
// ============================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM admin_account WHERE id = 1');
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hashedPassword = hashPassword(password);
    if (admin.email === email && admin.password === hashedPassword) {
      sendMail(admin.email, 'Security Alert: New Login detected', "Someone just logged into your Abrar's Furniture ERP account.\nIf this was you, you can ignore this email.");
      res.json({ success: true, email: admin.email });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const [rows] = await pool.query('SELECT password FROM admin_account WHERE id = 1');
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (admin.password === hashPassword(password)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query('SELECT * FROM admin_account WHERE id = 1');
    const admin = rows[0];

    if (admin.email !== email) {
      // Don't expose that the email is wrong, just act like it worked for security
      return res.json({ success: true });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60000); // 10 minutes

    await pool.query(
      'INSERT INTO password_otps (id, otp_code, expires_at) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = VALUES(expires_at)',
      [otp, expires]
    );

    sendMail(
      admin.email,
      "Password Reset OTP - Abrar's Furniture",
      `Your 6-digit verification code is: ${otp}\nThis code will expire in 10 minutes.`
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const [adminRows] = await pool.query('SELECT * FROM admin_account WHERE id = 1');
    if (!adminRows.length || adminRows[0].email !== email) {
       return res.status(400).json({ error: 'Invalid operation' });
    }

    const [otpRows] = await pool.query('SELECT * FROM password_otps WHERE id = 1');
    const dbOtp = otpRows[0];

    if (!dbOtp || dbOtp.otp_code !== otp || new Date() > new Date(dbOtp.expires_at)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Update password using hashed storage
    await pool.query('UPDATE admin_account SET password = ? WHERE id = 1', [hashPassword(newPassword)]);
    // Invalidate OTP
    await pool.query('UPDATE password_otps SET otp_code = "000000", expires_at = NOW() WHERE id = 1');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MATERIALS (Inventory)
// ============================================================

// GET all materials
app.get('/api/materials', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM materials ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add material + log as IN
app.post('/api/materials', async (req, res) => {
  try {
    const { name, qty, unit, category } = req.body;
    await pool.query(
      'INSERT INTO materials (name, qty, unit, category) VALUES (?, ?, ?, ?)',
      [name, qty, unit, category || 'General']
    );
    // Log inventory IN movement
    await pool.query(
      'INSERT INTO inventory_logs (material_name, type, qty, reason) VALUES (?, ?, ?, ?)',
      [name, 'IN', qty, 'Initial Stock Added']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE material
app.delete('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get material name before deleting for the log
    const [mat] = await pool.query('SELECT name, qty FROM materials WHERE id = ?', [id]);
    if (mat.length > 0) {
      await pool.query(
        'INSERT INTO inventory_logs (material_name, type, qty, reason) VALUES (?, ?, ?, ?)',
        [mat[0].name, 'OUT', mat[0].qty, 'Item Deleted from Inventory']
      );
    }
    await pool.query('DELETE FROM materials WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/materials/:id', async (req, res) => {
  try {
    const { name, qty, unit, category } = req.body;
    await pool.query(
      'UPDATE materials SET name = ?, qty = ?, unit = ?, category = ? WHERE id = ?',
      [name, qty, unit, category, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// INVENTORY LOGS
// ============================================================

app.get('/api/inventory-logs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// JOBS (Manufacturing)
// ============================================================

app.get('/api/jobs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { id, product } = req.body;
    await pool.query('INSERT INTO jobs (id, product) VALUES (?, ?)', [id, product]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { product } = req.body;
    await pool.query('UPDATE jobs SET product = ? WHERE id = ?', [product, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/:id/advance', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'stage required' });

    const [rows] = await pool.query('SELECT id, product, stage FROM jobs WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Job not found' });

    const job = rows[0];
    const isCompleted = stage === 'Finished';

    // Log stage movement (forward action)
    await pool.query(
      'INSERT INTO job_stage_logs (job_id, product, from_stage, to_stage) VALUES (?, ?, ?, ?)',
      [job.id, job.product, job.stage || 'Pending', stage]
    );

    await pool.query(
      'UPDATE jobs SET stage = ?, is_completed = ?, updated_at = NOW(), finished_at = IF(?, NOW(), finished_at) WHERE id = ?',
      [stage, isCompleted, isCompleted, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LABOUR PAYOUTS
// ============================================================

// GET all payouts
app.get('/api/payouts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM labour_payouts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new payout
app.post('/api/payouts', async (req, res) => {
  try {
    const { workerName, jobType, quantity, ratePerUnit, totalPayout } = req.body;
    await pool.query(
      'INSERT INTO labour_payouts (worker_name, job_type, quantity, rate_per_unit, total_payout) VALUES (?, ?, ?, ?, ?)',
      [workerName || 'General Labour', jobType, quantity, ratePerUnit, totalPayout]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// WORKER LEDGER (New)
// ============================================================

app.get('/api/workers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT w.*, 
        (SELECT SUM(amount) FROM worker_transactions WHERE worker_id = w.id AND type = 'EARNING') as total_earned,
        (SELECT SUM(amount) FROM worker_transactions WHERE worker_id = w.id AND type = 'PAYMENT') as total_advance
      FROM workers w ORDER BY w.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workers', async (req, res) => {
  try {
    const { name, jobRole } = req.body;
    const [result] = await pool.query(
      'INSERT INTO workers (name, job_role, balance) VALUES (?, ?, 0)',
      [name, jobRole || 'General Labour']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/workers/:id', async (req, res) => {
  try {
    const { name, jobRole } = req.body;
    await pool.query(
      'UPDATE workers SET name = ?, job_role = ? WHERE id = ?',
      [name, jobRole, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/workers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM workers WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM worker_transactions WHERE worker_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workers/:id/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM worker_transactions WHERE worker_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workers/:id/transactions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { type, amount, description, date } = req.body; // type: 'EARNING' or 'PAYMENT'
    const workerId = req.params.id;
    const txDate = date ? new Date(date) : new Date();

    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO worker_transactions (worker_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [workerId, type, amount, description, txDate]
    );

    if (type === 'EARNING') {
      await connection.query('UPDATE workers SET balance = balance + ? WHERE id = ?', [amount, workerId]);
    } else if (type === 'PAYMENT') {
      await connection.query('UPDATE workers SET balance = balance - ? WHERE id = ?', [amount, workerId]);
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/workers/:id/transactions/:txId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { txId } = req.params;
      const { type, amount, description, date } = req.body;
      const workerId = req.params.id;
  
      await connection.beginTransaction();
  
      // Get old transaction to reverse balance
      const [oldTx] = await connection.query('SELECT * FROM worker_transactions WHERE id = ?', [txId]);
      if (!oldTx.length) throw new Error('Transaction not found');
      
      const old = oldTx[0];
      // Reverse old balance
      if (old.type === 'EARNING') {
          await connection.query('UPDATE workers SET balance = balance - ? WHERE id = ?', [old.amount, workerId]);
      } else {
          await connection.query('UPDATE workers SET balance = balance + ? WHERE id = ?', [old.amount, workerId]);
      }
  
      // Update transaction
      await connection.query(
        'UPDATE worker_transactions SET type = ?, amount = ?, description = ?, created_at = ? WHERE id = ?',
        [type, amount, description, new Date(date), txId]
      );
  
      // Apply new balance
      if (type === 'EARNING') {
          await connection.query('UPDATE workers SET balance = balance + ? WHERE id = ?', [amount, workerId]);
      } else {
          await connection.query('UPDATE workers SET balance = balance - ? WHERE id = ?', [amount, workerId]);
      }
  
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
});

app.delete('/api/workers/:id/transactions/:txId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { txId } = req.params;
      const workerId = req.params.id;
  
      await connection.beginTransaction();
  
      const [oldTx] = await connection.query('SELECT * FROM worker_transactions WHERE id = ?', [txId]);
      if (!oldTx.length) throw new Error('Transaction not found');
      
      const old = oldTx[0];
      // Reverse balance
      if (old.type === 'EARNING') {
          await connection.query('UPDATE workers SET balance = balance - ? WHERE id = ?', [old.amount, workerId]);
      } else {
          await connection.query('UPDATE workers SET balance = balance + ? WHERE id = ?', [old.amount, workerId]);
      }
  
      await connection.query('DELETE FROM worker_transactions WHERE id = ?', [txId]);
  
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
});

// ============================================================
// CUSTOMER LEDGER (Showroom Sales Patterns)
// ============================================================

app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, 
        (SELECT SUM(amount) FROM customer_transactions WHERE customer_id = c.id AND type = 'PURCHASE') as total_sales_bill,
        (SELECT SUM(amount) FROM customer_transactions WHERE customer_id = c.id AND type = 'PAYMENT') as total_received
      FROM customers c ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, jobRole } = req.body;
    const [result] = await pool.query(
      'INSERT INTO customers (name, job_role, balance) VALUES (?, ?, 0)',
      [name, jobRole || 'Showroom Partner']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, jobRole } = req.body;
    await pool.query(
      'UPDATE customers SET name = ?, job_role = ? WHERE id = ?',
      [name, jobRole, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM customer_transactions WHERE customer_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/customers/:id/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customer_transactions WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/customers/:id/transactions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { type, amount, description, date } = req.body; // type: 'PURCHASE' or 'PAYMENT'
    const customerId = req.params.id;
    const txDate = date ? new Date(date) : new Date();

    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO customer_transactions (customer_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [customerId, type, amount, description, txDate]
    );

    if (type === 'PURCHASE') {
      await connection.query('UPDATE customers SET balance = balance + ? WHERE id = ?', [amount, customerId]);
    } else if (type === 'PAYMENT') {
      await connection.query('UPDATE customers SET balance = balance - ? WHERE id = ?', [amount, customerId]);
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/customers/:id/transactions/:txId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { txId } = req.params;
      const { type, amount, description, date } = req.body;
      const customerId = req.params.id;
  
      await connection.beginTransaction();
  
      const [oldTx] = await connection.query('SELECT * FROM customer_transactions WHERE id = ?', [txId]);
      if (!oldTx.length) throw new Error('Transaction not found');
      
      const old = oldTx[0];
      if (old.type === 'PURCHASE') {
          await connection.query('UPDATE customers SET balance = balance - ? WHERE id = ?', [old.amount, customerId]);
      } else {
          await connection.query('UPDATE customers SET balance = balance + ? WHERE id = ?', [old.amount, customerId]);
      }
  
      await connection.query(
        'UPDATE customer_transactions SET type = ?, amount = ?, description = ?, created_at = ? WHERE id = ?',
        [type, amount, description, new Date(date), txId]
      );
  
      if (type === 'PURCHASE') {
          await connection.query('UPDATE customers SET balance = balance + ? WHERE id = ?', [amount, customerId]);
      } else {
          await connection.query('UPDATE customers SET balance = balance - ? WHERE id = ?', [amount, customerId]);
      }
  
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
});

app.delete('/api/customers/:id/transactions/:txId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { txId } = req.params;
      const customerId = req.params.id;
  
      await connection.beginTransaction();
  
      const [oldTx] = await connection.query('SELECT * FROM customer_transactions WHERE id = ?', [txId]);
      if (!oldTx.length) throw new Error('Transaction not found');
      
      const old = oldTx[0];
      if (old.type === 'PURCHASE') {
          await connection.query('UPDATE customers SET balance = balance - ? WHERE id = ?', [old.amount, customerId]);
      } else {
          await connection.query('UPDATE customers SET balance = balance + ? WHERE id = ?', [old.amount, customerId]);
      }
  
      await connection.query('DELETE FROM customer_transactions WHERE id = ?', [txId]);
  
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
});

app.post('/api/sales/new-order', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { customerName, product, totalAmount, downPayment, date } = req.body;
        const txDate = date ? new Date(date) : new Date();

        await connection.beginTransaction();

        // 1. Find or create customer
        const [customers] = await connection.query('SELECT id FROM customers WHERE name = ?', [customerName]);
        let customerId;
        if (customers.length > 0) {
            customerId = customers[0].id;
        } else {
            const [newCust] = await connection.query(
                'INSERT INTO customers (name, job_role, balance) VALUES (?, ?, 0)',
                [customerName, 'Showroom Partner']
            );
            customerId = newCust.insertId;
        }

        // 2. Record Purchase
        await connection.query(
            'INSERT INTO customer_transactions (customer_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
            [customerId, 'PURCHASE', totalAmount, product || 'Furniture Delivery', txDate]
        );

        // 3. Record Payment (if any)
        if (Number(downPayment) > 0) {
            await connection.query(
                'INSERT INTO customer_transactions (customer_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
                [customerId, 'PAYMENT', downPayment, 'Down Payment / Advance', txDate]
            );
        }

        // 4. Update Customer Balance
        const finalBalance = Number(totalAmount) - Number(downPayment || 0);
        await connection.query('UPDATE customers SET balance = balance + ? WHERE id = ?', [finalBalance, customerId]);

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.get('/api/reports/latest-sales', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT ct.*, c.name as customer_name, ct.description as product
             FROM customer_transactions ct
             JOIN customers c ON ct.customer_id = c.id
             WHERE ct.type = 'PURCHASE'
             ORDER BY ct.created_at DESC
             LIMIT 10`
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// REPORTS — Date-wise history (THE KEY FEATURE)
// ============================================================

app.get('/api/reports', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD format
    if (!date) return res.status(400).json({ error: 'date query param required' });

    // Fetch all records for that specific date
    const [inventoryLogs] = await pool.query(
      `SELECT * FROM inventory_logs WHERE DATE(created_at) = ? ORDER BY created_at DESC`,
      [date]
    );

    const [labourPayouts] = await pool.query(
      `SELECT wt.*, w.name as worker_name 
       FROM worker_transactions wt
       JOIN workers w ON wt.worker_id = w.id
       WHERE DATE(wt.created_at) = ? ORDER BY wt.created_at DESC`,
      [date]
    );

    const [salesRecordsRaw] = await pool.query(
      `SELECT 
        ct.id, 
        ct.amount as total_amount,
        ct.description as product,
        c.name as customer_name,
        ct.created_at,
        (
          SELECT SUM(amount) 
          FROM customer_transactions 
          WHERE customer_id = ct.customer_id 
          AND type = 'PAYMENT' 
          AND (description LIKE CONCAT('%', ct.description, '%') OR description LIKE '%Down Payment%')
          AND DATE(created_at) = DATE(ct.created_at)
        ) as down_payment
       FROM customer_transactions ct
       JOIN customers c ON ct.customer_id = c.id
       WHERE ct.type = 'PURCHASE' AND DATE(ct.created_at) = ?
       ORDER BY ct.created_at DESC`,
      [date]
    );

    const salesRecords = salesRecordsRaw.map(s => ({
      ...s,
      down_payment: s.down_payment || 0,
      balance_due: Number(s.total_amount) - Number(s.down_payment || 0)
    }));

    // Vendor purchases
    const [vendorPurchases] = await pool.query(
      `SELECT vt.*, v.name as vendor_name 
       FROM vendor_transactions vt
       JOIN vendors v ON vt.vendor_id = v.id
       WHERE DATE(vt.created_at) = ? ORDER BY vt.created_at DESC`,
      [date]
    );

    // Summary totals
    const totalLabourEarned = labourPayouts.filter(p => p.type === 'EARNING').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalLabourPaid = labourPayouts.filter(p => p.type === 'PAYMENT').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalSales = salesRecords.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const totalMaterialIn = inventoryLogs.filter(l => l.type === 'IN').reduce((sum, l) => sum + parseFloat(l.qty), 0);
    const totalMaterialOut = inventoryLogs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + parseFloat(l.qty), 0);
    const totalVendorBills = vendorPurchases.filter(v => v.type === 'BILL').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
    const totalVendorPaid = vendorPurchases.filter(v => v.type === 'PAYMENT').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);

    res.json({
      date,
      summary: { totalLabourEarned, totalLabourPaid, totalSales, totalMaterialIn, totalMaterialOut, totalVendorBills, totalVendorPaid },
      inventoryLogs,
      labourPayouts,
      salesRecords,
      vendorPurchases,
      jobsCreated: [] // Removed production jobs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// REPORTS — Monthly summary (one click)
// ============================================================
app.get('/api/reports/month', async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month query param required (YYYY-MM)' });
    }

    const start = `${month}-01`;

    const [inventoryLogs] = await pool.query(
      `SELECT * FROM inventory_logs
       WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY created_at DESC`,
      [start, start]
    );

    const [labourPayouts] = await pool.query(
      `SELECT wt.*, w.name as worker_name 
       FROM worker_transactions wt
       JOIN workers w ON wt.worker_id = w.id
       WHERE wt.created_at >= ? AND wt.created_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY wt.created_at DESC`,
      [start, start]
    );

    const [salesRecordsRaw] = await pool.query(
      `SELECT 
        ct.id, 
        ct.amount as total_amount,
        ct.description as product,
        c.name as customer_name,
        ct.created_at,
        (
          SELECT SUM(amount) 
          FROM customer_transactions 
          WHERE customer_id = ct.customer_id 
          AND type = 'PAYMENT' 
          AND (description LIKE CONCAT('%', ct.description, '%') OR description LIKE '%Down Payment%')
          AND DATE(created_at) = DATE(ct.created_at)
        ) as down_payment
       FROM customer_transactions ct
       JOIN customers c ON ct.customer_id = c.id
       WHERE ct.type = 'PURCHASE' 
         AND ct.created_at >= ? AND ct.created_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY ct.created_at DESC`,
      [start, start]
    );

    const salesRecords = salesRecordsRaw.map(s => ({
      ...s,
      down_payment: s.down_payment || 0,
      balance_due: Number(s.total_amount) - Number(s.down_payment || 0)
    }));

    // Vendor purchases
    const [vendorPurchases] = await pool.query(
      `SELECT vt.*, v.name as vendor_name 
       FROM vendor_transactions vt
       JOIN vendors v ON vt.vendor_id = v.id
       WHERE vt.created_at >= ? AND vt.created_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY vt.created_at DESC`,
      [start, start]
    );

    // Summary totals
    const totalLabourEarned = labourPayouts.filter(p => p.type === 'EARNING').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalLabourPaid = labourPayouts.filter(p => p.type === 'PAYMENT').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalLabourAdvance = labourPayouts.filter(p => p.type === 'PAYMENT' && String(p.description || '').toLowerCase().includes('advance')).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalSales = salesRecords.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    const totalMaterialIn = inventoryLogs.filter(l => l.type === 'IN').reduce((sum, l) => sum + parseFloat(l.qty), 0);
    const totalMaterialOut = inventoryLogs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + parseFloat(l.qty), 0);
    const totalVendorBills = vendorPurchases.filter(v => v.type === 'BILL').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
    const totalVendorPaid = vendorPurchases.filter(v => v.type === 'PAYMENT').reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);

    res.json({
      month,
      summary: {
        totalLabourEarned,
        totalLabourPaid,
        totalLabourAdvance,
        totalSales,
        totalMaterialIn,
        totalMaterialOut,
        totalVendorBills,
        totalVendorPaid,
        jobsCreated: 0,
        jobsForwarded: 0,
        jobsFinished: 0
      },
      inventoryLogs,
      labourPayouts,
      salesRecords,
      vendorPurchases,
      jobsCreated: [],
      jobsForwarded: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PRIVATE DATA VAULT
// ============================================================

app.get('/api/vault', async (req, res) => {
  try {
    const { date, month } = req.query;
    let query = 'SELECT * FROM private_vault WHERE 1=1';
    const params = [];
    
    if (date) {
      query += ' AND DATE(created_at) = ?';
      params.push(date);
    } else if (month) {
      query += ' AND DATE_FORMAT(created_at, "%Y-%m") = ?';
      params.push(month);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vault', async (req, res) => {
  try {
    const { title, content, amount } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const vaultAmount = amount || 0;
    await pool.query('INSERT INTO private_vault (title, content, amount) VALUES (?, ?, ?)', [title, content, vaultAmount]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vault/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM private_vault WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vault/:id', async (req, res) => {
  try {
    const { title, content, amount } = req.body;
    await pool.query(
      'UPDATE private_vault SET title = ?, content = ?, amount = ? WHERE id = ?',
      [title, content, amount, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/sales/:id', async (req, res) => {
  try {
    const { customerName, product, totalAmount } = req.body;
    await pool.query(
      'UPDATE sales SET customer_name = ?, product = ?, total_amount = ? WHERE id = ?',
      [customerName, product, totalAmount, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/payouts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM labour_payouts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/payouts/:id', async (req, res) => {
  try {
    const { workerName, jobType, quantity, ratePerUnit, totalPayout } = req.body;
    await pool.query(
      'UPDATE labour_payouts SET worker_name = ?, job_type = ?, quantity = ?, rate_per_unit = ?, total_payout = ? WHERE id = ?',
      [workerName, jobType, quantity, ratePerUnit, totalPayout, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM job_stage_logs WHERE job_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// VENDORS — Supplier Ledger
// ============================================================

app.get('/api/vendors', async (req, res) => {
    try {
        const [rows] = await pool.query(`
          SELECT v.*, 
            (SELECT SUM(amount) FROM vendor_transactions WHERE vendor_id = v.id AND type = 'BILL') as total_purchase,
            (SELECT SUM(amount) FROM vendor_transactions WHERE vendor_id = v.id AND type = 'PAYMENT') as total_paid
          FROM vendors v ORDER BY v.name ASC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vendors', async (req, res) => {
    try {
        const { name, contact, category } = req.body;
        const [result] = await pool.query('INSERT INTO vendors (name, contact, category) VALUES (?, ?, ?)', [name, contact, category]);
        res.json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/vendors/:id', async (req, res) => {
    try {
        const { name, contact, category } = req.body;
        await pool.query('UPDATE vendors SET name = ?, contact = ?, category = ? WHERE id = ?', [name, contact, category, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/vendors/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM vendors WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/vendors/:id/transactions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vendor_transactions WHERE vendor_id = ? ORDER BY created_at DESC', [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/purchase', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { vendorId, materialId, qty, totalBill, paidAmount, description, date } = req.body;
        const txDate = date ? new Date(date) : new Date();

        // 1. Record Bill
        await connection.query(
            'INSERT INTO vendor_transactions (vendor_id, type, amount, description, material_id, qty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [vendorId, 'BILL', totalBill, description || 'Purchase Bill', materialId || null, qty || 0, txDate]
        );

        // 2. Record Payment (if any)
        if (Number(paidAmount) > 0) {
            await connection.query(
                'INSERT INTO vendor_transactions (vendor_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
                [vendorId, 'PAYMENT', paidAmount, `Down Payment: ${description || ''}`, txDate]
            );
        }

        // 3. Update Vendor Balance
        const netDebt = Number(totalBill) - Number(paidAmount || 0);
        await connection.query('UPDATE vendors SET balance = balance + ? WHERE id = ?', [netDebt, vendorId]);

        // 4. Update Inventory Stock (Materials table)
        if (materialId) {
            await connection.query('UPDATE materials SET qty = qty + ? WHERE id = ?', [qty, materialId]);
            
            // Get material name for logs
            const [mRows] = await connection.query('SELECT name FROM materials WHERE id = ?', [materialId]);
            const mName = mRows.length > 0 ? mRows[0].name : 'Unknown Material';

            // 5. Log Inventory
            await connection.query(
                'INSERT INTO inventory_logs (material_name, type, qty, reason, created_at) VALUES (?, ?, ?, ?, ?)',
                [mName, 'IN', qty, `Purchased: ${description || ''}`, txDate]
            );
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.post('/api/vendors/:id/transactions', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { type, amount, description, date } = req.body;
        
        await connection.query(
            'INSERT INTO vendor_transactions (vendor_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, type, amount, description, date]
        );

        const diff = type === 'BILL' ? Number(amount) : -Number(amount);
        await connection.query('UPDATE vendors SET balance = balance + ? WHERE id = ?', [diff, req.params.id]);

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
});

app.delete('/api/vendors/:vendorId/transactions/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const vendorId = req.params.vendorId;
        const txId = req.params.id;

        const [tx] = await connection.query('SELECT * FROM vendor_transactions WHERE id = ?', [txId]);
        if (tx.length > 0) {
            const oldRow = tx[0];
            const diff = oldRow.type === 'BILL' ? -Number(oldRow.amount) : Number(oldRow.amount);
            await connection.query('UPDATE vendors SET balance = balance + ? WHERE id = ?', [diff, vendorId]);
        }

        await connection.query('DELETE FROM vendor_transactions WHERE id = ?', [txId]);
        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
});

app.put('/api/vendors/:vendorId/transactions/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { amount, description, date, type } = req.body;
        const txId = req.params.id;
        const vendorId = req.params.vendorId;

        const [oldTx] = await connection.query('SELECT * FROM vendor_transactions WHERE id = ?', [txId]);
        if (oldTx.length > 0) {
            const oldRow = oldTx[0];
            const revDiff = oldRow.type === 'BILL' ? -Number(oldRow.amount) : Number(oldRow.amount);
            await connection.query('UPDATE vendors SET balance = balance + ? WHERE id = ?', [revDiff, vendorId]);
        }

        const newDiff = type === 'BILL' ? Number(amount) : -Number(amount);
        await connection.query('UPDATE vendors SET balance = balance + ? WHERE id = ?', [newDiff, vendorId]);

        await connection.query(
            'UPDATE vendor_transactions SET amount = ?, description = ?, created_at = ?, type = ? WHERE id = ?',
            [amount, description, date, type, txId]
        );

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
});

// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Abrar's ERP Server running on http://localhost:${PORT}`);
});

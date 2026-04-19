require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { initDB, pool } = require('./database');

const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,https://sultan-furniture.vercel.app')
  .split(',')
  .map(o => o.trim());

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
    const [rows] = await pool.query('SELECT * FROM workers ORDER BY created_at DESC');
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
    const { type, amount, description } = req.body; // type: 'EARNING' or 'PAYMENT'
    const workerId = req.params.id;

    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO worker_transactions (worker_id, type, amount, description) VALUES (?, ?, ?, ?)',
      [workerId, type, amount, description]
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

// ============================================================
// SALES & ACCOUNTS
// ============================================================

// GET all sales
app.get('/api/sales', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sales ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new sale
app.post('/api/sales', async (req, res) => {
  try {
    const { customerName, product, totalAmount } = req.body;
    // Wholesale fully paid mapping
    const downPayment = totalAmount;
    const balance = 0;
    await pool.query(
      'INSERT INTO sales (customer_name, product, total_amount, down_payment, balance_due, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [customerName, product, totalAmount, downPayment, balance, null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      `SELECT * FROM labour_payouts WHERE DATE(created_at) = ? ORDER BY created_at DESC`,
      [date]
    );

    const [salesRecords] = await pool.query(
      `SELECT * FROM sales WHERE DATE(created_at) = ? ORDER BY created_at DESC`,
      [date]
    );

    const [jobsCreated] = await pool.query(
      `SELECT * FROM jobs WHERE DATE(created_at) = ? ORDER BY created_at DESC`,
      [date]
    );

    // Summary totals
    const totalLabourPaid = labourPayouts.reduce((sum, p) => sum + parseFloat(p.total_payout), 0);
    const totalSales = salesRecords.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const totalMaterialIn = inventoryLogs.filter(l => l.type === 'IN').reduce((sum, l) => sum + parseFloat(l.qty), 0);
    const totalMaterialOut = inventoryLogs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + parseFloat(l.qty), 0);

    res.json({
      date,
      summary: { totalLabourPaid, totalSales, totalMaterialIn, totalMaterialOut },
      inventoryLogs,
      labourPayouts,
      salesRecords,
      jobsCreated
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
      `SELECT * FROM labour_payouts
       WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY created_at DESC`,
      [start, start]
    );

    const [salesRecords] = await pool.query(
      `SELECT * FROM sales
       WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY created_at DESC`,
      [start, start]
    );

    const [jobsCreated] = await pool.query(
      `SELECT * FROM jobs
       WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY created_at DESC`,
      [start, start]
    );

    const [jobsForwarded] = await pool.query(
      `SELECT * FROM job_stage_logs
       WHERE changed_at >= ? AND changed_at < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY changed_at DESC`,
      [start, start]
    );

    // Summary totals
    const totalLabourPaid = labourPayouts.reduce((sum, p) => sum + parseFloat(p.total_payout), 0);
    const totalSales = salesRecords.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const totalMaterialIn = inventoryLogs.filter(l => l.type === 'IN').reduce((sum, l) => sum + parseFloat(l.qty), 0);
    const totalMaterialOut = inventoryLogs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + parseFloat(l.qty), 0);

    const jobsFinished = jobsForwarded.filter(l => l.to_stage === 'Finished').length;

    res.json({
      month,
      summary: {
        totalLabourPaid,
        totalSales,
        totalMaterialIn,
        totalMaterialOut,
        jobsCreated: jobsCreated.length,
        jobsForwarded: jobsForwarded.length,
        jobsFinished
      },
      inventoryLogs,
      labourPayouts,
      salesRecords,
      jobsCreated,
      jobsForwarded
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

app.delete('/api/sales/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/payouts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM labour_payouts WHERE id = ?', [req.params.id]);
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Abrar's ERP Server running on http://localhost:${PORT}`);
});

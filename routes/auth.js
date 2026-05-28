const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const { sendVerificationEmail } = require('../mailer');
const { sendVerificationSMS } = require('../sms');

function generateCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

// Step 1: Register — send verification code
router.post('/register', async (req, res) => {
  const { email, phone, password, first_name, last_name, username } = req.body;
  if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (!username) return res.status(400).json({ error: 'Username required' });

  const db = await getPool();

  // Check duplicates
  const [existingUsername] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (existingUsername.length > 0) return res.status(409).json({ error: 'Username already in use' });
  if (email) {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already in use' });
  }
  if (phone) {
    const [existing] = await db.execute('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) return res.status(409).json({ error: 'Phone already in use' });
  }

  // Check if admin has enabled verification
  const [settingRows] = await db.execute("SELECT value FROM site_settings WHERE key_name = 'require_verification'");
  const requireVerification = settingRows[0]?.value === '1';

  const hash = await bcrypt.hash(password, 10);

  if (requireVerification) {
    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await db.execute(
      `INSERT INTO users (username, email, phone, password, first_name, last_name, role, verified, verify_code, verify_expires) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [username, email || null, phone || null, hash, first_name || null, last_name || null, 'customer', 0, code, expires]
    );
    const isEmail = !!email;
    if (isEmail) {
      try { await sendVerificationEmail(email, code); } catch (err) {
        console.error('Email error:', err.message);
        return res.status(500).json({ error: 'Failed to send email' });
      }
    }
    if (phone) {
      try { await sendVerificationSMS(phone, code); } catch (err) {
        console.error('SMS error:', err.message);
        return res.status(500).json({ error: 'Failed to send SMS' });
      }
    }
    return res.json({ message: 'Verification code sent', requireVerification: true, isEmail });
  }

  // No verification — register directly
  await db.execute(
    `INSERT INTO users (username, email, phone, password, first_name, last_name, role, verified) VALUES (?,?,?,?,?,?,?,?)`,
    [username, email || null, phone || null, hash, first_name || null, last_name || null, 'customer', 1]
  );
  const [newUser] = await db.execute('SELECT id, email, phone, role FROM users WHERE username = ?', [username]);
  const user = newUser[0];
  const token = jwt.sign({ id: user.id, email: user.email, phone: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role });
});

// Step 2: Verify code
router.post('/verify', async (req, res) => {
  const { username, code } = req.body;
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.verify_code !== code) return res.status(400).json({ error: 'Invalid code' });
  if (new Date(user.verify_expires) < new Date()) return res.status(400).json({ error: 'Code expired' });

  await db.execute('UPDATE users SET verified=1, verify_code=NULL, verify_expires=NULL WHERE id=?', [user.id]);
  const token = jwt.sign({ id: user.id, email: user.email, phone: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role });
});

// Resend code
router.post('/resend', async (req, res) => {
  const { username, via } = req.body; // via = 'email' or 'sms' (optional)
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });

  const user = rows[0];
  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await db.execute('UPDATE users SET verify_code=?, verify_expires=? WHERE id=?', [code, expires, user.id]);

  // If user has both and no preference specified, ask them
  if (user.email && user.phone && !via) {
    return res.json({ message: 'Choose method', askPreference: true });
  }

  const sendEmail = via === 'email' || (!via && user.email);
  const sendSms = via === 'sms' || (!via && !user.email && user.phone);

  if (sendEmail && user.email) {
    try { await sendVerificationEmail(user.email, code); } catch (err) {
      return res.status(500).json({ error: 'Failed to send email' });
    }
    return res.json({ message: 'Code resent via email', sentVia: 'email' });
  }
  if (sendSms && user.phone) {
    try { await sendVerificationSMS(user.phone, code); } catch (err) {
      return res.status(500).json({ error: 'Failed to send SMS' });
    }
    return res.json({ message: 'Code resent via SMS', sentVia: 'sms' });
  }
  res.status(400).json({ error: 'No contact method available' });
});

// Forgot password — send reset code
router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });

  const user = rows[0];
  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await db.execute('UPDATE users SET verify_code=?, verify_expires=? WHERE id=?', [code, expires, user.id]);

  if (user.email) {
    try { await sendVerificationEmail(user.email, code); } catch (err) {
      console.error('Email error:', err.message);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    return res.json({ message: 'Reset code sent', sentVia: 'email' });
  }
  if (user.phone) {
    try { await sendVerificationSMS(user.phone, code); } catch (err) {
      console.error('SMS error:', err.message);
      return res.status(500).json({ error: 'Failed to send SMS' });
    }
    return res.json({ message: 'Reset code sent', sentVia: 'sms' });
  }
  res.status(400).json({ error: 'No email or phone on file' });
});

// Reset password — verify code and set new password
router.post('/reset-password', async (req, res) => {
  const { username, code, password } = req.body;
  if (!username || !code || !password) return res.status(400).json({ error: 'All fields required' });
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.verify_code !== code) return res.status(400).json({ error: 'Invalid code' });
  if (new Date(user.verify_expires) < new Date()) return res.status(400).json({ error: 'Code expired' });

  const hash = await bcrypt.hash(password, 10);
  await db.execute('UPDATE users SET password=?, verify_code=NULL, verify_expires=NULL WHERE id=?', [hash, user.id]);
  res.json({ message: 'Password reset successfully' });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.verified) return res.status(403).json({ error: 'Account not verified', needsVerification: true });
    const token = jwt.sign({ id: user.id, email: user.email, phone: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: user.role });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET profile
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getPool();
    const [rows] = await db.execute('SELECT id, email, phone, role, first_name, last_name FROM users WHERE id=?', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// PUT update profile
router.put('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const { email, phone, first_name, last_name, current_password, new_password } = req.body;
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE id=?', [id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (new_password) {
      if (!current_password || !(await bcrypt.compare(current_password, user.password)))
        return res.status(400).json({ error: 'Current password is incorrect' });
      const hash = await bcrypt.hash(new_password, 10);
      await db.execute('UPDATE users SET password=? WHERE id=?', [hash, id]);
    }
    if (email) await db.execute('UPDATE users SET email=? WHERE id=?', [email, id]);
    if (phone !== undefined) await db.execute('UPDATE users SET phone=? WHERE id=?', [phone || null, id]);
    await db.execute('UPDATE users SET first_name=?, last_name=? WHERE id=?', [first_name || null, last_name || null, id]);
    res.json({ success: true });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// GET addresses
router.get('/addresses', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM user_addresses WHERE user_id=? ORDER BY is_default DESC, id ASC', [id]);
    res.json(rows);
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// POST add address
router.post('/addresses', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const { label, name, address, city, province, country, postal, phone, is_default } = req.body;
    const db = await getPool();
    if (is_default) await db.execute('UPDATE user_addresses SET is_default=0 WHERE user_id=?', [id]);
    const [r] = await db.execute(
      'INSERT INTO user_addresses (user_id, label, name, address, city, province, country, postal, phone, is_default) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, label||'', name||'', address||'', city||'', province||'', country||'', postal||'', phone||'', is_default?1:0]
    );
    res.json({ id: r.insertId });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// PUT update address
router.put('/addresses/:addrId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const { label, name, address, city, province, country, postal, phone, is_default } = req.body;
    const db = await getPool();
    if (is_default) await db.execute('UPDATE user_addresses SET is_default=0 WHERE user_id=?', [id]);
    await db.execute(
      'UPDATE user_addresses SET label=?, name=?, address=?, city=?, province=?, country=?, postal=?, phone=?, is_default=? WHERE id=? AND user_id=?',
      [label||'', name||'', address||'', city||'', province||'', country||'', postal||'', phone||'', is_default?1:0, req.params.addrId, id]
    );
    res.json({ success: true });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// DELETE address
router.delete('/addresses/:addrId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getPool();
    await db.execute('DELETE FROM user_addresses WHERE id=? AND user_id=?', [req.params.addrId, id]);
    res.json({ success: true });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// SET default address
router.put('/addresses/:addrId/default', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getPool();
    await db.execute('UPDATE user_addresses SET is_default=0 WHERE user_id=?', [id]);
    await db.execute('UPDATE user_addresses SET is_default=1 WHERE id=? AND user_id=?', [req.params.addrId, id]);
    res.json({ success: true });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

module.exports = router;

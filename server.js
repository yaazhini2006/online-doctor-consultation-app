const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_super_secret_key_change_in_prod';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/* --- AUTHENTICATION ROUTES --- */

app.post('/auth/register', async (req, res) => {
  const { name, email, password, role, speciality } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (name, email, password, role, speciality) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, role === 'doctor' ? speciality : null],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, message: 'User registered successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, speciality: user.speciality } });
  });
});

/* --- DOCTORS DIRECTORY --- */

app.get('/doctors', (req, res) => {
  db.all(`SELECT id, name, speciality, email FROM users WHERE role = 'doctor'`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* --- APPOINTMENTS ROUTES --- */

app.post('/appointments', authenticateToken, (req, res) => {
  const { doctor_id, date, time } = req.body;
  const patient_id = req.user.id;

  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Only patients can book appointments' });

  db.run(
    `INSERT INTO appointments (patient_id, doctor_id, date, time) VALUES (?, ?, ?, ?)`,
    [patient_id, doctor_id, date, time],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Appointment booked successfully' });
    }
  );
});

app.get('/appointments/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  // Ensure the requesting user is the patient or a doctor fetching their own appointments
  if (req.user.id != userId) return res.status(403).json({ error: 'Unauthorized Access' });

  const isPatient = req.user.role === 'patient';
  const query = isPatient 
    ? `SELECT a.*, u.name as doctor_name, u.speciality FROM appointments a JOIN users u ON a.doctor_id = u.id WHERE a.patient_id = ?`
    : `SELECT a.*, u.name as patient_name FROM appointments a JOIN users u ON a.patient_id = u.id WHERE a.doctor_id = ?`;

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update appointment status (for doctors)
app.put('/appointments/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors can update statuses' });

  db.run(`UPDATE appointments SET status = ? WHERE id = ? AND doctor_id = ?`, [status, id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Appointment not found or unauthorized' });
    res.json({ message: 'Appointment status updated' });
  });
});

/* --- CONSULTATION / CHAT ROUTES --- */

app.post('/consultation/chat', authenticateToken, (req, res) => {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.id;

  db.run(`INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`, [sender_id, receiver_id, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, content, sender_id, receiver_id, timestamp: new Date().toISOString() });
  });
});

app.get('/consultation/chat/:peerId', authenticateToken, (req, res) => {
  const myId = req.user.id;
  const peerId = req.params.peerId;

  db.all(`SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp ASC`, 
  [myId, peerId, peerId, myId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* --- PRESCRIPTION ROUTES --- */

app.post('/prescriptions', authenticateToken, (req, res) => {
  const { appointment_id, patient_id, details } = req.body;
  const doctor_id = req.user.id;

  if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors can write prescriptions' });

  db.run(`INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, details) VALUES (?, ?, ?, ?)`, 
  [appointment_id, patient_id, doctor_id, details], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Prescription added successfully' });
  });
});

app.get('/prescriptions/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  if (req.user.id != userId) return res.status(403).json({ error: 'Unauthorized Access' });

  const query = req.user.role === 'patient'
    ? `SELECT p.*, u.name as doctor_name FROM prescriptions p JOIN users u ON p.doctor_id = u.id WHERE p.patient_id = ?`
    : `SELECT p.*, u.name as patient_name FROM prescriptions p JOIN users u ON p.patient_id = u.id WHERE p.doctor_id = ?`;

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

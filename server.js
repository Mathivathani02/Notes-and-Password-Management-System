const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { router: authRoutes } = require('./routes/authRoutes');
const passwordsRoutes = require('./routes/passwordsRoutes');
const notesRoutes = require('./routes/notesRoutes');
const auditRoutes = require('./routes/auditRoutes');
const app = express();
const PORT = process.env.PORT || 3000;
// Security & Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { success: false, error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/audit', auditRoutes);
// Fallback to index.html for SPA router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔐 Project Notes & Password Manager Server Running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

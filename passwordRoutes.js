const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const cryptoService = require('../services/cryptoService');
const { requireAuth } = require('./authRoutes');
// All password endpoints require vault session auth
router.use(requireAuth);
/**
 * GET /api/passwords
 */
router.get('/', (req, res) => {
  const passwords = storageService.getPasswords(req.masterKey);
  res.json({
    success: true,
    count: passwords.length,
    data: passwords
  });
});
/**
 * POST /api/passwords/generate
 */
router.post('/generate', (req, res) => {
  const options = req.body || {};
  const password = cryptoService.generateRandomPassword(options);
  const strength = cryptoService.evaluateStrength(password);
  res.json({
    success: true,
    data: {
      password,
      strength
    }
  });
});
/**
 * POST /api/passwords
 */
router.post('/', (req, res) => {
  const { title, username, password, url, category, notes, favorite } = req.body;
  if (!title || !password) {
    return res.status(400).json({ success: false, error: 'Title and Password are required fields.' });
  }
  const created = storageService.addPassword(
    { title, username, password, url, category, notes, favorite },
    req.masterKey
  );
  res.status(201).json({
    success: true,
    message: 'Password record saved.',
    data: created
  });
});
/**
 * PUT /api/passwords/:id
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updated = storageService.updatePassword(id, req.body, req.masterKey);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Password record not found.' });
  }
  res.json({
    success: true,
    message: 'Password record updated.',
    data: updated
  });
});
/**
 * DELETE /api/passwords/:id
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const deleted = storageService.deletePassword(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Password record not found.' });
  }
  res.json({
    success: true,
    message: 'Password record deleted.'
  });
});
module.exports = router;

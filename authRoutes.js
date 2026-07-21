const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const cryptoService = require('../services/cryptoService');
// Active volatile sessions: token -> { masterKeyHex, expiresAt }
const sessions = new Map();
function createSession(masterKeyHex) {
  const token = `vlt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  // 1 hour expiration
  const expiresAt = Date.now() + 3600 * 1000;
  sessions.set(token, { masterKeyHex, expiresAt });
  return { token, expiresAt };
}
function getSessionMasterKey(token) {
  if (!token) return null;
  const sess = sessions.get(token);
  if (!sess) return null;
  if (Date.now() > sess.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return sess.masterKeyHex;
}
// Middleware to protect password routes
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-vault-token'];
  let token = authHeader;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  const masterKey = getSessionMasterKey(token);
  if (!masterKey) {
    return res.status(401).json({ success: false, error: 'Vault is locked or session expired. Please authenticate.' });
  }
  req.masterKey = masterKey;
  req.sessionToken = token;
  next();
}
/**
 * GET /api/auth/status
 */
router.get('/status', (req, res) => {
  const status = storageService.getAuthStatus();
  const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : req.headers['x-vault-token'];
  const unlocked = Boolean(token && getSessionMasterKey(token));
  res.json({
    success: true,
    data: {
      initialized: status.initialized,
      unlocked
    }
  });
});
/**
 * POST /api/auth/setup
 * Set initial master password if not initialized
 */
router.post('/setup', (req, res) => {
  const { masterPassword } = req.body;
  if (!masterPassword || masterPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Master password must be at least 6 characters long.' });
  }
  const masterKeyHex = storageService.setMasterPassword(masterPassword);
  const session = createSession(masterKeyHex);
  res.json({
    success: true,
    message: 'Vault initial setup completed successfully.',
    data: session
  });
});
/**
 * POST /api/auth/unlock
 * Unlock vault with master passphrase
 */
router.post('/unlock', (req, res) => {
  const { masterPassword } = req.body;
  if (!masterPassword) {
    return res.status(400).json({ success: false, error: 'Master password is required.' });
  }
  const masterKeyHex = storageService.verifyMasterPassword(masterPassword);
  if (!masterKeyHex) {
    return res.status(401).json({ success: false, error: 'Incorrect master password.' });
  }
  const session = createSession(masterKeyHex);
  res.json({
    success: true,
    message: 'Vault unlocked successfully.',
    data: session
  });
});
/**
 * POST /api/auth/lock
 * Lock vault and destroy volatile session
 */
router.post('/lock', (req, res) => {
  const authHeader = req.headers.authorization || req.headers['x-vault-token'];
  let token = authHeader;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (token && sessions.has(token)) {
    sessions.delete(token);
  }
  storageService.addLog('Vault Locked', 'Session locked manually by user');
  res.json({
    success: true,
    message: 'Vault locked successfully.'
  });
});
module.exports = {
  router,
  requireAuth
};

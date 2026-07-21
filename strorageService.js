const fs = require('fs');
const path = require('path');
const cryptoService = require('./cryptoService');
const DATA_DIR = path.join(__dirname, '..', 'data');
const VAULT_FILE = path.join(DATA_DIR, 'vault.json');
// Default initial master password is 'admin123'
const defaultMasterHash = cryptoService.hashPassword('admin123');
// Sample key derived for encrypting initial sample passwords
const sampleKey = cryptoService.deriveKey('admin123', defaultMasterHash.salt).toString('hex');
const INITIAL_DATA = {
  auth: {
    initialized: true,
    salt: defaultMasterHash.salt,
    hash: defaultMasterHash.hash,
    updatedAt: new Date().toISOString()
  },
  passwords: [
    {
      id: 'pwd-1',
      title: 'GitHub Developer Account',
      username: 'alex.developer@github.com',
      encryptedPassword: cryptoService.encrypt('Git#Hub$ecure2026!', sampleKey),
      url: 'https://github.com',
      category: 'Work',
      notes: 'Contains access tokens for company organization repos.',
      favorite: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'pwd-2',
      title: 'AWS Production Console',
      username: 'cloud-admin@recursion.dev',
      encryptedPassword: cryptoService.encrypt('AwsCloud#99827!', sampleKey),
      url: 'https://aws.amazon.com/console',
      category: 'DevOps',
      notes: 'Requires 2FA via Authenticator app.',
      favorite: true,
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'pwd-3',
      title: 'PostgreSQL Staging DB',
      username: 'pg_admin_staging',
      encryptedPassword: cryptoService.encrypt('pass1234', sampleKey), // Intentionally weak for audit demo
      url: 'postgresql://db.staging.internal:5432',
      category: 'Database',
      notes: 'Staging database credentials for API testing.',
      favorite: false,
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
      id: 'pwd-4',
      title: 'Figma Design System',
      username: 'ux.designer@studio.com',
      encryptedPassword: cryptoService.encrypt('FigmaDesign2026*', sampleKey),
      url: 'https://figma.com',
      category: 'Design',
      notes: 'UI kits and vector icon exports.',
      favorite: false,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: '🚀 Node.js Architecture & API Standard Guidelines',
      category: 'Backend Architecture',
      tags: ['nodejs', 'express', 'rest-api', 'security'],
      pinned: true,
      content: `## Project Architecture Overview
This project implements a clean separation of concerns using Node.js & Express:
### Core Services
- **CryptoService**: Uses \`AES-256-GCM\` with PBKDF2 key derivation for military-grade encryption at rest.
- **StorageService**: File-backed JSON vault with atomic write operations.
\`\`\`js
// Express API Endpoint Example
app.get('/api/passwords', requireAuth, (req, res) => {
  const items = storageService.getPasswords(req.masterKey);
  res.json({ success: true, count: items.length, data: items });
});
\`\`\`
### Security Checklist
- [x] Enforce rate limiting on auth routes
- [x] Sanitize headers with Helmet
- [x] Clear sensitive session data on vault lock`,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'note-2',
      title: '🔒 Encryption & Security Protocol Checklist',
      category: 'Security',
      tags: ['crypto', 'aes-256', 'vault', 'audit'],
      pinned: true,
      content: `### AES-256-GCM Implementation
We use Galois/Counter Mode (GCM) for authenticated encryption. Each password record includes:
1. **Initialization Vector (IV)**: 16 random bytes per payload.
2. **Authentication Tag**: 16 bytes tag guaranteeing message integrity.
3. **Derived Master Key**: PBKDF2 with 100,000 iterations over SHA-256.
> **Warning:** Never hardcode master secrets into client JavaScript files. All decryption keys are held in volatile session memory while unlocked.`,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'note-3',
      title: '⚡ Vanilla JS Component & State Design Pattern',
      category: 'Frontend',
      tags: ['vanillajs', 'css3', 'glassmorphism', 'spa'],
      pinned: false,
      content: `### Frontend Architecture Rules
Our recursion-mentor style web application relies on pure ES modules:
- Zero bundle compile step required.
- Pure DOM manipulation with template literals.
- State events dispatched across UI modules via CustomEvents.
- CSS backdrop-filter glassmorphism with dynamic CSS variable themes.
\`\`\`css
.glass-card {
  background: rgba(18, 24, 38, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
\`\`\``,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      action: 'Vault Initialization',
      details: 'Vault initialized with default security policy',
      timestamp: new Date(Date.now() - 86400000 * 15).toISOString()
    },
    {
      id: 'log-2',
      action: 'Vault Unlocked',
      details: 'Successful master password authentication',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]
};
class StorageService {
  constructor() {
    this.ensureDataDirectory();
    this.vaultData = this.loadVault();
  }
  ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
  loadVault() {
    if (!fs.existsSync(VAULT_FILE)) {
      this.saveVault(INITIAL_DATA);
      return INITIAL_DATA;
    }
    try {
      const fileData = fs.readFileSync(VAULT_FILE, 'utf8');
      return JSON.parse(fileData);
    } catch (err) {
      console.error('Error reading vault file, fallback to initial data:', err.message);
      return INITIAL_DATA;
    }
  }
  saveVault(data = this.vaultData) {
    this.ensureDataDirectory();
    const tempFile = `${VAULT_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, VAULT_FILE);
    this.vaultData = data;
  }
  // AUTH METRICS
  getAuthStatus() {
    return {
      initialized: Boolean(this.vaultData.auth && this.vaultData.auth.hash),
      salt: this.vaultData.auth ? this.vaultData.auth.salt : null,
      updatedAt: this.vaultData.auth ? this.vaultData.auth.updatedAt : null
    };
  }
  setMasterPassword(masterPassword) {
    const { salt, hash } = cryptoService.hashPassword(masterPassword);
    this.vaultData.auth = {
      initialized: true,
      salt,
      hash,
      updatedAt: new Date().toISOString()
    };
    this.addLog('Master Password Set', 'Master passphrase was created/updated');
    this.saveVault();
    return cryptoService.deriveKey(masterPassword, salt).toString('hex');
  }
  verifyMasterPassword(masterPassword) {
    if (!this.vaultData.auth || !this.vaultData.auth.hash) return false;
    const isValid = cryptoService.verifyPassword(
      masterPassword,
      this.vaultData.auth.salt,
      this.vaultData.auth.hash
    );
    if (isValid) {
      this.addLog('Vault Unlocked', 'Master password verified successfully');
      return cryptoService.deriveKey(masterPassword, this.vaultData.auth.salt).toString('hex');
    } else {
      this.addLog('Auth Failed', 'Invalid master password attempt');
      return null;
    }
  }
  // PASSWORDS CRUD
  getPasswords(masterKeyHex) {
    return this.vaultData.passwords.map(item => {
      const plainPassword = cryptoService.decrypt(item.encryptedPassword, masterKeyHex);
      const strength = cryptoService.evaluateStrength(plainPassword);
      return {
        ...item,
        password: plainPassword,
        strength
      };
    });
  }
  addPassword(itemData, masterKeyHex) {
    const { title, username, password, url, category, notes, favorite } = itemData;
    const newId = `pwd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const encryptedPassword = cryptoService.encrypt(password, masterKeyHex);
    const newItem = {
      id: newId,
      title: title || 'Untitled Service',
      username: username || '',
      encryptedPassword,
      url: url || '',
      category: category || 'General',
      notes: notes || '',
      favorite: Boolean(favorite),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.vaultData.passwords.unshift(newItem);
    this.addLog('Password Created', `Added password entry for ${newItem.title}`);
    this.saveVault();
    return {
      ...newItem,
      password,
      strength: cryptoService.evaluateStrength(password)
    };
  }
  updatePassword(id, itemData, masterKeyHex) {
    const index = this.vaultData.passwords.findIndex(p => p.id === id);
    if (index === -1) return null;
    const existing = this.vaultData.passwords[index];
    const newPassword = itemData.password !== undefined ? itemData.password : cryptoService.decrypt(existing.encryptedPassword, masterKeyHex);
    const encryptedPassword = cryptoService.encrypt(newPassword, masterKeyHex);
    const updatedItem = {
      ...existing,
      title: itemData.title !== undefined ? itemData.title : existing.title,
      username: itemData.username !== undefined ? itemData.username : existing.username,
      encryptedPassword,
      url: itemData.url !== undefined ? itemData.url : existing.url,
      category: itemData.category !== undefined ? itemData.category : existing.category,
      notes: itemData.notes !== undefined ? itemData.notes : existing.notes,
      favorite: itemData.favorite !== undefined ? Boolean(itemData.favorite) : existing.favorite,
      updatedAt: new Date().toISOString()
    };
    this.vaultData.passwords[index] = updatedItem;
    this.addLog('Password Updated', `Updated password entry for ${updatedItem.title}`);
    this.saveVault();
    return {
      ...updatedItem,
      password: newPassword,
      strength: cryptoService.evaluateStrength(newPassword)
    };
  }
  deletePassword(id) {
    const index = this.vaultData.passwords.findIndex(p => p.id === id);
    if (index === -1) return false;
    const deleted = this.vaultData.passwords.splice(index, 1)[0];
    this.addLog('Password Deleted', `Removed password entry for ${deleted.title}`);
    this.saveVault();
    return true;
  }
  // NOTES CRUD
  getNotes() {
    return this.vaultData.notes;
  }
  addNote(noteData) {
    const { title, content, category, tags, pinned } = noteData;
    const newId = `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNote = {
      id: newId,
      title: title || 'Untitled Note',
      content: content || '',
      category: category || 'General',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      pinned: Boolean(pinned),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.vaultData.notes.unshift(newNote);
    this.addLog('Note Created', `Created note "${newNote.title}"`);
    this.saveVault();
    return newNote;
  }
  updateNote(id, noteData) {
    const index = this.vaultData.notes.findIndex(n => n.id === id);
    if (index === -1) return null;
    const existing = this.vaultData.notes[index];
    const updatedNote = {
      ...existing,
      title: noteData.title !== undefined ? noteData.title : existing.title,
      content: noteData.content !== undefined ? noteData.content : existing.content,
      category: noteData.category !== undefined ? noteData.category : existing.category,
      tags: noteData.tags !== undefined ? (Array.isArray(noteData.tags) ? noteData.tags : noteData.tags.split(',').map(t => t.trim()).filter(Boolean)) : existing.tags,
      pinned: noteData.pinned !== undefined ? Boolean(noteData.pinned) : existing.pinned,
      updatedAt: new Date().toISOString()
    };
    this.vaultData.notes[index] = updatedNote;
    this.addLog('Note Updated', `Updated note "${updatedNote.title}"`);
    this.saveVault();
    return updatedNote;
  }
  toggleNotePin(id) {
    const note = this.vaultData.notes.find(n => n.id === id);
    if (!note) return null;
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    this.saveVault();
    return note;
  }
  deleteNote(id) {
    const index = this.vaultData.notes.findIndex(n => n.id === id);
    if (index === -1) return false;
    const deleted = this.vaultData.notes.splice(index, 1)[0];
    this.addLog('Note Deleted', `Removed note "${deleted.title}"`);
    this.saveVault();
    return true;
  }
  // AUDIT & LOGS
  getAuditLogs() {
    return this.vaultData.auditLogs || [];
  }
  addLog(action, details) {
    if (!this.vaultData.auditLogs) this.vaultData.auditLogs = [];
    const log = {
      id: `log-${Date.now()}`,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.vaultData.auditLogs.unshift(log);
    // Keep max 50 recent logs
    if (this.vaultData.auditLogs.length > 50) {
      this.vaultData.auditLogs.pop();
    }
  }
}
module.exports = new StorageService();

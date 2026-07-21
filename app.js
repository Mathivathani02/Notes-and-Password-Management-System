import { AuthManager } from './modules/auth.js';
import { PasswordsManager } from './modules/passwords.js';
import { NotesManager } from './modules/notes.js';
import { GeneratorManager } from './modules/generator.js';
import { AuditManager } from './modules/audit.js';
class ToastManager {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    `;
    if (type === 'success') {
      icon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      `;
    } else if (type === 'error') {
      icon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      `;
    }
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}
class AegisApp {
  constructor() {
    this.toast = new ToastManager();
    this.auth = new AuthManager();
    this.passwords = new PasswordsManager(this.auth, this.toast);
    this.notes = new NotesManager(this.auth, this.toast);
    this.generator = new GeneratorManager(this.auth, this.toast);
    this.audit = new AuditManager(this.auth, this.toast);
    this.currentView = 'passwords';
  }
  async init() {
    this.bindNavigation();
    this.bindModals();
    this.bindAuthEvents();
    this.bindGlobalSearch();
    this.generator.init();
    // Check Vault Lock Status
    const status = await this.auth.checkStatus();
    if (!status.unlocked) {
      this.showLockScreen();
    } else {
      this.hideLockScreen();
      await this.loadCurrentViewData();
    }
  }
  showLockScreen() {
    const lockModal = document.getElementById('lock-modal');
    if (lockModal) lockModal.classList.add('active');
    const pulseEl = document.getElementById('status-pulse');
    const textEl = document.getElementById('vault-status-text');
    if (pulseEl) pulseEl.className = 'pulse-dot red';
    if (textEl) textEl.textContent = 'Vault Locked';
  }
  hideLockScreen() {
    const lockModal = document.getElementById('lock-modal');
    if (lockModal) lockModal.classList.remove('active');
    const pulseEl = document.getElementById('status-pulse');
    const textEl = document.getElementById('vault-status-text');
    if (pulseEl) pulseEl.className = 'pulse-dot green';
    if (textEl) textEl.textContent = 'Vault Unlocked';
  }
  bindAuthEvents() {
    const unlockForm = document.getElementById('form-unlock');
    if (unlockForm) {
      unlockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const passInput = document.getElementById('input-master-pass');
        const password = passInput.value.trim();
        if (!password) return;
        const res = await this.auth.unlock(password);
        if (res.success) {
          passInput.value = '';
          this.hideLockScreen();
          this.toast.show('Vault unlocked successfully!', 'success');
          await this.loadCurrentViewData();
        } else {
          this.toast.show(res.error || 'Incorrect master passphrase.', 'error');
        }
      });
    }
    const lockBtn = document.getElementById('btn-lock-vault');
    if (lockBtn) {
      lockBtn.addEventListener('click', async () => {
        await this.auth.lock();
        this.showLockScreen();
        this.toast.show('Vault session locked.', 'info');
      });
    }
  }
  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        this.switchView(view);
      });
    });
    // Category Pill Filters for Passwords
    const pwdPills = document.querySelectorAll('#pwd-category-filters .pill');
    pwdPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pwdPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const cat = e.currentTarget.getAttribute('data-cat');
        this.passwords.setCategoryFilter(cat);
      });
    });
    // Global Add Button
    const globalAddBtn = document.getElementById('btn-global-add');
    if (globalAddBtn) {
      globalAddBtn.addEventListener('click', () => {
        if (this.currentView === 'notes') {
          this.notes.openEditModal();
        } else {
          this.passwords.openEditModal();
        }
      });
    }
    // New Note Button in Notes View
    const newNoteBtn = document.getElementById('btn-new-note');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => this.notes.openEditModal());
    }
    // Edit Current Note Button in Detail Modal
    const editCurrNoteBtn = document.getElementById('btn-edit-current-note');
    if (editCurrNoteBtn) {
      editCurrNoteBtn.addEventListener('click', () => {
        document.getElementById('note-detail-modal').classList.remove('active');
        if (this.notes.currentNote) {
          this.notes.openEditModal(this.notes.currentNote);
        }
      });
    }
  }
  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });
    const addLabelEl = document.getElementById('btn-add-label');
    if (addLabelEl) {
      addLabelEl.textContent = viewName === 'notes' ? 'New Note' : 'New Password';
    }
    this.loadCurrentViewData();
  }
  async loadCurrentViewData() {
    if (!this.auth.unlocked) return;
    if (this.currentView === 'passwords') {
      await this.passwords.fetchPasswords();
      this.passwords.render();
    } else if (this.currentView === 'notes') {
      await this.notes.fetchNotes();
      this.notes.render();
    } else if (this.currentView === 'audit') {
      await this.audit.fetchAndRender();
    }
  }
  bindGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (this.currentView === 'notes') {
          this.notes.setSearchQuery(query);
        } else {
          this.passwords.setSearchQuery(query);
        }
      });
    }
    // Shortcut: Ctrl + K focus search
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });
  }
  bindModals() {
    // Modal Close Triggers
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close');
        const modalEl = document.getElementById(modalId);
        if (modalEl) modalEl.classList.remove('active');
      });
    });
    // Password Form Submit
    const formPwd = document.getElementById('form-pwd');
    if (formPwd) {
      formPwd.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
          id: document.getElementById('pwd-id').value,
          title: document.getElementById('pwd-title').value.trim(),
          username: document.getElementById('pwd-username').value.trim(),
          password: document.getElementById('pwd-password').value,
          category: document.getElementById('pwd-category').value,
          url: document.getElementById('pwd-url').value.trim(),
          notes: document.getElementById('pwd-notes').value.trim()
        };
        const success = await this.passwords.savePassword(formData);
        if (success) {
          document.getElementById('pwd-modal').classList.remove('active');
        }
      });
    }
    // Password Form Quick Generator Button
    const pwdGenFillBtn = document.getElementById('pwd-gen-fill');
    if (pwdGenFillBtn) {
      pwdGenFillBtn.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/passwords/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.auth.getToken()}`
            },
            body: JSON.stringify({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true })
          });
          const result = await res.json();
          if (result.success && result.data) {
            const passInput = document.getElementById('pwd-password');
            passInput.value = result.data.password;
            passInput.type = 'text';
            this.toast.show('Generated 16-char random password!', 'info');
          }
        } catch (err) {
          console.error('Password generation error:', err);
        }
      });
    }
    // Password Form Toggle Visibility Button
    const pwdToggleVisBtn = document.getElementById('pwd-toggle-vis');
    if (pwdToggleVisBtn) {
      pwdToggleVisBtn.addEventListener('click', () => {
        const passInput = document.getElementById('pwd-password');
        passInput.type = passInput.type === 'password' ? 'text' : 'password';
      });
    }
    // Note Form Submit
    const formNote = document.getElementById('form-note');
    if (formNote) {
      formNote.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
          id: document.getElementById('note-id').value,
          title: document.getElementById('note-title').value.trim(),
          category: document.getElementById('note-category').value.trim(),
          tags: document.getElementById('note-tags').value.trim(),
          content: document.getElementById('note-content').value
        };
        const success = await this.notes.saveNote(formData);
        if (success) {
          document.getElementById('note-modal').classList.remove('active');
        }
      });
    }
  }
}
// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const app = new AegisApp();
  app.init();
});

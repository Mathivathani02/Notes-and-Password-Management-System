/**
 * Passwords Module — Vault CRUD & UI Controller
 */
export class PasswordsManager {
  constructor(authManager, toastManager) {
    this.auth = authManager;
    this.toast = toastManager;
    this.passwords = [];
    this.activeCategory = 'ALL';
    this.searchQuery = '';
  }
  async fetchPasswords() {
    try {
      const res = await fetch('/api/passwords', {
        headers: { 'Authorization': `Bearer ${this.auth.getToken()}` }
      });
      const result = await res.json();
      if (result.success) {
        this.passwords = result.data;
        return this.passwords;
      } else {
        this.toast.show(result.error || 'Failed to fetch passwords', 'error');
        return [];
      }
    } catch (err) {
      this.toast.show('Network error while loading passwords', 'error');
      return [];
    }
  }
  setCategoryFilter(category) {
    this.activeCategory = category;
    this.render();
  }
  setSearchQuery(query) {
    this.searchQuery = query.toLowerCase();
    this.render();
  }
  getFilteredPasswords() {
    return this.passwords.filter(item => {
      const matchesCat = this.activeCategory === 'ALL' || item.category === this.activeCategory;
      const matchesSearch = !this.searchQuery || 
        item.title.toLowerCase().includes(this.searchQuery) ||
        (item.username && item.username.toLowerCase().includes(this.searchQuery)) ||
        (item.url && item.url.toLowerCase().includes(this.searchQuery)) ||
        (item.notes && item.notes.toLowerCase().includes(this.searchQuery));
      return matchesCat && matchesSearch;
    });
  }
  render() {
    const gridEl = document.getElementById('passwords-grid');
    const navCountEl = document.getElementById('nav-pwd-count');
    if (!gridEl) return;
    const filtered = this.getFilteredPasswords();
    if (navCountEl) navCountEl.textContent = this.passwords.length;
    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <h3 style="margin-top: 1rem;">No Password Entries Found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.4rem;">Try adjusting your category filter or create a new password entry.</p>
        </div>
      `;
      return;
    }
    gridEl.innerHTML = filtered.map(item => {
      const maskedPwd = '•'.repeat(Math.min(12, item.password.length));
      const strengthColor = item.strength ? item.strength.color : '#10B981';
      const strengthScore = item.strength ? item.strength.score : 80;
      return `
        <div class="glass-card pwd-card" data-id="${item.id}">
          <div class="pwd-card-header">
            <div class="pwd-title-box">
              <h3>${this.escapeHtml(item.title)}</h3>
              <div class="pwd-meta">${this.escapeHtml(item.username || 'No Username')} • <span style="color: var(--color-primary);">${this.escapeHtml(item.category)}</span></div>
            </div>
            <div class="pwd-actions">
              <button class="btn btn-secondary btn-icon btn-edit-pwd" data-id="${item.id}" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn btn-secondary btn-icon btn-delete-pwd" data-id="${item.id}" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <div class="pwd-field-group">
            <span class="pwd-value" id="pwd-val-${item.id}" data-real="${this.escapeHtml(item.password)}">${maskedPwd}</span>
            <div style="display: flex; gap: 0.3rem;">
              <button class="btn btn-secondary btn-icon btn-toggle-show" data-id="${item.id}" title="Show / Hide">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="btn btn-primary btn-icon btn-copy-pwd" data-pwd="${this.escapeHtml(item.password)}" title="Copy Password">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
          <div class="strength-bar" title="Password Strength: ${item.strength ? item.strength.label : ''}">
            <div class="strength-progress" style="width: ${strengthScore}%; background: ${strengthColor};"></div>
          </div>
          ${item.notes ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.75rem;">${this.escapeHtml(item.notes)}</p>` : ''}
        </div>
      `;
    }).join('');
    this.bindEvents();
  }
  bindEvents() {
    // Copy Password Buttons
    document.querySelectorAll('.btn-copy-pwd').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const password = e.currentTarget.getAttribute('data-pwd');
        navigator.clipboard.writeText(password).then(() => {
          this.toast.show('Password copied to clipboard! (Auto-clears in 30s)', 'success');
        });
      });
    });
    // Toggle Show/Hide Password
    document.querySelectorAll('.btn-toggle-show').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const valEl = document.getElementById(`pwd-val-${id}`);
        if (!valEl) return;
        const realPwd = valEl.getAttribute('data-real');
        const isMasked = valEl.textContent.includes('•');
        if (isMasked) {
          valEl.textContent = realPwd;
          valEl.style.color = 'var(--color-primary)';
        } else {
          valEl.textContent = '•'.repeat(Math.min(12, realPwd.length));
          valEl.style.color = 'inherit';
        }
      });
    });
    // Edit Password Buttons
    document.querySelectorAll('.btn-edit-pwd').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = this.passwords.find(p => p.id === id);
        if (item) this.openEditModal(item);
      });
    });
    // Delete Password Buttons
    document.querySelectorAll('.btn-delete-pwd').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this password entry?')) {
          await this.deletePassword(id);
        }
      });
    });
  }
  async savePassword(formData) {
    const isEdit = Boolean(formData.id);
    const url = isEdit ? `/api/passwords/${formData.id}` : '/api/passwords';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.getToken()}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        this.toast.show(isEdit ? 'Password entry updated.' : 'New password saved.', 'success');
        await this.fetchPasswords();
        this.render();
        return true;
      } else {
        this.toast.show(result.error || 'Failed to save password', 'error');
        return false;
      }
    } catch (err) {
      this.toast.show('Network error while saving password', 'error');
      return false;
    }
  }
  async deletePassword(id) {
    try {
      const res = await fetch(`/api/passwords/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.auth.getToken()}` }
      });
      const result = await res.json();
      if (result.success) {
        this.toast.show('Password entry deleted.', 'success');
        await this.fetchPasswords();
        this.render();
      } else {
        this.toast.show(result.error || 'Failed to delete password', 'error');
      }
    } catch (err) {
      this.toast.show('Network error while deleting password', 'error');
    }
  }
  openEditModal(item = null) {
    const modalEl = document.getElementById('pwd-modal');
    const titleEl = document.getElementById('pwd-modal-title');
    if (!modalEl) return;
    if (item) {
      titleEl.textContent = 'Edit Password Entry';
      document.getElementById('pwd-id').value = item.id;
      document.getElementById('pwd-title').value = item.title;
      document.getElementById('pwd-username').value = item.username || '';
      document.getElementById('pwd-password').value = item.password || '';
      document.getElementById('pwd-category').value = item.category || 'Work';
      document.getElementById('pwd-url').value = item.url || '';
      document.getElementById('pwd-notes').value = item.notes || '';
    } else {
      titleEl.textContent = 'New Password Entry';
      document.getElementById('form-pwd').reset();
      document.getElementById('pwd-id').value = '';
    }
    modalEl.classList.add('active');
  }
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }
}

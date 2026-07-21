/**
 * Notes Module — Project Notes CRUD & Markdown Renderer
 */
export class NotesManager {
  constructor(authManager, toastManager) {
    this.auth = authManager;
    this.toast = toastManager;
    this.notes = [];
    this.activeTag = null;
    this.searchQuery = '';
    this.currentNote = null;
  }
  async fetchNotes() {
    try {
      const res = await fetch('/api/notes', {
        headers: { 'Authorization': `Bearer ${this.auth.getToken()}` }
      });
      const result = await res.json();
      if (result.success) {
        this.notes = result.data;
        return this.notes;
      } else {
        this.toast.show(result.error || 'Failed to fetch project notes', 'error');
        return [];
      }
    } catch (err) {
      this.toast.show('Network error while loading notes', 'error');
      return [];
    }
  }
  setTagFilter(tag) {
    this.activeTag = tag === this.activeTag ? null : tag;
    this.render();
  }
  setSearchQuery(query) {
    this.searchQuery = query.toLowerCase();
    this.render();
  }
  getFilteredNotes() {
    return this.notes.filter(note => {
      const matchesTag = !this.activeTag || (note.tags && note.tags.includes(this.activeTag));
      const matchesSearch = !this.searchQuery ||
        note.title.toLowerCase().includes(this.searchQuery) ||
        (note.content && note.content.toLowerCase().includes(this.searchQuery)) ||
        (note.category && note.category.toLowerCase().includes(this.searchQuery)) ||
        (note.tags && note.tags.some(t => t.toLowerCase().includes(this.searchQuery)));
      return matchesTag && matchesSearch;
    });
  }
  render() {
    const gridEl = document.getElementById('notes-grid');
    const tagsCloudEl = document.getElementById('tags-cloud-container');
    const navCountEl = document.getElementById('nav-notes-count');
    if (!gridEl) return;
    if (navCountEl) navCountEl.textContent = this.notes.length;
    // Build Tags Cloud
    this.renderTagsCloud(tagsCloudEl);
    const filtered = this.getFilteredNotes();
    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h3 style="margin-top: 1rem;">No Notes Found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.4rem;">Create a new project note or clear tag search filters.</p>
        </div>
      `;
      return;
    }
    gridEl.innerHTML = filtered.map(note => {
      const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `
        <div class="glass-card note-card ${note.pinned ? 'pinned' : ''}" data-id="${note.id}">
          ${note.pinned ? `
            <div class="pin-icon" title="Pinned Note">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
            </div>
          ` : ''}
          <div>
            <div style="display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge" style="background: var(--color-primary-glow); color: var(--color-primary);">${this.escapeHtml(note.category || 'General')}</span>
            </div>
            <h3 style="font-size: 1.1rem; font-weight: 600;">${this.escapeHtml(note.title)}</h3>
            <div class="note-preview-content">${this.escapeHtml(note.content.substring(0, 150))}...</div>
          </div>
          <div>
            <div style="display: flex; gap: 0.3rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              ${(note.tags || []).map(t => `<span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.1rem 0.4rem; border-radius: 4px;">#${this.escapeHtml(t)}</span>`).join('')}
            </div>
            <div class="note-card-footer">
              <span>Updated ${formattedDate}</span>
              <div style="display: flex; gap: 0.3rem;" onclick="event.stopPropagation();">
                <button class="btn btn-secondary btn-icon btn-pin-note" data-id="${note.id}" title="${note.pinned ? 'Unpin' : 'Pin to top'}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                </button>
                <button class="btn btn-secondary btn-icon btn-delete-note" data-id="${note.id}" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    this.bindEvents();
  }
  renderTagsCloud(containerEl) {
    if (!containerEl) return;
    const tagCounts = new Map();
    this.notes.forEach(n => {
      (n.tags || []).forEach(t => {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      });
    });
    if (tagCounts.size === 0) {
      containerEl.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-subtle);">No tags created yet</span>';
      return;
    }
    let html = '';
    tagCounts.forEach((count, tag) => {
      const isActive = this.activeTag === tag;
      html += `
        <div class="tag-item ${isActive ? 'active' : ''}" data-tag="${this.escapeHtml(tag)}">
          <span># ${this.escapeHtml(tag)}</span>
          <span style="font-size: 0.75rem; opacity: 0.7;">${count}</span>
        </div>
      `;
    });
    containerEl.innerHTML = html;
    containerEl.querySelectorAll('.tag-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const tag = e.currentTarget.getAttribute('data-tag');
        this.setTagFilter(tag);
      });
    });
  }
  bindEvents() {
    // Note Card Click -> Open Detail Modal
    document.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const note = this.notes.find(n => n.id === id);
        if (note) this.openDetailModal(note);
      });
    });
    // Pin Note Buttons
    document.querySelectorAll('.btn-pin-note').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        await this.togglePin(id);
      });
    });
    // Delete Note Buttons
    document.querySelectorAll('.btn-delete-note').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this project note?')) {
          await this.deleteNote(id);
        }
      });
    });
  }
  async saveNote(formData) {
    const isEdit = Boolean(formData.id);
    const url = isEdit ? `/api/notes/${formData.id}` : '/api/notes';
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
        this.toast.show(isEdit ? 'Note updated.' : 'New note created.', 'success');
        await this.fetchNotes();
        this.render();
        return true;
      } else {
        this.toast.show(result.error || 'Failed to save note', 'error');
        return false;
      }
    } catch (err) {
      this.toast.show('Network error while saving note', 'error');
      return false;
    }
  }
  async togglePin(id) {
    try {
      const res = await fetch(`/api/notes/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${this.auth.getToken()}` }
      });
      const result = await res.json();
      if (result.success) {
        await this.fetchNotes();
        this.render();
      }
    } catch (err) {
      this.toast.show('Network error toggling pin state', 'error');
    }
  }
  async deleteNote(id) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.auth.getToken()}` }
      });
      const result = await res.json();
      if (result.success) {
        this.toast.show('Note deleted.', 'success');
        await this.fetchNotes();
        this.render();
      } else {
        this.toast.show(result.error || 'Failed to delete note', 'error');
      }
    } catch (err) {
      this.toast.show('Network error deleting note', 'error');
    }
  }
  openEditModal(note = null) {
    const modalEl = document.getElementById('note-modal');
    const titleEl = document.getElementById('note-modal-title');
    if (!modalEl) return;
    if (note) {
      titleEl.textContent = 'Edit Project Note';
      document.getElementById('note-id').value = note.id;
      document.getElementById('note-title').value = note.title;
      document.getElementById('note-category').value = note.category || '';
      document.getElementById('note-tags').value = (note.tags || []).join(', ');
      document.getElementById('note-content').value = note.content || '';
    } else {
      titleEl.textContent = 'Create Project Note';
      document.getElementById('form-note').reset();
      document.getElementById('note-id').value = '';
    }
    modalEl.classList.add('active');
  }
  openDetailModal(note) {
    this.currentNote = note;
    const modalEl = document.getElementById('note-detail-modal');
    if (!modalEl) return;
    document.getElementById('detail-note-title').textContent = note.title;
    document.getElementById('detail-note-cat').textContent = note.category || 'General';
    document.getElementById('detail-note-date').textContent = `Updated ${new Date(note.updatedAt || note.createdAt).toLocaleDateString()}`;
    const tagsContainer = document.getElementById('detail-note-tags');
    tagsContainer.innerHTML = (note.tags || []).map(t => `<span class="badge">#${this.escapeHtml(t)}</span>`).join('');
    const contentEl = document.getElementById('detail-note-content');
    contentEl.innerHTML = this.parseMarkdown(note.content);
    modalEl.classList.add('active');
  }
  parseMarkdown(content) {
    if (!content) return '';
    let parsed = this.escapeHtml(content);
    // Code blocks ```js ... ```
    parsed = parsed.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });
    // Inline code `code`
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Headings # ## ###
    parsed = parsed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    parsed = parsed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    parsed = parsed.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Bold **text**
    parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Bullet lists - item
    parsed = parsed.replace(/^\- (.*$)/gim, '<li>$1</li>');
    // Paragraph breaks
    parsed = parsed.replace(/\n\n/g, '<br><br>');
    return parsed;
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

/**
 * Security Audit Module — Vault Health Metrics & Analysis
 */
export class AuditManager {
  constructor(authManager, toastManager) {
    this.auth = authManager;
    this.toast = toastManager;
  }
  async fetchAndRender() {
    try {
      const res = await fetch('/api/audit', {
        headers: { 'Authorization': `Bearer ${this.auth.getToken()}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        this.render(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch security audit metrics:', err);
    }
  }
  render(data) {
    const { metrics, recommendations, logs } = data;
    // Metrics Counters
    document.getElementById('metric-total-pwd').textContent = metrics.totalPasswords;
    document.getElementById('metric-strong-pwd').textContent = metrics.strongCount;
    document.getElementById('metric-weak-pwd').textContent = metrics.weakCount;
    document.getElementById('metric-reused-pwd').textContent = metrics.reusedCount;
    // Health Score Ring
    const scoreNumEl = document.getElementById('audit-score-num');
    const ringEl = document.getElementById('audit-score-ring');
    const titleEl = document.getElementById('audit-score-title');
    const descEl = document.getElementById('audit-score-desc');
    const dotEl = document.getElementById('audit-dot');
    if (scoreNumEl) scoreNumEl.textContent = metrics.healthScore;
    let scoreColor = '#10B981'; // Green
    let statusText = 'Vault Security Status: Excellent';
    if (metrics.healthScore < 60) {
      scoreColor = '#EF4444'; // Red
      statusText = 'Vault Security Status: Critical Warning';
      if (dotEl) dotEl.className = 'status-dot red';
    } else if (metrics.healthScore < 80) {
      scoreColor = '#F59E0B'; // Amber
      statusText = 'Vault Security Status: Moderate Risk';
      if (dotEl) dotEl.className = 'status-dot amber';
    } else {
      if (dotEl) dotEl.className = 'status-dot green';
    }
    if (ringEl) {
      ringEl.style.borderColor = scoreColor;
      ringEl.style.boxShadow = `0 0 25px ${scoreColor}40`;
    }
    if (titleEl) titleEl.textContent = statusText;
    if (descEl) descEl.textContent = `Average Password Entropy Score: ${metrics.averageStrengthScore}/100 across ${metrics.totalPasswords} accounts.`;
    // Recommendations List
    const recListEl = document.getElementById('audit-recommendations');
    if (recListEl) {
      recListEl.innerHTML = recommendations.map(rec => `<li>${this.escapeHtml(rec)}</li>`).join('');
    }
    // Audit Logs Timeline
    const logsListEl = document.getElementById('audit-logs-list');
    if (logsListEl) {
      logsListEl.innerHTML = logs.map(log => {
        const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="log-item">
            <div>
              <strong style="color: var(--color-primary);">${this.escapeHtml(log.action)}</strong>
              <div style="color: var(--text-muted); font-size: 0.78rem;">${this.escapeHtml(log.details)}</div>
            </div>
            <span style="color: var(--text-subtle);">${timeStr}</span>
          </div>
        `;
      }).join('');
    }
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

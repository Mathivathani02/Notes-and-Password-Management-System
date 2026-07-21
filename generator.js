/**
 * Password Generator Module — Interactive Entropy & Rule Engine
 */
export class GeneratorManager {
  constructor(authManager, toastManager) {
    this.auth = authManager;
    this.toast = toastManager;
  }
  init() {
    this.bindEvents();
    this.generate();
  }
  bindEvents() {
    const rangeInput = document.getElementById('gen-length');
    const rangeValEl = document.getElementById('gen-len-val');
    if (rangeInput && rangeValEl) {
      rangeInput.addEventListener('input', (e) => {
        rangeValEl.textContent = e.target.value;
        this.generate();
      });
    }
    const checkboxes = ['gen-opt-upper', 'gen-opt-lower', 'gen-opt-numbers', 'gen-opt-symbols'];
    checkboxes.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.generate());
      }
    });
    const refreshBtn = document.getElementById('btn-gen-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.generate());
    }
    const copyBtn = document.getElementById('btn-gen-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const inputEl = document.getElementById('gen-result');
        if (inputEl && inputEl.value) {
          navigator.clipboard.writeText(inputEl.value).then(() => {
            this.toast.show('Generated password copied to clipboard!', 'success');
          });
        }
      });
    }
  }
  async generate() {
    const length = parseInt(document.getElementById('gen-length').value, 10) || 16;
    const uppercase = document.getElementById('gen-opt-upper').checked;
    const lowercase = document.getElementById('gen-opt-lower').checked;
    const numbers = document.getElementById('gen-opt-numbers').checked;
    const symbols = document.getElementById('gen-opt-symbols').checked;
    try {
      const res = await fetch('/api/passwords/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.getToken()}`
        },
        body: JSON.stringify({ length, uppercase, lowercase, numbers, symbols })
      });
      const result = await res.json();
      if (result.success && result.data) {
        this.updateUI(result.data.password, result.data.strength);
      }
    } catch (err) {
      console.error('Password generation error:', err);
    }
  }
  updateUI(password, strength) {
    const resultInput = document.getElementById('gen-result');
    const fillEl = document.getElementById('gen-strength-fill');
    const labelEl = document.getElementById('gen-strength-label');
    if (resultInput) resultInput.value = password;
    if (fillEl && strength) {
      fillEl.style.width = `${strength.score}%`;
      fillEl.style.background = strength.color;
    }
    if (labelEl && strength) {
      labelEl.textContent = `Strength: ${strength.label} (${strength.score}/100 Score)`;
    }
  }
}

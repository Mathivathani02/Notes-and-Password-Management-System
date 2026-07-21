/**
 * Auth Module — Vault Unlock & Session Manager
 */
export class AuthManager {
  constructor() {
    this.sessionToken = sessionStorage.getItem('vault_token') || null;
    this.unlocked = false;
  }
  getToken() {
    return this.sessionToken;
  }
  setToken(token) {
    this.sessionToken = token;
    if (token) {
      sessionStorage.setItem('vault_token', token);
      this.unlocked = true;
    } else {
      sessionStorage.removeItem('vault_token');
      this.unlocked = false;
    }
  }
  async checkStatus() {
    try {
      const headers = {};
      if (this.sessionToken) {
        headers['Authorization'] = `Bearer ${this.sessionToken}`;
      }
      const res = await fetch('/api/auth/status', { headers });
      const data = await res.json();
      
      if (data.success) {
        this.unlocked = data.data.unlocked;
        return data.data;
      }
      return { initialized: true, unlocked: false };
    } catch (err) {
      console.error('Auth status check failed:', err);
      return { initialized: true, unlocked: false };
    }
  }
  async unlock(masterPassword) {
    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterPassword })
      });
      const result = await res.json();
      if (result.success && result.data.token) {
        this.setToken(result.data.token);
        return { success: true };
      }
      return { success: false, error: result.error || 'Unlock failed' };
    } catch (err) {
      return { success: false, error: 'Network error during unlock' };
    }
  }
  async lock() {
    if (this.sessionToken) {
      try {
        await fetch('/api/auth/lock', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.sessionToken}` }
        });
      } catch (err) {
        console.error('Lock API request error:', err);
      }
    }
    this.setToken(null);
  }
}

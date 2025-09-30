import { signal } from '@angular/core';

const API_BASE = (window as any).__env?.API_BASE || 'http://localhost:3000/api/auth';

export const authUser = signal<{ id: number; email: string } | null>(null);

export const authService = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    let data: any = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const msg = (data && data.message) || (typeof data === 'string' ? data : null) || await res.text().catch(() => 'Login failed');
      throw new Error(msg);
    }
    const dataJson = data || {};
    authUser.set({ id: dataJson.id, email: dataJson.email });
    return dataJson;
  },
  async register(email: string, password: string) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    let dataR: any = null;
    try { dataR = await res.json(); } catch (e) { dataR = null; }
    if (!res.ok) {
      const msg = (dataR && dataR.message) || (typeof dataR === 'string' ? dataR : null) || await res.text().catch(() => 'Register failed');
      throw new Error(msg);
    }
    const dataJsonR = dataR || {};
    // No establecer el usuario como logueado después del registro
    // authUser.set({ id: dataJsonR.id, email: dataJsonR.email });
    return dataJsonR;
  },
  logout() {
    authUser.set(null);
  }
};

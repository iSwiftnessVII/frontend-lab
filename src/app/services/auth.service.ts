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
      let msg = (data && data.message) || (typeof data === 'string' ? data : null) || await res.text().catch(() => 'Error al iniciar sesión');
      // Mapeo de mensajes en inglés a español (robustez si backend aún responde en EN)
      if (msg === 'Missing email or password') msg = 'Falta correo o contraseña';
      if (msg === 'Invalid credentials') msg = 'Credenciales inválidas';
      if (msg === 'Internal server error') msg = 'Error interno del servidor';
      throw new Error(msg || 'Error al iniciar sesión');
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
      let msg = (dataR && dataR.message) || (typeof dataR === 'string' ? dataR : null) || await res.text().catch(() => 'Error al registrar');
      if (msg === 'Missing email or password') msg = 'Falta correo o contraseña';
      if (msg === 'User already exists') msg = 'El usuario ya existe';
      if (msg === 'Internal server error') msg = 'Error interno del servidor';
      throw new Error(msg || 'Error al registrar');
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

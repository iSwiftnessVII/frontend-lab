import { signal } from '@angular/core';
const API_BASE = (window as any).__env?.API_BASE || 'http://localhost:3000/api/auth';

export const authUser = signal<{ id: number; email: string } | null>(null);
export const authInitializing = signal(false);

export const authService = {
  async login(email: string, contrasena: string) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contrasena })
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if (!res.ok) {
      let msg =
        (data && data.message) ||
        (typeof data === 'string' ? data : null) ||
        (await res.text().catch(() => 'Error al iniciar sesión'));
      if (msg === 'Missing email or contrasena') msg = 'Falta correo o contraseña';
      if (msg === 'Invalid credentials') msg = 'Credenciales inválidas';
      if (msg === 'Internal server error') msg = 'Error interno del servidor';
      throw new Error(msg || 'Error al iniciar sesión');
    }

    const dataJson = data || {};

    // Guarda< el token en localStorage
    if (dataJson.token) {
      localStorage.setItem('token', dataJson.token);
    }

    // Guarda los datos del usuario en memoria
    authUser.set({ id: dataJson.id, email: dataJson.email });
    return dataJson;
  },

  async register(email: string, contrasena: string) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contrasena })
    });

    let dataR: any = null;
    try {
      dataR = await res.json();
    } catch (e) {
      dataR = null;
    }

    if (!res.ok) {
      let msg =
        (dataR && dataR.message) ||
        (typeof dataR === 'string' ? dataR : null) ||
        (await res.text().catch(() => 'Error al registrar'));
      if (msg === 'Missing email or contrasena') msg = 'Falta correo o contraseña';
      if (msg === 'User already exists') msg = 'El usuario ya existe';
      if (msg === 'Internal server error') msg = 'Error interno del servidor';
      throw new Error(msg || 'Error al registrar');
    }

    const dataJsonR = dataR || {};
    return dataJsonR;
  },

  logout() {
    // Elimina el token y limpia la sesión
    localStorage.removeItem('token');
    authUser.set(null);
  },

  // Devuelve el token guardado (por si lo necesitas en otras peticiones)
  getToken() {
    return localStorage.getItem('token');
  }
  ,
  async whoami() {
    const token = this.getToken();
    authInitializing.set(true);
    if (!token) {
      authInitializing.set(false);
      throw new Error('No token');
    }
    let res: Response | null = null;
    try {
      console.debug('[auth] whoami: token present, calling /me');
      res = await fetch(`${API_BASE}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      console.debug('[auth] whoami: response status', res.status);
    } catch (fetchErr) {
      // Network / CORS / server down — treat as temporary offline: keep token and
      // create a minimal authUser so UI (header/nav) remains visible.
      console.warn('[auth] whoami fetch failed (network). Leaving token in place and showing UI optimistically.', fetchErr);
      authUser.set({ id: 0, email: '' });
      authInitializing.set(false);
      return null;
    }
    try {
      if (!res.ok) {
        // token invalid or expired — clear and error
        localStorage.removeItem('token');
        authUser.set(null);
        let msg = await res.text().catch(() => 'Unknown error');
        throw new Error(msg || 'Failed to validate token');
      }

      const data = await res.json().catch(() => null);
      if (!data || !data.id) {
        localStorage.removeItem('token');
        authUser.set(null);
        throw new Error('Invalid response from auth/me');
      }

      authUser.set({ id: data.id, email: data.email });
      return data;
    } finally {
      authInitializing.set(false);
    }
  }
};

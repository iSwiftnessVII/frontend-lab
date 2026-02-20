import { signal } from '@angular/core';

function getApiBase(): string {
  const apiBase = (window as any).__env?.API_AUTH;
  if (typeof apiBase === 'string' && apiBase.trim()) return apiBase.trim();
  const root = (window as any).__env?.API_BASE;
  if (typeof root === 'string' && root.trim()) return `${root.trim().replace(/\/+$/g, '')}/auth`;
  return 'http://localhost:42420/api/auth';
}

export const authUser = signal<{ 
  id: number; 
  email: string; 
  rol: string;
  id_rol: number;
  nombre?: string;
} | null>(null);

// Mantener authInitializing del repositorio para compatibilidad UI
export const authInitializing = signal(false);
const auxPerms = signal<Record<string, boolean> | null>(null);
let auxPermsUserId: number | null = null;

function getUsuariosApiBase(): string {
  const apiBase = (window as any).__env?.API_USUARIOS;
  if (typeof apiBase === 'string' && apiBase.trim()) return apiBase.trim();
  return 'http://localhost:42420/api/usuarios';
}

export const authService = {
  async login(email: string, contrasena: string) {
    const res = await fetch(`${getApiBase()}/login`, {
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
      let msg = (data && data.message) || 'Error al iniciar sesión';
      throw new Error(msg);
    }

    const dataJson = data || {};

    // Guardar token JWT en localStorage
    if (dataJson.token) {
      localStorage.setItem('token', dataJson.token);
    }

    // Guardar usuario en memoria y localStorage
    const userData = {
      id: dataJson.id_usuario, 
      email: dataJson.email,
      rol: dataJson.rol,
      id_rol: dataJson.id_rol,
      nombre: dataJson.nombre
    };
    
    authUser.set(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    await this.loadAuxPerms();

    return dataJson;
  },

  // TU sistema - Verificar autenticación al cargar la app
  async checkAuth() {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      this.logout();
      return null;
    }

    try {
      const res = await fetch(`${getApiBase()}/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const user = await res.json();
        authUser.set(user);
        await this.loadAuxPerms();
        return user;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      this.logout();
      return null;
    }
  },

  // whoami - función del repositorio (para compatibilidad)
  async whoami() {
    authInitializing.set(true);
    const token = this.getToken();
    
    if (!token) {
      authInitializing.set(false);
      throw new Error('No token');
    }

    try {
      const res = await fetch(`${getApiBase()}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        localStorage.removeItem('token');
        authUser.set(null);
        throw new Error('Failed to validate token');
      }

      const data = await res.json();
      if (!data || !data.id) {
        localStorage.removeItem('token');
        authUser.set(null);
        throw new Error('Invalid response from auth/me');
      }

      // Actualizar con datos completos incluyendo rol
      const userData = {
        id: data.id, 
        email: data.email,
        rol: data.rol,
        id_rol: data.id_rol,
        nombre: data.nombre
      };
      authUser.set(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      await this.loadAuxPerms();
      
      return data;
    } catch (error) {
      this.logout();
      throw error;
    } finally {
      authInitializing.set(false);
    }
  },

  // Verificar permisos según rol
  hasRole(allowedRoles: string[]): boolean {
    const user = authUser();
    return user ? allowedRoles.includes(user.rol) : false;
  },

  // Métodos específicos por rol
  isSuperadmin(): boolean {
    return this.hasRole(['Superadmin']);
  },

  isAdmin(): boolean {
    return this.hasRole(['Administrador', 'Superadmin']);
  },

  isAuxiliar(): boolean {
    return this.hasRole(['Auxiliar', 'Administrador', 'Superadmin']);
  },

  canEditModule(moduleKey: string): boolean {
    const user = authUser();
    if (!user) return false;
    if (user.rol !== 'Auxiliar') return true;
    const perms = auxPerms();
    if (!perms) return true;
    return perms[moduleKey] !== false;
  },

  async loadAuxPerms(): Promise<void> {
    const user = authUser();
    if (!user || user.rol !== 'Auxiliar') {
      auxPerms.set(null);
      auxPermsUserId = null;
      return;
    }
    if (auxPermsUserId === user.id && auxPerms()) return;

    const token = this.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${getUsuariosApiBase()}/permisos/${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data && data.permisos) {
        auxPerms.set(data.permisos);
        auxPermsUserId = user.id;
      }
    } catch {
      // ignore: default to full access in UI
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authUser.set(null);
    authInitializing.set(false);
    auxPerms.set(null);
    auxPermsUserId = null;
  },

  getToken() {
    return localStorage.getItem('token');
  }
};

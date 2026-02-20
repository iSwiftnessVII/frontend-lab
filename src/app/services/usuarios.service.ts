import { authService } from './auth.service';

const API_BASE = (window as any).__env?.API_USUARIOS || 'http://localhost:4000/api/usuarios';

function authHeaders(): Record<string, string> {
  const token = authService.getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const usuariosService = {
    /**
     * Cambiar nombre de un usuario
     */
    async cambiarNombre(id: number, nombre: string): Promise<any> {
      const res = await fetch(`${API_BASE}/nombre/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit,
        body: JSON.stringify({ nombre })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        throw new Error((data && data.message) || 'Error actualizando nombre');
      }

      return data;
    },
  /**
   * Listar todos los usuarios
   */
  async listarUsuarios(): Promise<any[]> {
    const res = await fetch(`${API_BASE}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Error listando usuarios');
    }

    return res.json();
  },

  /**
   * Listar todos los roles
   */
  async listarRoles(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/roles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Error listando roles');
    }

    return res.json();
  },

  /**
   * Crear un nuevo usuario
   */
  async crearUsuario(usuario: {
    email: string;
    nombre: string;
    contrasena: string;
    rol_id: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit,
      body: JSON.stringify(usuario)
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch { }

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error creando usuario');
    }

    return data;
  },

  /**
   * Cambiar estado de un usuario
   */
  async cambiarEstado(id: number, estado: 'ACTIVO' | 'INACTIVO'): Promise<any> {
    const res = await fetch(`${API_BASE}/estado/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit,
      body: JSON.stringify({ estado })
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch { }

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error cambiando estado');
    }

    return data;
  },

  /**
   * Eliminar un usuario
   */
  async eliminarUsuario(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/eliminar/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch { }

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error eliminando usuario');
    }

    return data;
  },

  /**
 * Cambiar rol de un usuario
 */
  async cambiarRol(id: number, rol_id: number): Promise<any> {
  const token = localStorage.getItem('token');
  
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  const res = await fetch(`${API_BASE}/rol/${id}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify({ rol_id })
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error((data && data.message) || 'Error cambiando rol');
  }

  return data;
},

  async cambiarContrasena(id: number, contrasena: string): Promise<any> {
    const token = localStorage.getItem('token');
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
    const res = await fetch(`${API_BASE}/contrasena/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ contrasena })
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) {
      throw new Error((data && data.message) || 'Error cambiando contraseña');
    }
    return data;
  },

  async getPermisosAuxiliares(id: number): Promise<{ permisos: Record<string, boolean> }> {
    const res = await fetch(`${API_BASE}/permisos/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error obteniendo permisos auxiliares');
    }

    return data;
  },

  async getPermisosAuxiliaresBatch(ids: number[]): Promise<Record<number, Record<string, boolean>>> {
    const clean = Array.from(new Set((ids || [])
      .map((v) => (typeof v === 'number' ? v : parseInt(String(v), 10)))
      .filter((v) => Number.isFinite(v))));

    if (!clean.length) return {};

    const qs = encodeURIComponent(clean.join(','));
    const res = await fetch(`${API_BASE}/permisos?ids=${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error obteniendo permisos auxiliares');
    }

    const rows = Array.isArray(data) ? data : (data?.rows || []);
    const map: Record<number, Record<string, boolean>> = {};
    for (const row of rows) {
      const uid = Number(row?.usuario_id);
      if (!Number.isFinite(uid)) continue;
      map[uid] = row?.permisos || {};
    }

    return map;
  },

  async setPermisosAuxiliares(id: number, permisos: Record<string, boolean>): Promise<any> {
    const res = await fetch(`${API_BASE}/permisos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() } as HeadersInit,
      body: JSON.stringify({ permisos })
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error actualizando permisos auxiliares');
    }

    return data;
  }
};

const API_BASE = (window as any).__env?.API_USUARIOS || 'http://localhost:3000/api/usuarios';

export const usuariosService = {
  /**
   * Listar todos los usuarios
   */
  async listarUsuarios(): Promise<any[]> {
    const res = await fetch(`${API_BASE}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
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
    contrasena: string;
    rol_id: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario)
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

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
      headers: { 'Content-Type': 'application/json' }
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error eliminando usuario');
    }

    return data;
  }
};
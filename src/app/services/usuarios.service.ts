const API_BASE = (window as any).__env?.API_USUARIOS || 'http://localhost:4000/api/usuarios';

async function tryPost(paths: string[], body: any, headers: Headers): Promise<any> {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      let data: any = null;
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        lastErr = new Error((data && data.message) || `Error ${res.status} ${res.statusText}`);
        continue;
      }
      return data;
    } catch (err) {
      lastErr = err;
      continue;
    }
  }
  throw lastErr || new Error('No se pudo completar la solicitud');
}

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
    } catch { }

    if (!res.ok) {
      throw new Error((data && data.message) || 'Error creando usuario');
    }

    return data;
  },
  
  /**
   * Enviar código de verificación al email
   */
  async enviarCodigo(email: string): Promise<any> {
    const token = localStorage.getItem('token');
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (token) headers.append('Authorization', `Bearer ${token}`);
    return await tryPost(
      ['/verificacion/enviar-codigo', '/enviar-codigo', '/enviar-confirmacion'],
      { email },
      headers
    );
  },

  /**
   * Verificar código ingresado
   */
  async verificarCodigo(email: string, codigo: string): Promise<any> {
    const token = localStorage.getItem('token');
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (token) headers.append('Authorization', `Bearer ${token}`);
    return await tryPost(
      ['/verificacion/verificar-codigo', '/verificar-codigo', '/confirmar'],
      { email, codigo },
      headers
    );
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
      headers: { 'Content-Type': 'application/json' }
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
}
};

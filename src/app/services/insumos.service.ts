import { authService } from './auth.service';

const API_BASE = (window as any).__env?.API_INSUMOS || 'http://localhost:4000/api/insumos';

function authHeaders(): HeadersInit {
  const token = authService.getToken?.();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export interface InsumoCreateInput {
  nombre: string;
  cantidad_adquirida: number;
  cantidad_existente: number;
  presentacion?: string | null;
  marca?: string | null;
  referencia?: string | null;
  descripcion?: string | null;
  fecha_adquisicion?: string | null;
  ubicacion?: string | null;
  observaciones?: string | null;
}

export interface InsumoUpdateInput {
  nombre: string;
  cantidad_adquirida: number;
  cantidad_existente?: number;
  presentacion?: string | null;
  marca?: string | null;
  referencia?: string | null;
  descripcion?: string | null;
  fecha_adquisicion?: string | null;
  ubicacion?: string | null;
  observaciones?: string | null;
}

export const insumosService = {
  async listarInsumos(q: string = '', limit?: number, offset?: number): Promise<any[]> {
    const url = new URL(API_BASE);
    if (q) url.searchParams.set('q', q);
    if (limit && limit > 0) {
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset ?? 0));
    }
    const res = await fetch(url, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rows)) return data.rows;
    return [];
  },

  async crearInsumo(input: InsumoCreateInput, imagen?: File | null): Promise<any> {
    const fd = new FormData();
    fd.append('nombre', input.nombre);
    fd.append('cantidad_adquirida', String(input.cantidad_adquirida));
    fd.append('cantidad_existente', String(input.cantidad_existente));
    if (input.presentacion) fd.append('presentacion', input.presentacion);
    if (input.marca) fd.append('marca', input.marca);
    if (input.referencia) fd.append('referencia', input.referencia);
    if (input.descripcion) fd.append('descripcion', input.descripcion);
    if (input.fecha_adquisicion) fd.append('fecha_adquisicion', input.fecha_adquisicion);
    if (input.ubicacion) fd.append('ubicacion', input.ubicacion);
    if (input.observaciones) fd.append('observaciones', input.observaciones);
    if (imagen) fd.append('imagen', imagen);

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: fd
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error registrando insumo');
    return data;
  },

  async actualizarInsumo(id: number | string, input: InsumoUpdateInput, imagen?: File | null): Promise<any> {
    const fd = new FormData();
    fd.append('nombre', input.nombre);
    fd.append('cantidad_adquirida', String(input.cantidad_adquirida));
    if (input.cantidad_existente !== undefined) {
      fd.append('cantidad_existente', String(input.cantidad_existente));
    }
    if (input.presentacion) fd.append('presentacion', input.presentacion);
    if (input.marca) fd.append('marca', input.marca);
    if (input.referencia) fd.append('referencia', input.referencia);
    if (input.descripcion) fd.append('descripcion', input.descripcion);
    if (input.fecha_adquisicion) fd.append('fecha_adquisicion', input.fecha_adquisicion);
    if (input.ubicacion) fd.append('ubicacion', input.ubicacion);
    if (input.observaciones) fd.append('observaciones', input.observaciones);
    if (imagen) fd.append('imagen', imagen);

    const url = `${API_BASE.replace(/\/$/, '')}/${encodeURIComponent(String(id))}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...authHeaders() },
      body: fd
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error actualizando insumo');
    return data;
  },

  async actualizarImagenInsumo(id: number | string, imagen: File): Promise<any> {
    const fd = new FormData();
    fd.append('imagen', imagen);

    const url = `${API_BASE.replace(/\/$/, '')}/${encodeURIComponent(String(id))}/imagen`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: fd
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error actualizando imagen');
    return data;
  },

  async eliminarInsumo(id: number | string): Promise<void> {
    const url = `${API_BASE.replace(/\/$/, '')}/${encodeURIComponent(String(id))}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error eliminando insumo');
  }
};

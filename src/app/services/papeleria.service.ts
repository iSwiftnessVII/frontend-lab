import { Injectable } from '@angular/core';

export type PapeleriaPresentacion = 'unidad' | 'paquete' | 'caja' | 'cajas';

export interface PapeleriaCreateInput {
  nombre: string;
  cantidad_adquirida: number;
  cantidad_existente: number;
  presentacion: PapeleriaPresentacion;
  marca?: string | null;
  descripcion?: string | null;
  fecha_adquisicion?: string | null;
  ubicacion?: string | null;
  observaciones?: string | null;
}

export interface PapeleriaUpdateInput {
  nombre: string;
  cantidad_adquirida: number;
  cantidad_existente?: number;
  presentacion: PapeleriaPresentacion;
  marca?: string | null;
  descripcion?: string | null;
  fecha_adquisicion?: string | null;
  ubicacion?: string | null;
  observaciones?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PapeleriaService {
  private API_URL = (window as any).__env?.API_PAPELERIA || 'http://localhost:4000/api/papeleria';

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async listar(q: string = '', limit?: number, offset?: number): Promise<any> {
    const url = new URL(this.API_URL);
    if (q) url.searchParams.set('q', q);
    if (limit && limit > 0) url.searchParams.set('limit', String(limit));
    if (offset && offset > 0) url.searchParams.set('offset', String(offset));
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async crear(input: PapeleriaCreateInput, imagen?: File | null): Promise<any> {
    const fd = new FormData();
    fd.append('nombre', input.nombre);
    fd.append('cantidad_adquirida', String(input.cantidad_adquirida));
    fd.append('cantidad_existente', String(input.cantidad_existente));
    fd.append('presentacion', input.presentacion);
    if (input.marca) fd.append('marca', input.marca);
    if (input.descripcion) fd.append('descripcion', input.descripcion);
    if (input.fecha_adquisicion) fd.append('fecha_adquisicion', input.fecha_adquisicion);
    if (input.ubicacion) fd.append('ubicacion', input.ubicacion);
    if (input.observaciones) fd.append('observaciones', input.observaciones);
    if (imagen) fd.append('imagen', imagen);

    const res = await fetch(this.API_URL, {
      method: 'POST',
      headers: { ...this.getAuthHeader() },
      body: fd
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al crear papelería');
    return data;
  }

  async actualizar(id: number, input: PapeleriaUpdateInput, imagen?: File | null): Promise<any> {
    const fd = new FormData();
    fd.append('nombre', input.nombre);
    fd.append('cantidad_adquirida', String(input.cantidad_adquirida));
    if (input.cantidad_existente !== undefined) {
      fd.append('cantidad_existente', String(input.cantidad_existente));
    }
    fd.append('presentacion', input.presentacion);
    if (input.marca) fd.append('marca', input.marca);
    if (input.descripcion) fd.append('descripcion', input.descripcion);
    if (input.fecha_adquisicion) fd.append('fecha_adquisicion', input.fecha_adquisicion);
    if (input.ubicacion) fd.append('ubicacion', input.ubicacion);
    if (input.observaciones) fd.append('observaciones', input.observaciones);
    if (imagen) fd.append('imagen', imagen);

    const res = await fetch(`${this.API_URL}/${encodeURIComponent(String(id))}`, {
      method: 'PUT',
      headers: { ...this.getAuthHeader() },
      body: fd
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al actualizar papelería');
    return data;
  }

  async eliminar(id: number): Promise<any> {
    const res = await fetch(`${this.API_URL}/${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
      headers: { ...this.getAuthHeader() }
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar papelería');
    return data;
  }
}

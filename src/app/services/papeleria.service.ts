import { authService } from './auth.service';
const API_BASE = (window as any).__env?.API_PAPELERIA || 'http://localhost:4000/api/papeleria';

function authHeaders(): HeadersInit {
  const token = authService.getToken?.();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const papeleriaService = {
  // Catálogo
  async buscarCatalogo(q: string, limit?: number, offset?: number) {
    const url = new URL(`${API_BASE}/catalogo`);
    if (q) url.searchParams.set('q', q);
    if (limit && limit > 0) url.searchParams.set('limit', String(limit));
    if (offset && offset > 0) url.searchParams.set('offset', String(offset));
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async obtenerCatalogo(item: number) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(String(item))}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async crearCatalogo(form: FormData) {
    const res = await fetch(`${API_BASE}/catalogo`, { method: 'POST', body: form });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando catálogo');
    return data;
  },
  // Eliminar del catálogo de Papelería (nombre específico)
  async eliminarCatalogoPapeleria(item: number | string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(String(item))}`, { method: 'DELETE', headers: { ...authHeaders() } });
    let data: any = null;
    try { data = await res.json(); }
    catch {
      try { const txt = await res.text(); data = { message: txt }; }
      catch { data = null; }
    }
    if (!res.ok) {
      const err = new Error((data && data.message) || 'Error eliminando catálogo');
      (err as any).status = res.status;
      throw err;
    }
    return data;
  },
  getCatalogoImagenUrl(item: number | string) {
    return `${API_BASE}/catalogo/${encodeURIComponent(String(item))}/imagen`;
  },

  // Inventario
  async listar(q: string, limit?: number) {
    const url = new URL(API_BASE);
    if (q) url.searchParams.set('q', q);
    if (limit && limit > 0) url.searchParams.set('limit', String(limit));
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async obtener(id: number) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(id))}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async crear(body: any) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando papelería');
    return data;
  },
  async actualizar(id: number, body: any) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(id))}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error actualizando papelería');
    return data;
  },
  async ajustarExistencias(id: number, opts: { cantidad?: number, delta?: number }) {
    const body: any = {};
    if (typeof opts?.cantidad !== 'undefined') body.cantidad = opts.cantidad;
    if (typeof opts?.delta !== 'undefined') body.delta = opts.delta;
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(id))}/existencias`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error ajustando existencias');
    return data;
  },
  async eliminar(id: number) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(id))}`, { method: 'DELETE', headers: { ...authHeaders() } });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error eliminando papelería');
    return data;
  }
};

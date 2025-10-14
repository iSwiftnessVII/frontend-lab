const API_BASE = (window as any).__env?.API_REACTIVOS || 'http://localhost:3000/api/reactivos';

export const reactivosService = {
  async aux() {
    const res = await fetch(`${API_BASE}/aux`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // Catálogo
  async buscarCatalogo(q: string, limit?: number, offset?: number) {
    const url = new URL(`${API_BASE}/catalogo`);
    if (q) url.searchParams.set('q', q);
    if (limit && limit > 0) url.searchParams.set('limit', String(limit));
    if (offset && offset > 0) url.searchParams.set('offset', String(offset));
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // Puede ser array o {rows,total}
  },
  async obtenerCatalogo(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async crearCatalogo(item: any) {
    const res = await fetch(`${API_BASE}/catalogo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando catálogo');
    return data;
  },
  async actualizarCatalogo(codigo: string, item: any) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error actualizando catálogo');
    return data;
  },
  // Reactivos
  async listarReactivos(q: string, limit?: number) {
    const url = new URL(API_BASE);
    if (q) url.searchParams.set('q', q);
    if (limit && limit > 0) url.searchParams.set('limit', String(limit));
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async obtenerReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async crearReactivo(item: any) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando reactivo');
    return data;
  },
  async actualizarReactivo(lote: string, item: any) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error actualizando reactivo');
    return data;
  },
  async eliminarReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}`, { method: 'DELETE' });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error eliminando reactivo');
    return data;
  },

  // PDFs: Hoja de Seguridad
  async obtenerHojaSeguridad(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/hoja-seguridad`);
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'No encontrada');
    // Asegurar que la URL de visualización sea absoluta hacia el backend
    try {
      if (data && data.url) {
        const full = new URL(data.url, API_BASE).toString();
        data.url = full;
      }
    } catch {}
    return data;
  },
  async subirHojaSeguridad(codigo: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/hoja-seguridad`, {
      method: 'POST',
      body: fd
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error al subir PDF');
    return data;
  },
  async eliminarHojaSeguridad(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/hoja-seguridad`, { method: 'DELETE' });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar PDF');
    return data;
  },

  // PDFs: Certificado de Análisis
  async obtenerCertAnalisis(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/cert-analisis`);
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'No encontrado');
    // Asegurar que la URL de visualización sea absoluta hacia el backend
    try {
      if (data && data.url) {
        const full = new URL(data.url, API_BASE).toString();
        data.url = full;
      }
    } catch {}
    return data;
  },
  async subirCertAnalisis(codigo: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/cert-analisis`, {
      method: 'POST',
      body: fd
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error al subir PDF');
    return data;
  },
  async eliminarCertAnalisis(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/cert-analisis`, { method: 'DELETE' });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar PDF');
    return data;
  },
};
import { authService } from './auth.service';
const API_BASE = (window as any).__env?.API_REACTIVOS || 'http://localhost:4000/api/reactivos';
const API_ROOT =
  (window as any).__env?.API_BASE ||
  String(API_BASE).replace(/\/reactivos\/?$/i, '').replace(/\/+$/g, '');
let tplDocEndpointMissing = false;

function buildTemplateUrls(path: string): string[] {
  const bases = [
    String(API_BASE).replace(/\/+$/g, ''),
    String(API_ROOT).replace(/\/+$/g, '') + '/reactivos',
    String(API_ROOT).replace(/\/+$/g, '')
  ];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const b of bases) {
    const u = `${b}${path.startsWith('/') ? '' : '/'}${path}`;
    if (!seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  }
  return urls;
}

async function fetchFirstNon404(urls: string[], init: RequestInit): Promise<Response> {
  let last: Response | null = null;
  for (const url of urls) {
    const res = await fetch(url, init);
    last = res;
    if (res.status !== 404) return res;
  }
  return last as Response;
}

function authHeaders(): HeadersInit {
  const token = authService.getToken?.();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  const suffix = res.status ? ` (HTTP ${res.status})` : '';
  try {
    const data: any = await res.clone().json();
    const msg = data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  } catch {}
  try {
    const text = (await res.clone().text()).trim();
    if (text) {
      if (text.startsWith('<')) return `${fallback}${suffix}`;
      return text.length > 280 ? text.slice(0, 280) + '…' : text;
    }
  } catch {}
  return `${fallback}${suffix}`;
}

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
    const res = await fetch(url, { headers: { ...authHeaders() } }); // ← AGREGADO
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() }, // ← AGREGADO
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error creando catálogo');
    return data;
  },
  async actualizarCatalogo(codigo: string, item: any) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }, // ← AGREGADO
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error actualizando catálogo');
    return data;
  },
  async eliminarCatalogo(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error eliminando del catálogo');
    return data;
  },
  // Reactivos
  async listarReactivos(q: string, limit?: number, offset?: number) {
    const url = new URL(API_BASE);
    if (q) url.searchParams.set('q', q);
    if (limit && limit > 0) {
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset ?? 0));
    }
    const res = await fetch(url, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async totalReactivos() {
    const res = await fetch(`${API_BASE}/total`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // { total }
  },
  async registrarConsumo(item: { lote: string, cantidad: number, usuario?: string, uso: string }) {
    const res = await fetch(`${API_BASE}/consumo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error registrando consumo');
    return data;
  },

  async obtenerReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async crearReactivo(item: any) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }, // ← AGREGADO
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error creando reactivo');
    return data;
  },
  async actualizarReactivo(lote: string, item: any) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }, // ← AGREGADO
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error actualizando reactivo');
    return data;
  },
  async eliminarReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    if (!res.ok) {
      const err: any = new Error(await readApiError(res, 'Error eliminando reactivo'));
      err.status = res.status;
      throw err;
    }
    let data: any = null;
    try { data = await res.json(); } catch {}
    return data;
  },

  // PDFs: Hoja de Seguridad
  async obtenerHojaSeguridad(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/hoja-seguridad`);
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'No encontrada');
    // Normalizar URL de visualización manteniendo el prefijo /api/reactivos
    try {
      if (data && data.url && typeof data.url === 'string') {
        // Si ya es absoluta, la dejamos igual
        if (!/^https?:\/\//i.test(data.url)) {
          const base = API_BASE.endsWith('/') ? API_BASE : API_BASE + '/';
          // Evitar perder el segmento 'api/reactivos' como ocurría con new URL(relative, base)
          data.url = base + data.url.replace(/^\/+/, '');
        }
      }
    } catch { }
    return data;
  },
  async subirHojaSeguridad(codigo: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/hoja-seguridad`, {
      method: 'POST',
      headers: { ...authHeaders() }, // ← AGREGADO
      body: fd
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al subir PDF');
    return data;
  },
  async eliminarHojaSeguridad(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/hoja-seguridad`, { method: 'DELETE', headers: { ...authHeaders() } });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar PDF');
    return data;
  },

  // PDFs: Certificado de Análisis
  async obtenerCertAnalisis(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/cert-analisis`);
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'No encontrado');
    // Normalizar URL de visualización manteniendo el prefijo /api/reactivos
    try {
      if (data && data.url && typeof data.url === 'string') {
        if (!/^https?:\/\//i.test(data.url)) {
          const base = API_BASE.endsWith('/') ? API_BASE : API_BASE + '/';
          data.url = base + data.url.replace(/^\/+/, '');
        }
      }
    } catch { }
    return data;
  },
  async subirCertAnalisis(codigo: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/cert-analisis`, {
      method: 'POST',
      headers: { ...authHeaders() }, // ← AGREGADO
      body: fd
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al subir PDF');
    return data;
  },
  async eliminarCertAnalisis(codigo: string) {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo)}/cert-analisis`, { method: 'DELETE', headers: { ...authHeaders() } });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar PDF');
    return data;
  },
  
  // PDFs por Reactivo (por lote) - nuevos endpoints acorde a esquema SQL
  async obtenerHojaSeguridadReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}/hoja-seguridad`);
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'No encontrada');
    try {
      if (data && data.url && typeof data.url === 'string') {
        if (!/^https?:\/\//i.test(data.url)) {
          const base = API_BASE.endsWith('/') ? API_BASE : API_BASE + '/';
          data.url = base + data.url.replace(/^\/+/, '');
        }
      }
    } catch {}
    return data;
  },
  async subirHojaSeguridadReactivo(lote: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}/hoja-seguridad`, { 
      method: 'POST', 
      headers: { ...authHeaders() }, // ← AGREGADO
      body: fd 
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al subir PDF');
    return data;
  },
  async eliminarHojaSeguridadReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}/hoja-seguridad`, { method: 'DELETE', headers: { ...authHeaders() } });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar PDF');
    return data;
  },
  async obtenerCertAnalisisReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}/cert-analisis`);
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'No encontrado');
    try {
      if (data && data.url && typeof data.url === 'string') {
        if (!/^https?:\/\//i.test(data.url)) {
          const base = API_BASE.endsWith('/') ? API_BASE : API_BASE + '/';
          data.url = base + data.url.replace(/^\/+/, '');
        }
      }
    } catch {}
    return data;
  },
  async subirCertAnalisisReactivo(lote: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}/cert-analisis`, { 
      method: 'POST', 
      headers: { ...authHeaders() }, // ← AGREGADO
      body: fd 
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al subir PDF');
    return data;
  },
  async eliminarCertAnalisisReactivo(lote: string) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(lote)}/cert-analisis`, { method: 'DELETE', headers: { ...authHeaders() } });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar PDF');
    return data;
  },
  async exportarReactivosExcel() {
    const res = await fetch(`${API_BASE}/export/excel`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    return blob;
  },
  async suscribirse(email: string) {
    const res = await fetch(`${API_BASE}/suscripciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ email })
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.error) || 'Error al suscribirse');
    return data;
  },
  async estadoSuscripcion(email: string) {
    const res = await fetch(`${API_BASE}/suscripciones/${encodeURIComponent(email)}`, {
      headers: { ...authHeaders() }
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.error) || 'Error consultando suscripción');
    return data as { suscrito: boolean };
  },
  async cancelarSuscripcion(email: string) {
    const res = await fetch(`${API_BASE}/suscripciones/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.error) || 'Error al cancelar suscripción');
    return data;
  },
  async listarPlantillasDocumentoReactivo(): Promise<any[]> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const res = await fetchFirstNon404(buildTemplateUrls('/documentos/plantillas'), {
      method: 'GET',
      headers: { ...authHeaders() }
    });
    let data: any = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      if (res.status === 404) {
        tplDocEndpointMissing = true;
        throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
      }
      throw new Error((data && (data.message || data.error)) || 'Error listando plantillas');
    }
    return Array.isArray(data) ? data : (data?.rows || []);
  },
  async subirPlantillaDocumentoReactivo(params: { nombre?: string; template: File }): Promise<any> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const template = params?.template;
    const nombre = String(params?.nombre ?? '').trim();
    if (!template) throw new Error('Debe seleccionar una plantilla');

    const fd = new FormData();
    fd.append('template', template);
    if (nombre) fd.append('nombre', nombre);

    const res = await fetchFirstNon404(buildTemplateUrls('/documentos/plantillas'), {
      method: 'POST',
      headers: { ...authHeaders() },
      body: fd
    });
    let data: any = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      if (res.status === 404) {
        tplDocEndpointMissing = true;
        throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
      }
      throw new Error((data && (data.message || data.error)) || 'Error subiendo plantilla');
    }
    return data;
  },
  async eliminarPlantillaDocumentoReactivo(id: number): Promise<void> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const templateId = Number(id);
    if (!Number.isFinite(templateId) || templateId <= 0) throw new Error('Plantilla inválida');
    const res = await fetchFirstNon404(buildTemplateUrls(`/documentos/plantillas/${encodeURIComponent(String(templateId))}`), {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    let data: any = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      if (res.status === 404) {
        tplDocEndpointMissing = true;
        throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
      }
      throw new Error((data && (data.message || data.error)) || 'Error eliminando plantilla');
    }
  },
  async generarDocumentoReactivoDesdePlantilla(params: { templateId: number; codigo?: string; lote?: string; todos?: boolean }): Promise<{ blob: Blob; filename: string | null }> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const templateId = Number(params?.templateId);
    const codigo = String(params?.codigo ?? '').trim();
    const lote = String(params?.lote ?? '').trim();
    const todos = !!params?.todos;
    if (!Number.isFinite(templateId) || templateId <= 0) throw new Error('Debe seleccionar una plantilla');
    if (!todos && !codigo && !lote) throw new Error('Debe seleccionar un reactivo');

    const res = await fetchFirstNon404(
      buildTemplateUrls(`/documentos/plantillas/${encodeURIComponent(String(templateId))}/generar`),
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ codigo, lote: lote || undefined, todos: todos || undefined })
      }
    );
    if (!res.ok) {
      if (res.status === 404) tplDocEndpointMissing = true;
      const err: any = new Error(await readApiError(res, 'Error generando documento'));
      err.status = res.status;
      throw err;
    }

    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    let filename: string | null = null;
    const m = /filename\*?=(?:UTF-8''|\"?)([^\";]+)\"?/i.exec(cd);
    if (m && m[1]) {
      try { filename = decodeURIComponent(m[1]); } catch { filename = m[1]; }
    }
    return { blob, filename };
  }
};

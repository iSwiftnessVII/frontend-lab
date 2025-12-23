
import { signal } from '@angular/core';

const API = (window as any).__env?.API_EQUIPOS || 'http://localhost:4000/api/equipos';

export const equiposService = {
  // Registrar un nuevo equipo
  async crearEquipo(payload: any) {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al registrar equipo');
    }
    return await res.json();
  },

  // Registrar historial de equipo
  async crearHistorial(payload: any) {
    const API_HISTORIAL = (window as any).__env?.API_HISTORIAL_HV || 'http://localhost:4000/api/equipos/historial';
    const res = await fetch(API_HISTORIAL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al registrar historial');
    }
    return await res.json();
  },

  // Registrar intervalo de equipo
  async crearIntervalo(payload: any) {
    const API_INTERVALO = (window as any).__env?.API_INTERVALO_HV || 'http://localhost:4000/api/equipos/intervalo';
    const res = await fetch(API_INTERVALO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al registrar intervalo');
    }
    return await res.json();
  },

  // Registrar ficha técnica
  async crearFichaTecnica(payload: any) {
    const API_FICHA_TECNICA = (window as any).__env?.API_FICHA_TECNICA || 'http://localhost:4000/api/equipos/ficha-tecnica';
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const headers: any = {
      ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
    };
    const res = await fetch(API_FICHA_TECNICA, {
      method: 'POST',
      headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers },
      body: isFormData ? payload : JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al registrar ficha técnica');
    }
    return await res.json();
  },
  
  async actualizarFichaTecnica(codigo: string, payload: any) {
    const API_FICHA_TECNICA = (window as any).__env?.API_FICHA_TECNICA || 'http://localhost:4000/api/equipos/ficha-tecnica';
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const headers: any = {
      ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
    };
    const code = encodeURIComponent(codigo);
    const tries = [
      { url: `${API_FICHA_TECNICA}/${code}`, method: 'PUT' },
      { url: `${API}/ficha-tecnica/${code}`, method: 'PUT' },
      { url: `${API_FICHA_TECNICA}/${code}`, method: 'PATCH' },
      { url: `${API}/ficha-tecnica/${code}`, method: 'PATCH' }
    ];
    let lastError: any = null;
    for (const t of tries) {
      try {
        const res = await fetch(t.url, { method: t.method, headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers }, body: isFormData ? payload : JSON.stringify(payload) });
        let data: any = null; try { data = await res.json(); } catch { }
        if (res.ok) return data;
        if (res.status === 404) { lastError = (data && data.message) || '404'; continue; }
        throw new Error((data && data.message) || `Error ${res.status}`);
      } catch (e: any) {
        lastError = e;
      }
    }
    throw new Error((lastError && lastError.message) || 'Error al actualizar ficha técnica');
  },

  // Listar equipos registrados
  async listarEquipos() {
    const res = await fetch(API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al obtener equipos');
    }
    return await res.json();
  },

  // Obtener equipo completo por código - MÉTODO CORREGIDO
  async obtenerEquipoCompleto(codigo: string) {
    const res = await fetch(`${API}/completo/${codigo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al obtener equipo');
    }
    return await res.json();
  },

  async generarDocumentoEquipo(params: { codigo: string; template: File }): Promise<{ blob: Blob; filename: string | null }> {
    const codigo = String(params?.codigo ?? '').trim();
    const template = params?.template;
    if (!codigo) throw new Error('Debe seleccionar un equipo');
    if (!template) throw new Error('Debe seleccionar una plantilla');

    const fd = new FormData();
    fd.append('template', template);
    fd.append('codigo', codigo);

    const res = await fetch(`${API}/documentos/generar`, {
      method: 'POST',
      headers: {
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: fd
    });
    if (!res.ok) {
      const errBody: any = await res.json().catch(() => ({}));
      const err: any = new Error(errBody?.message || 'Error generando documento');
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
  },

  // ✅ NUEVO: Obtener fichas técnicas
  async listarFichasTecnicas() {
    const res = await fetch(`${API}/fichas-tecnicas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al obtener fichas técnicas');
    }
    return await res.json();
  },

  // Obtener siguiente consecutivo historial por equipo
  async obtenerNextHistorial(codigo: string) {
    const res = await fetch(`${API}/historial/next/${codigo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error obteniendo consecutivo historial');
    }
    return await res.json();
  },

  // Obtener siguiente consecutivo intervalo por equipo
  async obtenerNextIntervalo(codigo: string) {
    const res = await fetch(`${API}/intervalo/next/${codigo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error obteniendo consecutivo intervalo');
    }
    return await res.json();
  },

  // Listar historial por equipo
  async listarHistorialPorEquipo(codigo: string) {
    const res = await fetch(`${API}/historial/list/${codigo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error listando historial');
    }
    return await res.json();
  },

  // Actualizar historial por equipo y consecutivo
  async actualizarHistorial(equipo: string, consecutivo: number | string, payload: any) {
    const API_HISTORIAL = (window as any).__env?.API_HISTORIAL_HV || 'http://localhost:4000/api/equipos/historial';
    const res = await fetch(`${API_HISTORIAL}/${encodeURIComponent(String(equipo))}/${encodeURIComponent(String(consecutivo))}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al actualizar historial');
    }
    return await res.json();
  },

  // Actualizar intervalo por equipo y consecutivo
  async actualizarIntervalo(equipo: string, consecutivo: number | string, payload: any) {
    const API_INTERVALO = (window as any).__env?.API_INTERVALO_HV || 'http://localhost:4000/api/equipos/intervalo';
    const res = await fetch(`${API_INTERVALO}/${encodeURIComponent(String(equipo))}/${encodeURIComponent(String(consecutivo))}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al actualizar intervalo');
    }
    return await res.json();
  },

  // Listar intervalo por equipo
  async listarIntervaloPorEquipo(codigo: string) {
    const res = await fetch(`${API}/intervalo/list/${codigo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error listando intervalo');
    }
    return await res.json();
  },

  // PDFs por equipo
  async listarPdfsPorEquipo(codigo: string) {
    const res = await fetch(`${API}/pdfs/${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error listando PDFs');
    // Normalize urls to be absolute if backend returns relative
    if (Array.isArray(data)) {
      data = data.map((p: any) => {
        // Build a download URL that streams the blob: /api/equipos/pdfs/download/:id
        try {
          const base = (window as any).__env?.API_EQUIPOS || API;
          p.url_archivo = `${base.replace(/\/$/, '')}/pdfs/download/${p.id}`;
        } catch (e) { p.url_archivo = null; }
        return p;
      });
    }
    return data;
  },

  async subirPdfEquipo(codigo: string, categoria: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('categoria', categoria);
    const res = await fetch(`${API}/pdfs/${encodeURIComponent(codigo)}`, {
      method: 'POST',
      headers: {
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: fd
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al subir PDF');
    return data;
  },

  async eliminarPdf(id: number) {
    const res = await fetch(`${API}/pdfs/${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    let data: any = null; try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.message) || 'Error al eliminar PDF');
    return data;
  },

  // Eliminar equipo por código
  async eliminarEquipo(codigo: string) {
    const res = await fetch(`${API}/${encodeURIComponent(codigo)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al eliminar equipo');
    }
    return await res.json();
  },

  // Actualizar equipo por código (PUT)
  async actualizarEquipo(codigo: string, payload: any) {
    const headers = {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
    } as any;
    const code = encodeURIComponent(codigo);
    let exists = false;
    try {
      const chk = await fetch(`${API}/completo/${code}`, { method: 'GET', headers });
      exists = chk.ok;
    } catch {}
    const tries = [
      { url: `${API}/${code}`, method: 'PUT', body: JSON.stringify(payload) },
      { url: `${API}/completo/${code}`, method: 'PUT', body: JSON.stringify(payload) },
      { url: `${API}/update/${code}`, method: 'PUT', body: JSON.stringify(payload) },
      { url: `${API}/${code}`, method: 'PATCH', body: JSON.stringify(payload) },
      { url: `${API}/completo/${code}`, method: 'PATCH', body: JSON.stringify(payload) },
      { url: `${API}`, method: 'PUT', body: JSON.stringify({ codigo_identificacion: codigo, ...payload }) },
      ...(!exists ? [{ url: `${API}`, method: 'POST', body: JSON.stringify({ codigo_identificacion: codigo, ...payload }) }] : [])
    ];
    let lastError: any = null;
    for (const t of tries) {
      try {
        const res = await fetch(t.url, { method: t.method, headers, body: t.body });
        let data: any = null; try { data = await res.json(); } catch { }
        if (res.ok) return data;
        if (res.status === 404) { lastError = (data && data.message) || '404'; continue; }
        throw new Error((data && data.message) || `Error ${res.status}`);
      } catch (e: any) {
        lastError = e;
      }
    }
    throw new Error((lastError && lastError.message) || 'Error al actualizar equipo');
  },

// Obtener el siguiente consecutivo para historial_hv por equipo específico
async obtenerSiguienteConsecutivoHistorialPorEquipo(equipoId: string) {
  const API_MAX_CONSECUTIVO = `${API}/historial/max-consecutivo/${equipoId}`;
  const res = await fetch(API_MAX_CONSECUTIVO, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener consecutivo historial por equipo');
  }
  const data = await res.json();
  return (data.maxConsecutivo || 0) + 1;
},

// Obtener el siguiente consecutivo para intervalo_hv por equipo específico
async obtenerSiguienteConsecutivoIntervaloPorEquipo(equipoId: string) {
  const API_MAX_CONSECUTIVO = `${API}/intervalo/max-consecutivo/${equipoId}`;
  const res = await fetch(API_MAX_CONSECUTIVO, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener consecutivo intervalo por equipo');
  }
  const data = await res.json();
  return (data.maxConsecutivo || 0) + 1;
}
};

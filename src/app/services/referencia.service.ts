const API = (window as any).__env?.API_REFERENCIA || 'http://localhost:4000/api/material-referencia';

export const referenciaService = {
  // ==================== MATERIAL REFERENCIA ====================
  async crearMaterial(payload: any) {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al registrar material de referencia');
    return data;
  },

  async listarMateriales() {
    const res = await fetch(API, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al listar materiales de referencia');
    return data;
  },

  async obtenerMaterial(codigo: string) {
    const res = await fetch(`${API}/${encodeURIComponent(codigo)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al obtener material de referencia');
    return data;
  },

  async actualizarMaterial(codigo: string, payload: any) {
    const res = await fetch(`${API}/${encodeURIComponent(codigo)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al actualizar material de referencia');
    return data;
  },

  async eliminarMaterial(codigo: string) {
    const res = await fetch(`${API}/${encodeURIComponent(codigo)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al eliminar material de referencia');
    return data;
  },

  // ==================== HISTORIAL ====================
  async crearHistorial(payload: any) {
    const res = await fetch(`${API}/historial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al registrar historial');
    return data;
  },

  async listarHistorialPorMaterial(codigo: string) {
    const res = await fetch(`${API}/historial/list/${encodeURIComponent(codigo)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al listar historial');
    return data;
  },

  async obtenerNextHistorial(codigo: string) {
    const res = await fetch(`${API}/historial/next/${encodeURIComponent(codigo)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al obtener siguiente consecutivo');
    return data;
  },

  async actualizarHistorial(codigo: string, consecutivo: number | string, payload: any) {
    const res = await fetch(`${API}/historial/${encodeURIComponent(codigo)}/${encodeURIComponent(String(consecutivo))}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al actualizar historial');
    return data;
  },

  // ==================== INTERVALO ====================
  async crearIntervalo(payload: any) {
    const res = await fetch(`${API}/intervalo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al registrar intervalo');
    return data;
  },

  async listarIntervaloPorMaterial(codigo: string) {
    const res = await fetch(`${API}/intervalo/list/${encodeURIComponent(codigo)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al listar intervalo');
    return data;
  },

  async obtenerNextIntervalo(codigo: string) {
    const res = await fetch(`${API}/intervalo/next/${encodeURIComponent(codigo)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al obtener siguiente consecutivo');
    return data;
  },

  async actualizarIntervalo(codigo: string, consecutivo: number | string, payload: any) {
    const res = await fetch(`${API}/intervalo/${encodeURIComponent(codigo)}/${encodeURIComponent(String(consecutivo))}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Error al actualizar intervalo');
    return data;
  },

  // ==================== PDFs ====================
  async listarPdfsPorMaterial(codigo: string) {
    const res = await fetch(`${API}/pdfs/${encodeURIComponent(codigo)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error(data?.message || 'Error al listar PDFs');
    if (Array.isArray(data)) {
      data.forEach((pdf: any) => {
        if (pdf.url && !pdf.url.startsWith('http')) {
          const base = API.replace('/material-referencia', '');
          pdf.url = base + pdf.url;
        }
      });
    }
    return data;
  },

  async subirPdfMaterial(codigo: string, categoria: string, file: File) {
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
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error(data?.message || 'Error al subir PDF');
    return data;
  },

  async eliminarPdf(codigo: string, id: string) {
    const res = await fetch(`${API}/pdfs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    let data: any = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error(data?.message || 'Error al eliminar PDF');
    return data;
  }
};

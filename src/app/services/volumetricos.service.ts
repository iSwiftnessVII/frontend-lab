const API = (window as any).__env?.API_VOLUMETRICOS || 'http://localhost:4000/api/volumetricos';

export const volumetricosService = {
  // ==================== MATERIAL VOLUMÉTRICO ====================
  
  // Crear material volumétrico
  async crearMaterial(payload: any) {
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
      throw new Error(error.message || 'Error al registrar material volumétrico');
    }
    return await res.json();
  },

  // Listar materiales volumétricos
  async listarMateriales() {
    const res = await fetch(API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al listar materiales volumétricos');
    }
    return await res.json();
  },

  // Obtener material completo por código
  async obtenerMaterialCompleto(codigo: string) {
    const res = await fetch(`${API}/${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al obtener material volumétrico');
    }
    return await res.json();
  },

  // Actualizar material volumétrico
  async actualizarMaterial(codigo: string, payload: any) {
    const res = await fetch(`${API}/${encodeURIComponent(codigo)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al actualizar material volumétrico');
    }
    return await res.json();
  },

  // Eliminar material volumétrico
  async eliminarMaterial(codigo: string) {
    const res = await fetch(`${API}/${encodeURIComponent(codigo)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al eliminar material volumétrico');
    }
    return await res.json();
  },

  // ==================== HISTORIAL VOLUMÉTRICO ====================

  // Crear historial volumétrico
  async crearHistorial(payload: any) {
    const res = await fetch(`${API}/historial`, {
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

  // Listar historial por material
  async listarHistorialPorMaterial(codigo: string) {
    const res = await fetch(`${API}/historial/list/${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al listar historial');
    }
    return await res.json();
  },

  // Obtener siguiente consecutivo de historial
  async obtenerNextHistorial(codigo: string) {
    const res = await fetch(`${API}/historial/next/${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al obtener siguiente consecutivo');
    }
    return await res.json();
  },

  // Actualizar historial
  async actualizarHistorial(codigo: string, consecutivo: number | string, payload: any) {
    const res = await fetch(`${API}/historial/${encodeURIComponent(codigo)}/${encodeURIComponent(String(consecutivo))}`, {
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

  // ==================== INTERVALO VOLUMÉTRICO ====================

  // Crear intervalo volumétrico
  async crearIntervalo(payload: any) {
    const res = await fetch(`${API}/intervalo`, {
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

  // Listar intervalo por material
  async listarIntervaloPorMaterial(codigo: string) {
    const res = await fetch(`${API}/intervalo/list/${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al listar intervalo');
    }
    return await res.json();
  },

  // Obtener siguiente consecutivo de intervalo
  async obtenerNextIntervalo(codigo: string) {
    const res = await fetch(`${API}/intervalo/next/${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al obtener siguiente consecutivo');
    }
    return await res.json();
  },

  // Actualizar intervalo
  async actualizarIntervalo(codigo: string, consecutivo: number | string, payload: any) {
    const res = await fetch(`${API}/intervalo/${encodeURIComponent(codigo)}/${encodeURIComponent(String(consecutivo))}`, {
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

  // ==================== PDFs ====================

  // Listar PDFs por material
  async listarPdfsPorMaterial(codigo: string) {
    const res = await fetch(`${API}/pdfs/${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    let data: any = null; 
    try { data = await res.json(); } catch { }
    if (!res.ok) {
      throw new Error(data?.message || 'Error al listar PDFs');
    }
    // Normalize urls to be absolute if backend returns relative
    if (Array.isArray(data)) {
      data.forEach((pdf: any) => {
        if (pdf.url && !pdf.url.startsWith('http')) {
          const base = API.replace('/volumetricos', '');
          pdf.url = base + pdf.url;
        }
      });
    }
    return data;
  },

  // Subir PDF para material
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
    if (!res.ok) {
      throw new Error(data?.message || 'Error al subir PDF');
    }
    return data;
  },

  // Eliminar PDF por id
  async eliminarPdf(id: number | string) {
    const res = await fetch(`${API}/pdfs/${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });
    let data: any = null; 
    try { data = await res.json(); } catch { }
    if (!res.ok) {
      throw new Error(data?.message || 'Error al eliminar PDF');
    }
    return data;
  }
};

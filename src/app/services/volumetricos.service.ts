import { Injectable } from '@angular/core';

let tplDocEndpointMissing = false;

@Injectable({
  providedIn: 'root'
})
export class VolumetricosService {
  private API_URL = (window as any).__env?.API_VOLUMETRICOS || 'http://localhost:4000/api/volumetricos';

  constructor() {}

  private async readApiError(res: Response, fallback: string): Promise<string> {
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j: any = await res.json();
        if (j?.message) return String(j.message);
        if (j?.error) return String(j.error);
      }
      const t = await res.text();
      if (t) return t;
    } catch {}
    return fallback;
  }

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

  // Métodos para material_volumetrico
  async listarMateriales(): Promise<any[]> {
    const response = await fetch(`${this.API_URL}/materiales`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error al listar materiales');
    return response.json();
  }

  async crearMaterial(payload: any): Promise<any> {
    const response = await fetch(`${this.API_URL}/materiales`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error al crear material');
    return response.json();
  }

  async actualizarMaterial(codigo: number, payload: any): Promise<any> {
    const response = await fetch(`${this.API_URL}/materiales/${codigo}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error al actualizar material');
    return response.json();
  }

  async eliminarMaterial(codigo: number): Promise<void> {
    const response = await fetch(`${this.API_URL}/materiales/${codigo}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar material');
  }

  // Métodos para historial_volumetrico
  async listarHistorialPorMaterial(codigo: number): Promise<any[]> {
    const response = await fetch(`${this.API_URL}/materiales/${codigo}/historial`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error al listar historial');
    return response.json();
  }

  async crearHistorial(payload: any): Promise<any> {
    const response = await fetch(`${this.API_URL}/historial`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error al crear historial');
    return response.json();
  }

  async obtenerNextHistorial(codigo: number): Promise<{ next: number }> {
    const response = await fetch(`${this.API_URL}/materiales/${codigo}/historial/next`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener siguiente consecutivo');
    return response.json();
  }

  async actualizarHistorial(codigo_material: number, consecutivo: number, payload: any): Promise<any> {
    const response = await fetch(`${this.API_URL}/historial/${codigo_material}/${consecutivo}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error al actualizar historial');
    return response.json();
  }

  // Métodos para intervalo_volumetrico
  async listarIntervaloPorMaterial(codigo: number): Promise<any[]> {
    const response = await fetch(`${this.API_URL}/materiales/${codigo}/intervalo`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error al listar intervalo');
    return response.json();
  }

  async crearIntervalo(payload: any): Promise<any> {
    const response = await fetch(`${this.API_URL}/intervalo`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error al crear intervalo');
    return response.json();
  }

  async obtenerNextIntervalo(codigo: number): Promise<{ next: number }> {
    const response = await fetch(`${this.API_URL}/materiales/${codigo}/intervalo/next`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener siguiente consecutivo');
    return response.json();
  }

  async actualizarIntervalo(codigo_material: number, consecutivo: number, payload: any): Promise<any> {
    const response = await fetch(`${this.API_URL}/intervalo/${codigo_material}/${consecutivo}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error al actualizar intervalo');
    return response.json();
  }

  // Métodos para PDFs (si es necesario)
  async listarPdfsPorMaterial(codigo: string): Promise<any[]> {
    const response = await fetch(`${this.API_URL}/pdfs/${codigo}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((p: any) => {
        try {
          const base = this.API_URL;
          p.url_archivo = `${String(base).replace(/\/$/, '')}/pdfs/download/${p.id}`;
        } catch {
          // ignore
        }
        return p;
      });
    }
    return data;
  }

  async subirPdfMaterial(codigo: string, categoria: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);

    const response = await fetch(`${this.API_URL}/pdfs/${codigo}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: formData
    });
    if (!response.ok) throw new Error('Error al subir PDF');
    return response.json();
  }

  async eliminarPdf(id: number): Promise<void> {
    const response = await fetch(`${this.API_URL}/pdfs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar PDF');
  }

  async generarDocumentoVolumetrico(params: { codigo: number; template: File }): Promise<{ blob: Blob; filename: string | null }> {
    const codigo = Number(params?.codigo);
    const template = params?.template;
    if (!Number.isFinite(codigo) || codigo <= 0) throw new Error('Debe seleccionar un material');
    if (!template) throw new Error('Debe seleccionar una plantilla');

    const fd = new FormData();
    fd.append('template', template);
    fd.append('codigo', String(codigo));

    const res = await fetch(`${this.API_URL}/documentos/generar`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: fd
    });
    if (!res.ok) {
      const err: any = new Error(await this.readApiError(res, 'Error generando documento'));
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

  async listarPlantillasDocumentoVolumetrico(): Promise<any[]> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const res = await fetch(`${this.API_URL}/documentos/plantillas`, {
      method: 'GET',
      headers: this.getHeaders()
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
  }

  async subirPlantillaDocumentoVolumetrico(params: { template: File; nombre?: string }): Promise<any> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const template = params?.template;
    if (!template) throw new Error('Debe seleccionar una plantilla');

    const fd = new FormData();
    fd.append('template', template);
    const nombre = typeof params?.nombre === 'string' ? params.nombre.trim() : '';
    if (nombre) fd.append('nombre', nombre);

    const res = await fetch(`${this.API_URL}/documentos/plantillas`, {
      method: 'POST',
      headers: this.getAuthHeader(),
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
  }

  async eliminarPlantillaDocumentoVolumetrico(id: number): Promise<any> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const tplId = Number(id);
    if (!Number.isFinite(tplId) || tplId <= 0) throw new Error('ID inválido');
    const res = await fetch(`${this.API_URL}/documentos/plantillas/${tplId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
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
    return data;
  }

  async generarDocumentoVolumetricoDesdePlantilla(params: { id: number; codigo: number }): Promise<{ blob: Blob; filename: string | null }> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const tplId = Number(params?.id);
    const codigo = Number(params?.codigo);
    if (!Number.isFinite(tplId) || tplId <= 0) throw new Error('ID inválido');
    if (!Number.isFinite(codigo) || codigo <= 0) throw new Error('Debe seleccionar un material');

    const res = await fetch(`${this.API_URL}/documentos/plantillas/${tplId}/generar`, {
      method: 'POST',
      headers: { ...this.getHeaders() },
      body: JSON.stringify({ codigo })
    });
    if (!res.ok) {
      const err: any = new Error(await this.readApiError(res, 'Error generando documento'));
      err.status = res.status;
      if (res.status === 404) tplDocEndpointMissing = true;
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
}

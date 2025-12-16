import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VolumetricosService {
  private API_URL = (window as any).__env?.API_VOLUMETRICOS || 'http://localhost:4000/api/volumetricos';

  constructor() {}

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
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReferenciaService {
  private API_REFERENCIA = (window as any).__env?.API_REFERENCIA || 'http://localhost:4000/api/referencia';

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  // Material Referencia
  async listarMateriales() {
    return firstValueFrom(this.http.get<any[]>(`${this.API_REFERENCIA}/material`, this.getOptions()));
  }

  async crearMaterial(data: any) {
    return firstValueFrom(this.http.post(`${this.API_REFERENCIA}/material`, data, this.getOptions()));
  }

  async actualizarMaterial(codigo_id: number, data: any) {
    return firstValueFrom(this.http.put(`${this.API_REFERENCIA}/material/${codigo_id}`, data, this.getOptions()));
  }

  async eliminarMaterial(codigo_id: number) {
    return firstValueFrom(this.http.delete(`${this.API_REFERENCIA}/material/${codigo_id}`, this.getOptions()));
  }

  // Historial Referencia
  async listarHistorialPorMaterial(codigo_material: number) {
    return firstValueFrom(this.http.get<any[]>(`${this.API_REFERENCIA}/historial/${codigo_material}`, this.getOptions()));
  }

  async crearHistorial(data: any) {
    return firstValueFrom(this.http.post(`${this.API_REFERENCIA}/historial`, data, this.getOptions()));
  }

  async actualizarHistorial(codigo_material: number, consecutivo: number, data: any) {
    return firstValueFrom(this.http.put(`${this.API_REFERENCIA}/historial/${codigo_material}/${consecutivo}`, data, this.getOptions()));
  }

  async obtenerNextHistorial(codigo_material: number) {
    return firstValueFrom(this.http.get<any>(`${this.API_REFERENCIA}/historial/next/${codigo_material}`, this.getOptions()));
  }

  // Intervalo Referencia
  async listarIntervaloPorMaterial(codigo_material: number) {
    return firstValueFrom(this.http.get<any[]>(`${this.API_REFERENCIA}/intervalo/${codigo_material}`, this.getOptions()));
  }

  async crearIntervalo(data: any) {
    return firstValueFrom(this.http.post(`${this.API_REFERENCIA}/intervalo`, data, this.getOptions()));
  }

  async actualizarIntervalo(codigo_material: number, consecutivo: number, data: any) {
    return firstValueFrom(this.http.put(`${this.API_REFERENCIA}/intervalo/${codigo_material}/${consecutivo}`, data, this.getOptions()));
  }

  async obtenerNextIntervalo(codigo_material: number) {
    return firstValueFrom(this.http.get<any>(`${this.API_REFERENCIA}/intervalo/next/${codigo_material}`, this.getOptions()));
  }

  // PDFs (si aplica)
  async listarPdfsPorMaterial(codigo_material: string) {
    const data = await firstValueFrom(this.http.get<any[]>(`${this.API_REFERENCIA}/pdf/${codigo_material}`, this.getOptions()));
    if (Array.isArray(data)) {
      return data.map(p => {
        try {
          const base = this.API_REFERENCIA;
          (p as any).url = `${String(base).replace(/\/$/, '')}/pdf/download/${p.id}`;
        } catch {}
        return p;
      });
    }
    return data;
  }

  async subirPdfMaterial(codigo_material: string, categoria: string, file: File) {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('categoria', categoria);
    formData.append('codigo_material', codigo_material);
    
    return firstValueFrom(this.http.post(`${this.API_REFERENCIA}/pdf/upload`, formData, this.getOptions()));
  }

  async eliminarPdf(id: number) {
    return firstValueFrom(this.http.delete(`${this.API_REFERENCIA}/pdf/${id}`, this.getOptions()));
  }

  async generarDocumentoReferencia(params: { codigo: number; template: File }): Promise<{ blob: Blob; filename: string | null }> {
    const codigo = Number(params?.codigo);
    const template = params?.template;
    if (!Number.isFinite(codigo) || codigo <= 0) throw new Error('Debe seleccionar un material');
    if (!template) throw new Error('Debe seleccionar una plantilla');

    const formData = new FormData();
    formData.append('template', template);
    formData.append('codigo', String(codigo));

    const { headers } = this.getOptions();
    try {
      const resp: any = await firstValueFrom(
        this.http.post(`${this.API_REFERENCIA}/documentos/generar`, formData, {
          headers,
          observe: 'response',
          responseType: 'blob'
        } as any)
      );

      const blob: Blob = resp?.body;
      const cd = resp?.headers?.get?.('content-disposition') || '';
      let filename: string | null = null;
      const m = /filename\*?=(?:UTF-8''|\"?)([^\";]+)\"?/i.exec(cd);
      if (m && m[1]) {
        try { filename = decodeURIComponent(m[1]); } catch { filename = m[1]; }
      }

      return { blob, filename };
    } catch (err: any) {
      let msg = err?.error?.message || err?.error?.error || err?.message || 'Error generando documento';
      try {
        if (err?.error instanceof Blob) {
          const t = await err.error.text();
          try {
            const j = JSON.parse(t);
            msg = j?.message || j?.error || msg;
          } catch {
            msg = t || msg;
          }
        }
      } catch {}
      throw new Error(String(msg || 'Error generando documento'));
    }
  }
}

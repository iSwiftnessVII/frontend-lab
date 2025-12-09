import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { referenciaService } from '../services/referencia.service';

@Component({
  selector: 'app-referencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './referencia.component.html',
  styleUrls: ['./referencia.component.css']
})
export class ReferenciaComponent implements OnInit {
  panelActivo: 'material' | 'historial' | 'intervalo' | null = 'material';

  materiales: any[] = [];
  selectedMaterial: any | null = null;
  historial: any[] = [];
  intervalos: any[] = [];
  pdfs: any[] = [];

  loading = false;
  error = '';
  success = '';
  filtro = '';

  formMaterial: any = this.baseMaterial();

  formHistorial: any = this.baseHistorial();

  formIntervalo: any = this.baseIntervalo();

  uploadCategoria = 'general';
  uploadFile: File | null = null;

  ngOnInit(): void {
    void this.cargarMateriales();
  }

  private baseMaterial() {
    return {
      codigo_id: null,
      nombre_material: '',
      rango_medicion: '',
      marca: '',
      serie: '',
      error_max_permitido: null,
      modelo: ''
    };
  }

  private baseHistorial(codigo = null as number | null, consecutivo = 1) {
    return {
      codigo_material: codigo,
      consecutivo,
      fecha: '',
      tipo_historial_instrumento: '',
      codigo_registro: '',
      realizo: '',
      superviso: ''
    };
  }

  private baseIntervalo(codigo = null as number | null, consecutivo = 1) {
    return {
      codigo_material: codigo,
      consecutivo,
      valor_nominal: null,
      fecha_c1: '',
      error_c1: null,
      fecha_c2: '',
      error_c2: null,
      diferencia_tiempo_dias: null,
      desviacion_abs: null,
      deriva: null,
      tolerancia: null,
      intervalo_calibracion_dias: null,
      intervalo_calibracion_anos: null,
      incertidumbre_exp: null
    };
  }

  togglePanel(panel: 'material' | 'historial' | 'intervalo'): void {
    this.panelActivo = this.panelActivo === panel ? null : panel;
  }

  setMessage(msg: string, isError = false): void {
    this.error = isError ? msg : '';
    this.success = isError ? '' : msg;
  }

  materialesFiltrados(): any[] {
    const term = this.filtro.trim().toLowerCase();
    if (!term) return this.materiales;
    return this.materiales.filter(m => (
      m.codigo_id?.toString().includes(term) ||
      m.nombre_material?.toLowerCase().includes(term) ||
      m.marca?.toLowerCase().includes(term) ||
      m.modelo?.toLowerCase().includes(term)
    ));
  }

  async cargarMateriales(): Promise<void> {
    this.loading = true;
    try {
      this.materiales = await referenciaService.listarMateriales();
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo cargar materiales', true);
    } finally {
      this.loading = false;
    }
  }

  seleccionarMaterial(mat: any, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedMaterial = mat;
    this.formMaterial = { ...mat };
    this.formHistorial = this.baseHistorial(mat.codigo_id, 1);
    this.formIntervalo = this.baseIntervalo(mat.codigo_id, 1);
    this.setMessage('');
    void this.cargarDetalle(mat.codigo_id);
  }

  nuevoMaterial(): void {
    this.selectedMaterial = null;
    this.formMaterial = this.baseMaterial();
    this.historial = [];
    this.intervalos = [];
    this.pdfs = [];
    this.setMessage('');
    this.panelActivo = 'material';
  }

  async guardarMaterial(): Promise<void> {
    this.loading = true;
    try {
      const payload = { ...this.formMaterial };
      if (!payload.codigo_id || !payload.nombre_material) {
        this.setMessage('Código y nombre son obligatorios', true);
        return;
      }

      if (this.selectedMaterial) {
        await referenciaService.actualizarMaterial(String(payload.codigo_id), payload);
        this.setMessage('Material actualizado');
      } else {
        await referenciaService.crearMaterial(payload);
        this.setMessage('Material creado');
      }
      await this.cargarMateriales();
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo guardar material', true);
    } finally {
      this.loading = false;
    }
  }

  async eliminarMaterial(codigo: number | string, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    if (!confirm('¿Eliminar material?')) return;
    this.loading = true;
    try {
      await referenciaService.eliminarMaterial(String(codigo));
      if (this.selectedMaterial?.codigo_id === Number(codigo)) this.nuevoMaterial();
      await this.cargarMateriales();
      this.setMessage('Material eliminado');
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo eliminar material', true);
    } finally {
      this.loading = false;
    }
  }

  async cargarDetalle(codigo: number | string): Promise<void> {
    this.loading = true;
    try {
      this.historial = await referenciaService.listarHistorialPorMaterial(String(codigo));
      this.intervalos = await referenciaService.listarIntervaloPorMaterial(String(codigo));
      const nextH = await referenciaService.obtenerNextHistorial(String(codigo));
      const nextI = await referenciaService.obtenerNextIntervalo(String(codigo));
      this.formHistorial = this.baseHistorial(Number(codigo), nextH?.nextConsecutivo || 1);
      this.formIntervalo = this.baseIntervalo(Number(codigo), nextI?.nextConsecutivo || 1);
      this.pdfs = await referenciaService.listarPdfsPorMaterial(String(codigo));
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo cargar detalle', true);
    } finally {
      this.loading = false;
    }
  }

  async guardarHistorial(): Promise<void> {
    if (!this.formHistorial.codigo_material) return;
    this.loading = true;
    try {
      await referenciaService.crearHistorial(this.formHistorial);
      this.setMessage('Historial agregado');
      await this.cargarDetalle(this.formHistorial.codigo_material);
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo guardar historial', true);
    } finally {
      this.loading = false;
    }
  }

  async guardarIntervalo(): Promise<void> {
    if (!this.formIntervalo.codigo_material) return;
    this.loading = true;
    try {
      await referenciaService.crearIntervalo(this.formIntervalo);
      this.setMessage('Intervalo agregado');
      await this.cargarDetalle(this.formIntervalo.codigo_material);
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo guardar intervalo', true);
    } finally {
      this.loading = false;
    }
  }

  onFileChange(event: any): void {
    const file = event?.target?.files?.[0];
    this.uploadFile = file || null;
  }

  async subirPdf(): Promise<void> {
    if (!this.selectedMaterial?.codigo_id || !this.uploadFile) return;
    this.loading = true;
    try {
      await referenciaService.subirPdfMaterial(String(this.selectedMaterial.codigo_id), this.uploadCategoria, this.uploadFile);
      this.setMessage('PDF subido');
      this.uploadFile = null;
      await this.cargarDetalle(this.selectedMaterial.codigo_id);
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo subir PDF', true);
    } finally {
      this.loading = false;
    }
  }

  async eliminarPdf(id: string): Promise<void> {
    if (!this.selectedMaterial?.codigo_id) return;
    if (!confirm('¿Eliminar PDF?')) return;
    this.loading = true;
    try {
      await referenciaService.eliminarPdf(String(this.selectedMaterial.codigo_id), id);
      this.setMessage('PDF eliminado');
      await this.cargarDetalle(this.selectedMaterial.codigo_id);
    } catch (e: any) {
      this.setMessage(e?.message || 'No se pudo eliminar PDF', true);
    } finally {
      this.loading = false;
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { volumetricosService } from '../services/volumetricos.service';
import { SnackbarService } from '../shared/snackbar.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-volumetricos',
  templateUrl: './volumetricos.component.html',
  styleUrls: ['./volumetricos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class VolumetricosComponent implements OnInit {
  // Control de formulario activo
  formularioActivo: string | null = null;

  // ==================== MATERIAL VOLUMÉTRICO ====================
  codigo_id: number | null = null;
  nombre_material = '';
  volumen_nominal: number | null = null;
  rango_volumen = '';
  marca = '';
  resolucion: number | null = null;
  error_max_permitido: number | null = null;
  modelo = '';

  // ==================== HISTORIAL VOLUMÉTRICO ====================
  consecutivo_historial: number | null = null;
  codigo_material_historial: number | null = null;
  fecha_historial = '';
  tipo_historial_instrumento = '';
  codigo_registro_historial = '';
  realizo_historial = '';
  superviso_historial = '';

  // ==================== INTERVALO VOLUMÉTRICO ====================
  consecutivo_intervalo: number | null = null;
  codigo_material_intervalo: number | null = null;
  valor_nominal: number | null = null;
  fecha_c1 = '';
  error_c1: number | null = null;
  fecha_c2 = '';
  error_c2: number | null = null;
  diferencia_tiempo_dias: number | null = null;
  desviacion_abs: number | null = null;
  deriva: number | null = null;
  tolerancia: number | null = null;
  intervalo_calibracion_dias: number | null = null;
  intervalo_calibracion_anos: number | null = null;
  incertidumbre_exp: number | null = null;

  // Lista de materiales registrados
  materialesRegistrados: any[] = [];
  cargandoMateriales = false;

  // Control de pestaña activa por material
  activeTab: { [codigo: string]: string } = {};

  // Almacenar historial e intervalo por material
  historialPorMaterial: { [codigo: string]: any[] } = {};
  intervaloPorMaterial: { [codigo: string]: any[] } = {};

  // Control de registros expandidos
  historialExpandido: { [key: string]: boolean } = {};
  intervaloExpandido: { [key: string]: boolean } = {};

  // Control de material expandido (como equipoExpandido en Equipos)
  materialExpandido: number | null = null;

  // Edit modal state
  editModalVisible = false;
  editModalClosing = false;
  editModalActiveTab = 'material';
  editingMaterialCodigo: number | null = null;
  editMaterialMode = false;

  // PDFs por material
  pdfListByMaterial: { [codigo: string]: Array<{ id?: number | string; name: string; url: string; categoria?: string; size?: number; mime?: string; fecha_subida?: Date | null; displayName?: string }> } = {};
  selectedPdfByMaterial: { [codigo: string]: string | null } = {};

  // Filtros y búsqueda
  filtroNombre = '';
  filtroMarca = '';
  filtroModelo = '';
  filtroCodigo = '';
  
  get materialesFiltrados() {
    let resultado = [...this.materialesRegistrados];
    
    if (this.filtroNombre) {
      resultado = resultado.filter(m => 
        m.nombre_material?.toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    }
    if (this.filtroMarca) {
      resultado = resultado.filter(m => 
        m.marca?.toLowerCase().includes(this.filtroMarca.toLowerCase())
      );
    }
    if (this.filtroModelo) {
      resultado = resultado.filter(m => 
        m.modelo?.toLowerCase().includes(this.filtroModelo.toLowerCase())
      );
    }
    if (this.filtroCodigo) {
      resultado = resultado.filter(m => 
        String(m.codigo_id).includes(this.filtroCodigo)
      );
    }
    
    return resultado;
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroMarca = '';
    this.filtroModelo = '';
    this.filtroCodigo = '';
  }

  constructor(public snack: SnackbarService) {}

  ngOnInit() {
    this.obtenerMaterialesRegistrados();
  }

  // ==================== MÉTODOS AUXILIARES ====================

  toggleFormulario(tipo: string) {
    this.formularioActivo = this.formularioActivo === tipo ? null : tipo;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  }

  // ==================== MATERIAL VOLUMÉTRICO ====================

  async crearMaterial(event: Event) {
    event.preventDefault();
    
    if (!this.codigo_id || !this.nombre_material || !this.volumen_nominal) {
      this.snack.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      await volumetricosService.crearMaterial({
        codigo_id: this.codigo_id,
        nombre_material: this.nombre_material,
        volumen_nominal: this.volumen_nominal,
        rango_volumen: this.rango_volumen || null,
        marca: this.marca || null,
        resolucion: this.resolucion,
        error_max_permitido: this.error_max_permitido,
        modelo: this.modelo || null
      });

      this.snack.success('Material volumétrico registrado correctamente');
      this.resetFormMaterial();
      await this.obtenerMaterialesRegistrados();
    } catch (error: any) {
      console.error('Error al registrar material volumétrico:', error);
      this.snack.error(error?.message || 'Error al registrar material volumétrico');
    }
  }

  resetFormMaterial() {
    this.codigo_id = null;
    this.nombre_material = '';
    this.volumen_nominal = null;
    this.rango_volumen = '';
    this.marca = '';
    this.resolucion = null;
    this.error_max_permitido = null;
    this.modelo = '';
  }

  async obtenerMaterialesRegistrados() {
    this.cargandoMateriales = true;
    try {
      this.materialesRegistrados = await volumetricosService.listarMateriales();
    } catch (error: any) {
      console.error('Error al obtener materiales:', error);
      this.snack.error(error?.message || 'Error al obtener materiales volumétricos');
    } finally {
      this.cargandoMateriales = false;
    }
  }

  async eliminarMaterial(codigo: number, event?: Event) {
    if (event) event.stopPropagation();
    
    if (!confirm('¿Está seguro de eliminar este material volumétrico?')) return;

    try {
      await volumetricosService.eliminarMaterial(String(codigo));
      this.snack.success('Material eliminado correctamente');
      await this.obtenerMaterialesRegistrados();
    } catch (error: any) {
      console.error('Error al eliminar material:', error);
      this.snack.error(error?.message || 'Error al eliminar material');
    }
  }

  // ==================== HISTORIAL ====================

  async crearHistorial(event: Event) {
    event.preventDefault();

    if (!this.codigo_material_historial || !this.fecha_historial) {
      this.snack.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      // Obtener siguiente consecutivo
      const { nextConsecutivo } = await volumetricosService.obtenerNextHistorial(String(this.codigo_material_historial));

      await volumetricosService.crearHistorial({
        consecutivo: nextConsecutivo,
        codigo_material: this.codigo_material_historial,
        fecha: this.fecha_historial,
        tipo_historial_instrumento: this.tipo_historial_instrumento || null,
        codigo_registro: this.codigo_registro_historial || null,
        realizo: this.realizo_historial || null,
        superviso: this.superviso_historial || null
      });

      this.snack.success('Historial registrado correctamente');
      this.resetFormHistorial();
      await this.obtenerMaterialesRegistrados();
    } catch (error: any) {
      console.error('Error al registrar historial:', error);
      this.snack.error(error?.message || 'Error al registrar historial');
    }
  }

  resetFormHistorial() {
    this.consecutivo_historial = null;
    this.codigo_material_historial = null;
    this.fecha_historial = '';
    this.tipo_historial_instrumento = '';
    this.codigo_registro_historial = '';
    this.realizo_historial = '';
    this.superviso_historial = '';
  }

  // ==================== INTERVALO ====================

  async crearIntervalo(event: Event) {
    event.preventDefault();

    if (!this.codigo_material_intervalo || !this.valor_nominal || !this.fecha_c1 || !this.error_c1 || !this.fecha_c2 || !this.error_c2) {
      this.snack.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      // Obtener siguiente consecutivo
      const { nextConsecutivo } = await volumetricosService.obtenerNextIntervalo(String(this.codigo_material_intervalo));

      // Calcular campos automáticos
      this.calcularCamposIntervalo();

      await volumetricosService.crearIntervalo({
        consecutivo: nextConsecutivo,
        codigo_material: this.codigo_material_intervalo,
        valor_nominal: this.valor_nominal,
        fecha_c1: this.fecha_c1,
        error_c1: this.error_c1,
        fecha_c2: this.fecha_c2,
        error_c2: this.error_c2,
        diferencia_tiempo_dias: this.diferencia_tiempo_dias,
        desviacion_abs: this.desviacion_abs,
        deriva: this.deriva,
        tolerancia: this.tolerancia,
        intervalo_calibracion_dias: this.intervalo_calibracion_dias,
        intervalo_calibracion_anos: this.intervalo_calibracion_anos,
        incertidumbre_exp: this.incertidumbre_exp
      });

      this.snack.success('Intervalo registrado correctamente');
      this.resetFormIntervalo();
      await this.obtenerMaterialesRegistrados();
    } catch (error: any) {
      console.error('Error al registrar intervalo:', error);
      this.snack.error(error?.message || 'Error al registrar intervalo');
    }
  }

  calcularCamposIntervalo() {
    // Calcular diferencia de días
    if (this.fecha_c1 && this.fecha_c2) {
      const d1 = new Date(this.fecha_c1);
      const d2 = new Date(this.fecha_c2);
      this.diferencia_tiempo_dias = Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Calcular desviación absoluta
    if (this.error_c1 !== null && this.error_c2 !== null) {
      this.desviacion_abs = Math.abs(this.error_c2 - this.error_c1);
    }

    // Calcular deriva
    if (this.desviacion_abs !== null && this.diferencia_tiempo_dias && this.diferencia_tiempo_dias > 0) {
      this.deriva = this.desviacion_abs / this.diferencia_tiempo_dias;
    }

    // Calcular intervalo de calibración en días
    if (this.tolerancia !== null && this.deriva && this.deriva !== 0) {
      this.intervalo_calibracion_dias = Math.abs(this.tolerancia / this.deriva);
    }

    // Calcular intervalo de calibración en años
    if (this.intervalo_calibracion_dias !== null) {
      this.intervalo_calibracion_anos = this.intervalo_calibracion_dias / 365;
    }
  }

  resetFormIntervalo() {
    this.consecutivo_intervalo = null;
    this.codigo_material_intervalo = null;
    this.valor_nominal = null;
    this.fecha_c1 = '';
    this.error_c1 = null;
    this.fecha_c2 = '';
    this.error_c2 = null;
    this.diferencia_tiempo_dias = null;
    this.desviacion_abs = null;
    this.deriva = null;
    this.tolerancia = null;
    this.intervalo_calibracion_dias = null;
    this.intervalo_calibracion_anos = null;
    this.incertidumbre_exp = null;
  }

  // ==================== TAB NAVIGATION ====================

  toggleDetalleMaterial(codigo: number) {
    if (this.materialExpandido === codigo) {
      this.materialExpandido = null;
      delete this.activeTab[codigo];
    } else {
      this.materialExpandido = codigo;
      // Seleccionar primera pestaña por defecto
      if (!this.activeTab[codigo]) {
        this.selectTab(codigo.toString(), 'historial');
      }
    }
  }

  async selectTab(codigo: string, tabKey: string) {
    this.activeTab[codigo] = tabKey;

    // Cargar PDFs si aún no se han cargado
    if (!this.pdfListByMaterial[codigo]) {
      await this.listarPdfs(codigo);
    }

    if (tabKey === 'historial' && !this.historialPorMaterial[codigo]) {
      try {
        this.historialPorMaterial[codigo] = await volumetricosService.listarHistorialPorMaterial(codigo);
      } catch (error) {
        console.error('Error al cargar historial:', error);
      }
    }

    if (tabKey === 'intervalo' && !this.intervaloPorMaterial[codigo]) {
      try {
        this.intervaloPorMaterial[codigo] = await volumetricosService.listarIntervaloPorMaterial(codigo);
      } catch (error) {
        console.error('Error al cargar intervalo:', error);
      }
    }
  }

  toggleHistorialRegistro(materialId: string, consecutivo: number) {
    const key = materialId + '_' + consecutivo;
    this.historialExpandido[key] = !this.historialExpandido[key];
  }

  toggleIntervaloRegistro(materialId: string, consecutivo: number) {
    const key = materialId + '_' + consecutivo;
    this.intervaloExpandido[key] = !this.intervaloExpandido[key];
  }

  getTabCount(material: any, tabKey: string): number {
    const codigo = String(material.codigo_id);
    if (tabKey === 'historial') {
      return this.historialPorMaterial[codigo]?.length || 0;
    }
    if (tabKey === 'intervalo') {
      return this.intervaloPorMaterial[codigo]?.length || 0;
    }
    return 0;
  }

  // ==================== EDIT MODAL ====================

  abrirEditarMaterial(material: any, event?: Event) {
    if (event) event.stopPropagation();
    if (!material) return;

    this.codigo_id = material.codigo_id;
    this.nombre_material = material.nombre_material || '';
    this.volumen_nominal = material.volumen_nominal;
    this.rango_volumen = material.rango_volumen || '';
    this.marca = material.marca || '';
    this.resolucion = material.resolucion;
    this.error_max_permitido = material.error_max_permitido;
    this.modelo = material.modelo || '';

    this.editMaterialMode = true;
    this.editingMaterialCodigo = material.codigo_id;
    this.editModalVisible = true;
    this.editModalClosing = false;
    this.editModalActiveTab = 'material';
  }

  closeEditMaterialModal() {
    this.editModalVisible = false;
    this.editModalClosing = false;
    this.editMaterialMode = false;
    this.editingMaterialCodigo = null;
  }

  async saveAllEditMaterial() {
    if (!this.editingMaterialCodigo) {
      this.snack.error('No se ha seleccionado material para editar');
      return;
    }

    const payload: any = {
      nombre_material: this.nombre_material,
      volumen_nominal: this.volumen_nominal,
      rango_volumen: this.rango_volumen,
      marca: this.marca,
      resolucion: this.resolucion,
      error_max_permitido: this.error_max_permitido,
      modelo: this.modelo
    };

    try {
      await volumetricosService.actualizarMaterial(String(this.editingMaterialCodigo), payload);
      this.snack.success('Material actualizado correctamente');
      await this.obtenerMaterialesRegistrados();
      this.closeEditMaterialModal();
    } catch (error: any) {
      console.error('Error al actualizar material:', error);
      this.snack.error(error?.message || 'Error al actualizar material');
    }
  }

  // ==================== INLINE EDIT - HISTORIAL ====================

  startEditHistorial(registro: any) {
    if (!registro) return;
    if (!registro._edit) {
      registro._edit = { ...registro };
      if (registro.fecha) {
        registro._edit.fecha = this.formatearFecha(registro.fecha);
      }
    }
  }

  async saveHistorialEdits(materialCodigo: string, registro: any) {
    if (!registro || !registro._edit) return;
    try {
      const payload = { ...registro._edit };
      const updated = await volumetricosService.actualizarHistorial(materialCodigo, registro.consecutivo, payload);
      Object.assign(registro, updated);
      delete registro._edit;
      this.snack.success('Historial actualizado correctamente');
    } catch (error: any) {
      console.error('Error al actualizar historial:', error);
      this.snack.error(error?.message || 'Error al actualizar historial');
    }
  }

  cancelHistorialEdits(registro: any) {
    if (registro && registro._edit) delete registro._edit;
  }

  // ==================== INLINE EDIT - INTERVALO ====================

  startEditIntervalo(registro: any) {
    if (!registro) return;
    if (!registro._edit) {
      registro._edit = { ...registro };
      if (registro.fecha_c1) {
        registro._edit.fecha_c1 = this.formatearFecha(registro.fecha_c1);
      }
      if (registro.fecha_c2) {
        registro._edit.fecha_c2 = this.formatearFecha(registro.fecha_c2);
      }
    }
  }

  async saveIntervaloEdits(materialCodigo: string, registro: any) {
    if (!registro || !registro._edit) return;
    try {
      const payload = { ...registro._edit };
      const updated = await volumetricosService.actualizarIntervalo(materialCodigo, registro.consecutivo, payload);
      Object.assign(registro, updated);
      delete registro._edit;
      this.snack.success('Intervalo actualizado correctamente');
      
      // Refresh list
      try {
        this.intervaloPorMaterial[materialCodigo] = await volumetricosService.listarIntervaloPorMaterial(materialCodigo);
      } catch (e) {}
    } catch (error: any) {
      console.error('Error al actualizar intervalo:', error);
      this.snack.error(error?.message || 'Error al actualizar intervalo');
    }
  }

  cancelIntervaloEdits(registro: any) {
    if (registro && registro._edit) delete registro._edit;
  }

  // ==================== PDFs ====================

  async listarPdfs(codigo: string) {
    try {
      const pdfs = await volumetricosService.listarPdfsPorMaterial(codigo);
      this.pdfListByMaterial[codigo] = pdfs || [];
      this.computePdfDisplayNames(codigo);
    } catch (error: any) {
      console.error('Error al listar PDFs:', error);
      this.pdfListByMaterial[codigo] = [];
    }
  }

  computePdfDisplayNames(codigo: string) {
    const pdfs = this.pdfListByMaterial[codigo];
    if (!pdfs || pdfs.length === 0) return;
    
    const categoryCounts: { [cat: string]: number } = {};
    pdfs.forEach(pdf => {
      const cat = pdf.categoria || 'Sin categoría';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryIndexes: { [cat: string]: number } = {};
    pdfs.forEach(pdf => {
      const cat = pdf.categoria || 'Sin categoría';
      const count = categoryCounts[cat];
      if (count > 1) {
        categoryIndexes[cat] = (categoryIndexes[cat] || 0) + 1;
        pdf.displayName = `${cat} - ${categoryIndexes[cat]}`;
      } else {
        pdf.displayName = cat;
      }
    });
  }

  openPdf(codigo: string, event?: Event) {
    if (event) event.stopPropagation();
    const selected = this.selectedPdfByMaterial[codigo];
    if (!selected) {
      this.snack.error('Seleccione un PDF primero');
      return;
    }
    const pdf = this.pdfListByMaterial[codigo]?.find((p: any) => p.id === selected);
    if (pdf && pdf.url) {
      window.open(pdf.url, '_blank');
    }
  }

  async deletePdf(codigo: string, event?: Event) {
    if (event) event.stopPropagation();
    const selected = this.selectedPdfByMaterial[codigo];
    if (!selected) {
      this.snack.error('Seleccione un PDF primero');
      return;
    }
    if (!confirm('¿Está seguro de eliminar este PDF?')) return;
    
    try {
      await volumetricosService.eliminarPdf(selected);
      this.snack.success('PDF eliminado correctamente');
      this.selectedPdfByMaterial[codigo] = null;
      await this.listarPdfs(codigo);
    } catch (error: any) {
      console.error('Error al eliminar PDF:', error);
      this.snack.error(error?.message || 'Error al eliminar PDF');
    }
  }

  iniciarUpload(codigo: string, categoria: string, event?: Event) {
    if (event) event.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      try {
        await volumetricosService.subirPdfMaterial(codigo, categoria, file);
        this.snack.success('PDF subido correctamente');
        await this.listarPdfs(codigo);
      } catch (error: any) {
        console.error('Error al subir PDF:', error);
        this.snack.error(error?.message || 'Error al subir PDF');
      }
    };
    input.click();
  }
}

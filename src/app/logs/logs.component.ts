import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { logsService } from '../services/logs.service';
import { jsPDF } from 'jspdf';

interface Paginacion {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
interface TargetInfo {
  nombre: string;
  codigo: string;
  email: string;
  id: string;
}
interface KeyValue {
  key: string;
  value: unknown;
}
interface Cambio {
  campo: string;
  antes: string;
  despues: string;
}
interface FiltrosAcciones {
  page: number;
  limit: number;
  modulo: string;
  accion: string;
  usuario_id: string;
  fecha_desde: string;
  fecha_hasta: string;
}
interface FiltrosMovimientos {
  page: number;
  limit: number;
  producto_tipo: string;
  tipo_movimiento: string;
  fecha_desde: string;
  fecha_hasta: string;
}
interface LogFieldConfig {
  nombreKeys: string[];
  codigoKeys: string[];
  emailKeys: string[];
  idKeys: string[];
  includeId: boolean;
}
interface LogAccionItem {
  id_log_accion?: number | string;
  fecha?: string;
  usuario_id?: number | string;
  usuario_nombre?: string;
  usuario_email?: string;
  modulo?: string;
  accion?: string;
  descripcion?: string;
  detalle?: unknown;
}
interface MovimientoInventarioItem {
  id_movimiento?: number | string;
  fecha?: string;
  usuario_nombre?: string;
  producto_tipo?: string;
  producto_referencia?: string;
  tipo_movimiento?: string;
}
interface EstadisticaModulo {
  modulo: string;
  cantidad: number;
  total_acciones?: number;
  usuarios_activos?: number;
}
interface EstadisticaAccion {
  accion: string;
  cantidad: number;
}
interface EstadisticasData {
  estadisticas: EstadisticaModulo[];
  accionesFrecuentes: EstadisticaAccion[];
}

@Component({
  standalone: true,
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LogsComponent implements OnInit {
  // Signals para el estado
  private activaTabSig = signal<'acciones' | 'movimientos' | 'estadisticas'>('acciones');
  get activaTab() { return this.activaTabSig(); }
  set activaTab(v: 'acciones' | 'movimientos' | 'estadisticas') { this.activaTabSig.set(v); }

  // Filtros para logs de acciones - CORREGIDO: usuario_id como string para el template
  private filtrosAccionesSig = signal<FiltrosAcciones>({
    page: 1,
    limit: 10,
    modulo: '',
    accion: '',
    usuario_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  get filtrosAcciones() { return this.filtrosAccionesSig(); }

  // Filtros para movimientos
  private filtrosMovimientosSig = signal<FiltrosMovimientos>({
    page: 1,
    limit: 50,
    producto_tipo: '',
    tipo_movimiento: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  get filtrosMovimientos() { return this.filtrosMovimientosSig(); }

  // Datos
  private logsAccionesSig = signal<LogAccionItem[]>([]);
  get logsAcciones() { return this.logsAccionesSig(); }

  private movimientosInventarioSig = signal<MovimientoInventarioItem[]>([]);
  get movimientosInventario() { return this.movimientosInventarioSig(); }

  private estadisticasSig = signal<EstadisticasData | null>(null);
  get estadisticas() { return this.estadisticasSig(); }

  // Estados de carga
  private cargandoAccionesSig = signal(false);
  get cargandoAcciones() { return this.cargandoAccionesSig(); }

  private cargandoMovimientosSig = signal(false);
  get cargandoMovimientos() { return this.cargandoMovimientosSig(); }

  private cargandoEstadisticasSig = signal(false);
  get cargandoEstadisticas() { return this.cargandoEstadisticasSig(); }

  // Paginación
  private paginacionAccionesSig = signal<Paginacion>({ page: 1, limit: 10, total: 0, pages: 0 });
  get paginacionAcciones() { return this.paginacionAccionesSig(); }

  private paginacionMovimientosSig = signal<Paginacion>({ page: 1, limit: 50, total: 0, pages: 0 });
  get paginacionMovimientos() { return this.paginacionMovimientosSig(); }

  // Opciones para filtros
  modulos = ['INSUMOS', 'PAPELERIA', 'REACTIVOS', 'SOLICITUDES', 'CLIENTES', 'CATALOGO_INSUMOS', 'CATALOGO_REACTIVOS', 'EQUIPOS', 'MAT_REFERENCIA', 'MAT_VOLUMETRICOS', 'VOLUMETRICOS', 'REFERENCIA'];
  acciones = ['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'SUBIR_PDF', 'ELIMINAR_PDF', 'CREAR_ENCUESTA', 'AJUSTAR_EXISTENCIAS', 'CONSUMO', 'SUBIR_PLANTILLA', 'ELIMINAR_PLANTILLA', 'GENERAR_DOC_PLANTILLA', 'GENERAR_DOC_REACTIVO', 'GENERAR_DOC_VOLUMETRICO', 'GENERAR_DOC_REFERENCIA'];
  tiposProducto = ['INSUMO', 'REACTIVO', 'EQUIPO', 'PAPELERIA'];
  tiposMovimiento = ['ENTRADA', 'SALIDA', 'AJUSTE'];

  // Estado para el modal de detalles
  logSeleccionadoSig = signal<LogAccionItem | null>(null);
  get logSeleccionado() { return this.logSeleccionadoSig(); }

  ngOnInit() {
    this.cargarAcciones();
  }

  // Métodos para cambiar tabs
  cambiarTab(tab: 'acciones' | 'movimientos' | 'estadisticas') {
    this.activaTab = tab;
    if (tab === 'acciones' && this.logsAcciones.length === 0) {
      this.cargarAcciones();
    } else if (tab === 'movimientos' && this.movimientosInventario.length === 0) {
      this.cargarMovimientos();
    } else if (tab === 'estadisticas' && !this.estadisticas) {
      this.cargarEstadisticas();
    }
  }

  // Cargar datos
  async cargarAcciones(mostrarLoading = true) {
    if (mostrarLoading) {
      this.cargandoAccionesSig.set(true);
    }
    try {
      // Preparar filtros para el servicio
      const filtrosParaServicio: Record<string, unknown> = { ...this.filtrosAcciones };
      
      // Convertir usuario_id a number si no está vacío
      if (filtrosParaServicio['usuario_id'] && filtrosParaServicio['usuario_id'] !== '') {
        filtrosParaServicio['usuario_id'] = Number(filtrosParaServicio['usuario_id']);
      } else {
        delete filtrosParaServicio['usuario_id'];
      }
      
      // Eliminar campos vacíos
      Object.keys(filtrosParaServicio).forEach(key => {
        if (filtrosParaServicio[key] === '' || filtrosParaServicio[key] === null) {
          delete filtrosParaServicio[key];
        }
      });

      const response = await logsService.getLogsAcciones(filtrosParaServicio);
      this.logsAccionesSig.set((response.data || []) as LogAccionItem[]);
      
      if (response.pagination) {
        this.filtrosAccionesSig.update(filtros => ({
          ...filtros,
          page: response.pagination.page
        }));
      }
      
      this.paginacionAccionesSig.set(response.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error cargando logs de acciones:', error);
    } finally {
      if (mostrarLoading) {
        this.cargandoAccionesSig.set(false);
      }
    }
  }

  // Modal de detalles
  verDetallesLog(log: LogAccionItem) {
    this.logSeleccionadoSig.set(log);
  }

  cerrarModalDetalles() {
    this.logSeleccionadoSig.set(null);
  }

  async descargarLogsAccionesPdf() {
    const filtrosParaServicio: Record<string, unknown> = { ...this.filtrosAcciones };
    if (filtrosParaServicio['usuario_id'] && filtrosParaServicio['usuario_id'] !== '') {
      filtrosParaServicio['usuario_id'] = Number(filtrosParaServicio['usuario_id']);
    } else {
      delete filtrosParaServicio['usuario_id'];
    }
    Object.keys(filtrosParaServicio).forEach(key => {
      if (filtrosParaServicio[key] === '' || filtrosParaServicio[key] === null) {
        delete filtrosParaServicio[key];
      }
    });
    filtrosParaServicio['page'] = 1;
    filtrosParaServicio['limit'] = Math.max(this.paginacionAcciones.total || 0, this.logsAcciones.length, 50);

    let logs: LogAccionItem[] = this.logsAcciones as LogAccionItem[];
    try {
      const response = await logsService.getLogsAcciones(filtrosParaServicio);
      logs = (response?.data || []) as LogAccionItem[];
    } catch {
      logs = this.logsAcciones as LogAccionItem[];
    }

    if (!logs.length) return;

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 42;
    const contentWidth = pageWidth - (marginX * 2);
    let y = 42;

    const addPageIfNeeded = (requiredHeight: number) => {
      if (y + requiredHeight <= pageHeight - 42) return;
      pdf.addPage();
      y = 42;
    };

    pdf.setFillColor(0, 31, 91);
    pdf.rect(0, 0, pageWidth, 96, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Reporte de Auditoría', marginX, 38);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text('Log completo de acciones del sistema', marginX, 56);
    pdf.text(`Generado: ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date())}`, marginX, 74);

    y = 110;
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(marginX, y, contentWidth, 30, 8, 8, 'F');
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Total de registros: ${logs.length}`, marginX + 12, y + 19);
    y += 44;

    const headers = ['Fecha/Hora', 'Usuario', 'Módulo', 'Acción', 'Descripción'];
    const widths = [108, 100, 82, 82, contentWidth - 372];
    const drawHeader = () => {
      addPageIfNeeded(28);
      let x = marginX;
      pdf.setFillColor(15, 23, 42);
      pdf.rect(marginX, y, contentWidth, 24, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      headers.forEach((h, i) => {
        pdf.text(h, x + 6, y + 15);
        x += widths[i];
      });
      y += 24;
    };

    drawHeader();

    logs.forEach((row, idx) => {
      const fecha = this.formatearFecha(String(row['fecha'] || ''));
      const usuario = this.stringifyValue(row['usuario_nombre'] || row['usuario_email'] || 'N/A');
      const modulo = this.stringifyValue(row['modulo']);
      const accion = this.getAccionLabel(String(row['accion'] || ''));
      const descripcion = this.stringifyValue(this.getAccionDescripcion(row));
      const values = [fecha, usuario, modulo, accion, descripcion];
      const linesByCell = values.map((v, i) => pdf.splitTextToSize((v || '—').toString(), widths[i] - 10) as string[]);
      const maxLines = Math.max(...linesByCell.map(lines => lines.length), 1);
      const rowHeight = Math.max(22, (maxLines * 12) + 8);
      addPageIfNeeded(rowHeight + 2);
      if (y > pageHeight - 70) {
        pdf.addPage();
        y = 42;
        drawHeader();
      }
      let x = marginX;
      const bg = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      pdf.setFillColor(bg[0], bg[1], bg[2]);
      pdf.rect(marginX, y, contentWidth, rowHeight, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(marginX, y, contentWidth, rowHeight, 'S');
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      linesByCell.forEach((lines, i) => {
        pdf.text(lines, x + 6, y + 13);
        x += widths[i];
      });
      y += rowHeight;
    });

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    addPageIfNeeded(24);
    pdf.text('LIBA Software · Auditoría', marginX, pageHeight - 24);

    const fechaArchivo = this.sanitizeFileName(new Date().toISOString());
    pdf.save(`auditoria_logs_acciones_${fechaArchivo}.pdf`);
  }

 async cargarMovimientos() {
  this.cargandoMovimientosSig.set(true);
  try {
    // Preparar filtros para el servicio (eliminar campos vacíos)
    const filtrosParaServicio: Record<string, unknown> = { ...this.filtrosMovimientos };
    Object.keys(filtrosParaServicio).forEach(key => {
      if (filtrosParaServicio[key] === '' || filtrosParaServicio[key] === null) {
        delete filtrosParaServicio[key];
      }
    });

    const response = await logsService.getMovimientosInventario(filtrosParaServicio);
    this.movimientosInventarioSig.set((response.data || []) as MovimientoInventarioItem[]);
    
    // ✅ CORREGIR: ACTUALIZAR LOS FILTROS CON LA PAGINACIÓN REAL DEL BACKEND
    if (response.pagination) {
      this.filtrosMovimientosSig.update(filtros => ({
        ...filtros,
        page: response.pagination.page // ← USAR LA PÁGINA REAL DEL BACKEND
      }));
    }
    
    this.paginacionMovimientosSig.set(response.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
  } catch (error) {
    console.error('Error cargando movimientos:', error);
  } finally {
    this.cargandoMovimientosSig.set(false);
  }
}

  async cargarEstadisticas() {
    this.cargandoEstadisticasSig.set(true);
    try {
      const response = await logsService.getEstadisticas();
      const data = (response?.data || {}) as Partial<EstadisticasData>;
      this.estadisticasSig.set({
        estadisticas: Array.isArray(data.estadisticas) ? data.estadisticas : [],
        accionesFrecuentes: Array.isArray(data.accionesFrecuentes) ? data.accionesFrecuentes : []
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      this.cargandoEstadisticasSig.set(false);
    }
  }

  // Métodos para filtros
  actualizarFiltroAcciones(campo: string, valor: unknown) {
    this.filtrosAccionesSig.update(filtros => ({
      ...filtros,
      [campo]: valor,
      page: 1 // Resetear a primera página al filtrar
    }));
    this.cargarAcciones();
  }

  actualizarFiltroMovimientos(campo: string, valor: unknown) {
    this.filtrosMovimientosSig.update(filtros => ({
      ...filtros,
      [campo]: valor,
      page: 1
    }));
    this.cargarMovimientos();
  }

  // Aplicar filtros
  aplicarFiltrosAcciones() {
    this.cargarAcciones();
  }

  aplicarFiltrosMovimientos() {
    this.cargarMovimientos();
  }

  // Limpiar filtros
  limpiarFiltrosAcciones() {
    this.filtrosAccionesSig.set({
      page: 1,
      limit: 10,
      modulo: '',
      accion: '',
      usuario_id: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    this.cargarAcciones();
  }

  limpiarFiltrosMovimientos() {
    this.filtrosMovimientosSig.set({
      page: 1,
      limit: 50,
      producto_tipo: '',
      tipo_movimiento: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    this.cargarMovimientos();
  }

  // Navegación de páginas
cambiarPaginaAcciones(pagina: number) {
  this.filtrosAccionesSig.update(filtros => ({
    ...filtros,
    page: pagina
  }));
  this.cargarAcciones(false);
}

cambiarPaginaMovimientos(pagina: number) {
  this.filtrosMovimientosSig.update(filtros => ({
    ...filtros,
    page: pagina
  }));
  this.cargarMovimientos();
  this.scrollToTopAuditoria();
}

  private scrollToTopAuditoria() {
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollTop = 0;
    }
  }

  // Formatear fecha para display
  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    
    // Formatear a hora colombiana (UTC-5)
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(',', '');
  }

  // Obtener clase CSS para tipo de acción
  getClaseAccion(accion: string | undefined): string {
    const accionVal = (accion || '').toString();
    const clases: Record<string, string> = {
      'CREAR': 'status-good',
      'ACTUALIZAR': 'status-warning',
      'ELIMINAR': 'status-critical',
      'SUBIR_PDF': 'status-good',
      'ELIMINAR_PDF': 'status-critical',
      'AJUSTAR_EXISTENCIAS': 'status-warning',
      'CONSUMO': 'status-critical',
      'SUBIR_PLANTILLA': 'status-good',
      'ELIMINAR_PLANTILLA': 'status-critical',
      'GENERAR_DOC_PLANTILLA': 'status-neutral',
      'GENERAR_DOC_REACTIVO': 'status-neutral',
      'GENERAR_DOC_VOLUMETRICO': 'status-neutral',
      'GENERAR_DOC_REFERENCIA': 'status-neutral'
    };
    return clases[accionVal] || 'status-neutral';
  }

  getClaseMovimiento(tipo: string | undefined): string {
    const tipoVal = (tipo || '').toString();
    const clases: Record<string, string> = {
      'ENTRADA': 'status-good',
      'SALIDA': 'status-critical',
      'AJUSTE': 'status-warning'
    };
    return clases[tipoVal] || 'status-neutral';
  }

  getAccionLabel(accion: string | undefined): string {
    const accionVal = (accion || '').toString();
    const labels: Record<string, string> = {
      CREAR: 'Creación',
      ACTUALIZAR: 'Actualización',
      ELIMINAR: 'Eliminación',
      SUBIR_PDF: 'Documento subido',
      ELIMINAR_PDF: 'Documento eliminado',
      CREAR_ENCUESTA: 'Encuesta registrada',
      AJUSTAR_EXISTENCIAS: 'Ajuste de existencias',
      CONSUMO: 'Consumo registrado',
      SUBIR_PLANTILLA: 'Plantilla subida',
      ELIMINAR_PLANTILLA: 'Plantilla eliminada',
      GENERAR_DOC_PLANTILLA: 'Documento generado (plantilla)',
      GENERAR_DOC_REACTIVO: 'Documento generado (reactivos)',
      GENERAR_DOC_VOLUMETRICO: 'Documento generado (volumétricos)',
      GENERAR_DOC_REFERENCIA: 'Documento generado (referencia)'
    };
    return labels[accionVal] || this.humanizeKey(accionVal);
  }

  getAccionDescripcion(log: LogAccionItem): string {
    const logData = this.asRecord(log) || {};
    const accion = (log.accion || '').toString();
    const modulo = (log.modulo || '').toString();
    const descripcion = (log.descripcion || '').toString().trim();
    const descHuman = this.humanizeDescripcionTexto(descripcion);
    const detalle = this.getDetalleNormalizado(log);
    const cambios = this.getCambios(detalle);
    const elemento = this.getElementoLabel(log);
    const descLower = descripcion.toLowerCase();
    const d = this.asRecord(detalle) || {};
    const target = this.getTargetInfo(logData, d, descripcion, modulo);
    const baseEntidad = this.getModuloEntidadBase(modulo);
    let entidad = this.formatEntidad(baseEntidad, target);
    if (entidad === baseEntidad && elemento) entidad = elemento;
    const deEntidad = this.toDeEntidad(entidad);
    const archivo = this.stringifyValue(this.pickFrom(d, logData, ['archivo', 'nombre_archivo', 'filename', 'file_name', 'documento', 'pdf']));
    const cantidad = this.stringifyValue(this.pickFrom(d, logData, ['cantidad', 'cantidad_total', 'unidades', 'stock', 'existencias', 'nuevo_stock']));
    const encuesta = this.stringifyValue(this.pickFrom(d, logData, ['encuesta', 'encuesta_nombre', 'titulo', 'nombre_encuesta']));

    if (accion === 'ACTUALIZAR') {
      const cambioEstado = cambios.find(c => c.campo === 'Estado');
      if (cambioEstado) {
        return `Se cambió el estado ${deEntidad} a ${cambioEstado.despues}.`;
      }
      if (descLower.includes('cambio de estado')) {
        return `Se actualizó el estado ${deEntidad}.`;
      }
      if (entidad) return `Se actualizó ${entidad}.`;
      return `Se actualizó información en ${modulo || 'el sistema'}.`;
    }
    if (accion === 'CREAR') {
      if (entidad) return `Se registró ${entidad}.`;
      return `Se registró un nuevo elemento en ${modulo || 'el sistema'}.`;
    }
    if (accion === 'ELIMINAR') {
      if (entidad) return `Se eliminó ${entidad}.`;
      return `Se eliminó un elemento en ${modulo || 'el sistema'}.`;
    }
    const templates: Record<string, string> = {
      CREAR: `Se registró un nuevo elemento en ${modulo || 'el sistema'}.`,
      ACTUALIZAR: `Se actualizó información en ${modulo || 'el sistema'}.`,
      ELIMINAR: `Se eliminó un elemento en ${modulo || 'el sistema'}.`,
      SUBIR_PDF: `Se subió un documento en ${modulo || 'el sistema'}.`,
      ELIMINAR_PDF: `Se eliminó un documento en ${modulo || 'el sistema'}.`,
      CREAR_ENCUESTA: `Se registró una encuesta en ${modulo || 'el sistema'}.`,
      AJUSTAR_EXISTENCIAS: `Se ajustaron existencias en ${modulo || 'el sistema'}.`,
      CONSUMO: `Se registró un consumo en ${modulo || 'el sistema'}.`,
      SUBIR_PLANTILLA: `Se subió una plantilla en ${modulo || 'el sistema'}.`,
      ELIMINAR_PLANTILLA: `Se eliminó una plantilla en ${modulo || 'el sistema'}.`,
      GENERAR_DOC_PLANTILLA: `Se generó un documento en ${modulo || 'el sistema'}.`,
      GENERAR_DOC_REACTIVO: `Se generó un documento en ${modulo || 'el sistema'}.`,
      GENERAR_DOC_VOLUMETRICO: `Se generó un documento en ${modulo || 'el sistema'}.`,
      GENERAR_DOC_REFERENCIA: `Se generó un documento en ${modulo || 'el sistema'}.`
    };
    if (accion === 'SUBIR_PDF') {
      if (descHuman) return descHuman.endsWith('.') ? descHuman : `${descHuman}.`;
      const archivoPart = archivo && archivo !== '—' ? ` (${archivo})` : '';
      if (entidad) return `Se subió un documento${archivoPart} para ${entidad}.`;
      return templates[accion];
    }
    if (accion === 'ELIMINAR_PDF') {
      if (descHuman) return descHuman.endsWith('.') ? descHuman : `${descHuman}.`;
      const archivoPart = archivo && archivo !== '—' ? ` (${archivo})` : '';
      if (entidad) return `Se eliminó un documento${archivoPart} ${deEntidad}.`;
      return templates[accion];
    }
    if (accion === 'CREAR_ENCUESTA') {
      const encuestaPart = encuesta && encuesta !== '—' ? ` (${encuesta})` : '';
      if (entidad) return `Se registró una encuesta${encuestaPart} para ${entidad}.`;
      return templates[accion];
    }
    if (accion === 'AJUSTAR_EXISTENCIAS') {
      if (entidad && cantidad && cantidad !== '—') return `Se ajustaron existencias ${deEntidad} a ${cantidad}.`;
      if (entidad) return `Se ajustaron existencias ${deEntidad}.`;
      return templates[accion];
    }
    if (accion === 'CONSUMO') {
      if (entidad && cantidad && cantidad !== '—') return `Se registró un consumo de ${cantidad} para ${entidad}.`;
      if (entidad) return `Se registró un consumo para ${entidad}.`;
      return templates[accion];
    }
    if (accion === 'SUBIR_PLANTILLA') {
      if (entidad) return `Se subió una plantilla para ${entidad}.`;
      return templates[accion];
    }
    if (accion === 'ELIMINAR_PLANTILLA') {
      if (entidad) return `Se eliminó una plantilla ${deEntidad}.`;
      return templates[accion];
    }
    if (accion === 'GENERAR_DOC_PLANTILLA' || accion === 'GENERAR_DOC_REACTIVO' || accion === 'GENERAR_DOC_VOLUMETRICO' || accion === 'GENERAR_DOC_REFERENCIA') {
      if (entidad) return `Se generó un documento para ${entidad}.`;
      return templates[accion];
    }
    return descHuman || templates[accion] || 'Se registró una acción del sistema.';
  }

  private humanizeDescripcionTexto(descripcion: string): string {
    const s = (descripcion || '').toString().trim();
    if (!s) return '';
    const mEstadoUsuario = s.match(/cambio\s+de\s+estado\s+usuario\s*:\s*(\d{2,})/i);
    if (mEstadoUsuario) return `Cambio de estado del usuario con id ${mEstadoUsuario[1]}`;

    const m = s.match(/^(creaci[oó]n|eliminaci[oó]n|actualizaci[oó]n|cambio\s+de\s+estado)\s+([a-záéíóúñ_ ]+?)\s*:\s*(\d+)\s*$/i);
    if (m) {
      const accionTxt = this.capitalize(m[1].toLowerCase());
      const entidadTxt = this.humanizeKey(m[2]).toLowerCase();
      const id = m[3];
      if (entidadTxt === 'usuario') return `${accionTxt} del usuario con id ${id}`;
      if (entidadTxt.endsWith('a')) return `${accionTxt} de la ${entidadTxt} con id ${id}`;
      return `${accionTxt} del ${entidadTxt} con id ${id}`;
    }
    return s;
  }

  private getModuloFieldConfig(modulo: string): LogFieldConfig {
    const mod = (modulo || '').toString().trim();
    if (mod === 'USUARIOS') {
      return {
        nombreKeys: ['usuario_nombre', 'nombre_usuario', 'nombre', 'target_usuario_nombre', 'afectado_nombre'],
        codigoKeys: ['usuario_codigo', 'codigo', 'numero_identificacion', 'documento'],
        emailKeys: ['usuario_email', 'email', 'correo', 'correo_electronico', 'usuario'],
        idKeys: ['usuario_id', 'id_usuario', 'target_usuario_id', 'afectado_id', 'id'],
        includeId: true
      };
    }
    if (mod === 'EQUIPOS') {
      return {
        nombreKeys: ['nombre', 'equipo_nombre', 'marca', 'modelo'],
        codigoKeys: ['codigo_identificacion', 'codigo', 'matricula', 'serie'],
        emailKeys: [],
        idKeys: ['id'],
        includeId: false
      };
    }
    if (mod === 'INSUMOS') {
      return {
        nombreKeys: ['nombre', 'insumo_nombre', 'marca', 'presentacion'],
        codigoKeys: ['id', 'insumo_id', 'id_insumo', 'codigo', 'referencia'],
        emailKeys: [],
        idKeys: ['id', 'insumo_id', 'id_insumo'],
        includeId: false
      };
    }
    if (mod === 'PAPELERIA') {
      return {
        nombreKeys: ['nombre', 'papeleria_nombre', 'marca', 'presentacion'],
        codigoKeys: ['id', 'papeleria_id', 'id_papeleria', 'codigo', 'referencia'],
        emailKeys: [],
        idKeys: ['id', 'papeleria_id', 'id_papeleria'],
        includeId: false
      };
    }
    if (mod === 'REACTIVOS') {
      return {
        nombreKeys: ['nombre', 'reactivo_nombre', 'nombre_reactivo', 'marca', 'presentacion'],
        codigoKeys: ['codigo', 'reactivo_codigo', 'lote', 'referencia', 'id', 'reactivo_id', 'id_reactivo'],
        emailKeys: [],
        idKeys: ['id', 'reactivo_id', 'id_reactivo'],
        includeId: false
      };
    }
    if (mod === 'CATALOGO_REACTIVOS') {
      return {
        nombreKeys: ['nombre', 'reactivo_nombre', 'nombre_reactivo', 'catalogo_nombre'],
        codigoKeys: ['codigo', 'reactivo_codigo', 'catalogo_codigo', 'referencia', 'id'],
        emailKeys: [],
        idKeys: ['id', 'reactivo_id', 'id_reactivo'],
        includeId: false
      };
    }
    if (mod === 'SOLICITUDES') {
      return {
        nombreKeys: ['nombre_solicitante', 'razon_social', 'cliente_nombre', 'nombre_muestra'],
        codigoKeys: ['numero_solicitud_front', 'numero', 'codigo', 'id'],
        emailKeys: ['email', 'correo', 'correo_electronico'],
        idKeys: ['id', 'solicitud_id'],
        includeId: false
      };
    }
    if (mod === 'CLIENTES') {
      return {
        nombreKeys: ['razon_social', 'nombre_solicitante', 'nombre', 'cliente_nombre'],
        codigoKeys: ['numero_identificacion', 'nit', 'codigo', 'id'],
        emailKeys: ['email', 'correo', 'correo_electronico'],
        idKeys: ['id', 'cliente_id'],
        includeId: false
      };
    }
    if (mod === 'MAT_VOLUMETRICOS') {
      return {
        nombreKeys: ['nombre_material', 'nombre', 'material_nombre', 'material', 'marca', 'modelo'],
        codigoKeys: ['codigo', 'codigo_id', 'codigo_material', 'material_codigo', 'id_material', 'codigoMaterial', 'serie', 'id'],
        emailKeys: [],
        idKeys: ['id'],
        includeId: false
      };
    }
    if (mod === 'VOLUMETRICOS') {
      return {
        nombreKeys: ['nombre_material', 'nombre', 'material_nombre', 'material', 'marca', 'modelo'],
        codigoKeys: ['codigo', 'codigo_id', 'codigo_material', 'material_codigo', 'id_material', 'codigoMaterial', 'serie', 'id'],
        emailKeys: [],
        idKeys: ['id', 'plantilla_id'],
        includeId: false
      };
    }
    if (mod === 'MAT_REFERENCIA') {
      return {
        nombreKeys: ['nombre_material', 'nombre_referencia', 'nombre', 'material_nombre', 'material', 'marca', 'modelo', 'serie', 'descripcion'],
        codigoKeys: ['codigo', 'codigo_id', 'codigo_material', 'material_codigo', 'id_material', 'codigoMaterial', 'serie', 'referencia', 'id'],
        emailKeys: [],
        idKeys: ['id'],
        includeId: false
      };
    }
    if (mod === 'REFERENCIA') {
      return {
        nombreKeys: ['nombre_material', 'nombre_referencia', 'nombre', 'material_nombre', 'material', 'marca', 'modelo', 'serie', 'descripcion'],
        codigoKeys: ['codigo', 'codigo_id', 'codigo_material', 'material_codigo', 'id_material', 'codigoMaterial', 'serie', 'referencia', 'id'],
        emailKeys: [],
        idKeys: ['id', 'plantilla_id'],
        includeId: false
      };
    }
    return {
      nombreKeys: ['nombre', 'descripcion', 'marca', 'modelo', 'razon_social'],
      codigoKeys: ['codigo', 'referencia', 'numero', 'id'],
      emailKeys: ['email', 'correo', 'correo_electronico'],
      idKeys: ['id'],
      includeId: false
    };
  }

  private getTargetInfo(log: Record<string, unknown>, d: Record<string, unknown>, descripcion: string, modulo: string): TargetInfo {
    const cfg = this.getModuloFieldConfig(modulo);
    const rawDesc = (descripcion || '').toString().trim();
    const codigoFromDesc = (() => {
      const m = rawDesc.match(/:\s*([^:]+?)\s*$/);
      if (!m) return '';
      return (m[1] || '').toString().trim();
    })();
    const idFromDesc = (() => {
      const m = rawDesc.match(/(\d+)/);
      return m ? m[1] : '';
    })();

    const nombreRaw = this.pickFrom(d, log, cfg.nombreKeys) ?? this.extractNombreFromDescripcion(rawDesc);
    const codigoRaw = this.pickFrom(d, log, cfg.codigoKeys) ?? (codigoFromDesc || undefined);
    const emailRaw = cfg.emailKeys.length > 0 ? this.pickFrom(d, log, cfg.emailKeys) : undefined;
    const idRaw = cfg.includeId
      ? (this.pickFrom(d, log, cfg.idKeys) ?? idFromDesc)
      : (this.pickFrom(d, log, cfg.idKeys) ?? '');

    const nombre = this.toMeaningfulLabel(nombreRaw);
    const codigo = this.toMeaningfulLabel(codigoRaw);
    const email = this.toMeaningfulLabel(emailRaw);
    const id = idRaw !== undefined && idRaw !== null ? this.toMeaningfulLabel(idRaw) : '';
    return { nombre, codigo, email, id };
  }

  private getModuloEntidadBase(modulo: string): string {
    const moduloLabelMap: Record<string, string> = {
      INSUMOS: 'el insumo',
      PAPELERIA: 'la papelería',
      REACTIVOS: 'el reactivo',
      EQUIPOS: 'el equipo',
      SOLICITUDES: 'la solicitud',
      CLIENTES: 'el cliente',
      CATALOGO_INSUMOS: 'el catálogo de insumos',
      CATALOGO_REACTIVOS: 'el catálogo de reactivos',
      MAT_REFERENCIA: 'el material de referencia',
      REFERENCIA: 'el material de referencia',
      MAT_VOLUMETRICOS: 'el material volumétrico',
      VOLUMETRICOS: 'el material volumétrico',
      USUARIOS: 'el usuario'
    };
    return moduloLabelMap[(modulo || '').toString().trim()] || 'el elemento';
  }

  private formatEntidad(base: string, target: TargetInfo): string {
    const isUsuario = (base || '').toString().toLowerCase().includes('usuario');
    const parts: string[] = [];
    parts.push(base || 'el elemento');
    const nombre = this.toMeaningfulLabel(target?.nombre);
    const email = this.toMeaningfulLabel(target?.email);
    const codigo = this.toMeaningfulLabel(target?.codigo);
    const id = this.toMeaningfulLabel(target?.id);
    const label = isUsuario ? (nombre || email) : nombre;
    const redundantLabel = !isUsuario && this.isRedundantEntityLabel(base, label);
    if (label && codigo && !isUsuario && !redundantLabel && label.toLowerCase() !== codigo.toLowerCase()) {
      parts.push(`(${label} · código ${codigo})`);
    } else if (label && !redundantLabel) {
      const labelText = !isUsuario && !nombre && codigo ? `código ${codigo}` : label;
      parts.push(`(${labelText})`);
    } else if (codigo) {
      const codigoText = isUsuario ? codigo : `código ${codigo}`;
      parts.push(`(${codigoText})`);
    }
    if (isUsuario && id) parts.push(`con id ${id}`);
    if (!label && !codigo && id) parts.push(`con id ${id}`);
    return parts.join(' ').trim();
  }

  private normalizeEntityToken(value: string): string {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isRedundantEntityLabel(base: string, label: string): boolean {
    const labelNorm = this.normalizeEntityToken(label);
    if (!labelNorm) return false;
    const baseNorm = this.normalizeEntityToken(
      (base || '')
        .toString()
        .replace(/^(el|la|los|las)\s+/i, '')
        .trim()
    );
    if (!baseNorm) return false;
    if (labelNorm === baseNorm) return true;
    if (baseNorm.endsWith('s') && labelNorm === baseNorm.slice(0, -1)) return true;
    if (labelNorm.endsWith('s') && baseNorm === labelNorm.slice(0, -1)) return true;
    return false;
  }

  private toMeaningfulLabel(value: unknown): string {
    if (value === undefined || value === null) return '';
    const s = this.stringifyValue(value).trim();
    if (!s) return '';
    const normalized = s.toLowerCase();
    if (normalized === '—' || normalized === '-' || normalized === 'null' || normalized === 'undefined') return '';
    if (normalized === 'n/a' || normalized === 'na' || normalized === 'sin dato' || normalized === 'no aplica') return '';
    if (normalized === '{}' || normalized === '[]') return '';
    return s;
  }

  private toDeEntidad(entidad: string): string {
    const e = (entidad || '').toString().trim();
    if (!e) return 'del elemento';
    if (e.startsWith('el ')) return `del ${e.slice(3)}`;
    if (e.startsWith('la ')) return `de la ${e.slice(3)}`;
    return `de ${e}`;
  }

  private pickFrom(d: Record<string, unknown>, log: Record<string, unknown>, keys: string[]): unknown {
    for (const k of keys) {
      const v = d?.[k] ?? log?.[k];
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      return v;
    }
    return undefined;
  }

  private pickKeyFrom(d: Record<string, unknown>, log: Record<string, unknown>, keys: string[]): KeyValue | null {
    for (const k of keys) {
      const v = d?.[k] ?? log?.[k];
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      return { key: k, value: v };
    }
    return null;
  }

  private capitalize(s: string): string {
    const t = (s || '').toString();
    if (!t) return t;
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  getDetalleNormalizado(log: LogAccionItem): unknown {
    const raw = log.detalle;
    if (raw == null) return null;
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return null;
      try {
        return JSON.parse(s);
      } catch {
        return { detalle: s };
      }
    }
    return raw;
  }

  getCambios(detalle: unknown): Cambio[] {
    const d = this.asRecord(detalle);
    if (!d) return [];

    const cambios = d['cambios'];
    if (cambios && typeof cambios === 'object' && !Array.isArray(cambios)) {
      return Object.entries(cambios as Record<string, unknown>).map(([campo, v]) => {
        const cambio = this.asRecord(v) || {};
        const antes = cambio['antes'] ?? cambio['old'] ?? cambio['from'] ?? cambio['previous'] ?? '';
        const despues = cambio['despues'] ?? cambio['new'] ?? cambio['to'] ?? cambio['current'] ?? '';
        return { campo: this.humanizeKey(campo), antes: this.stringifyValue(antes), despues: this.stringifyValue(despues) };
      }).filter(r => r.antes !== r.despues);
    }

    const before = d['antes'] ?? d['before'] ?? d['old'] ?? d['prev'];
    const after = d['despues'] ?? d['after'] ?? d['new'] ?? d['next'];
    if (before && after && typeof before === 'object' && typeof after === 'object') {
      const beforeObj = this.asRecord(before);
      const afterObj = this.asRecord(after);
      if (!beforeObj || !afterObj) return [];
      const keys = new Set<string>([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
      const rows: { campo: string; antes: string; despues: string }[] = [];
      keys.forEach(k => {
        const a = beforeObj[k];
        const b = afterObj[k];
        const sa = this.stringifyValue(a);
        const sb = this.stringifyValue(b);
        if (sa !== sb) rows.push({ campo: this.humanizeKey(k), antes: sa, despues: sb });
      });
      return rows;
    }

    const anterior = d['anterior'] ?? d['old_value'] ?? d['valor_anterior'];
    const nuevo = d['nuevo'] ?? d['new_value'] ?? d['valor_nuevo'];
    if (anterior !== undefined && nuevo !== undefined && (typeof anterior !== 'object' && typeof nuevo !== 'object')) {
      const a = this.stringifyValue(anterior);
      const b = this.stringifyValue(nuevo);
      const isEstado = ['ACTIVO', 'INACTIVO'].includes((anterior ?? '').toString()) && ['ACTIVO', 'INACTIVO'].includes((nuevo ?? '').toString());
      return [{ campo: isEstado ? 'Estado' : 'Cambio', antes: a, despues: b }].filter(r => r.antes !== r.despues);
    }

    return [];
  }

  getDetallePairs(detalle: unknown, excludeKeys?: Set<string>): { label: string; value: string }[] {
    const d = this.asRecord(detalle);
    if (!d) return [];
    const ignored = new Set([
      'antes',
      'despues',
      'before',
      'after',
      'old',
      'new',
      'prev',
      'next',
      'cambios',
      'anterior',
      'nuevo',
      'old_value',
      'new_value',
      'valor_anterior',
      'valor_nuevo'
    ]);
    const pairs: { label: string; value: string }[] = [];
    Object.entries(d).forEach(([k, v]) => {
      if (excludeKeys?.has(k)) return;
      if (ignored.has(k)) return;
      if (k.endsWith('_id')) {
        const base = k.slice(0, -3);
        const altKeys = [
          `${base}_nombre`,
          `${base}_email`,
          `${base}_codigo`,
          `${base}_referencia`,
          `${base}_numero`,
          `${base}_label`
        ];
        if (altKeys.some(ak => d[ak] !== undefined && d[ak] !== null && String(d[ak]).trim() !== '')) {
          return;
        }
      }
      pairs.push({ label: this.humanizeKey(k), value: this.stringifyValue(v) });
    });
    return pairs;
  }

  getDetalleCardsModal(log: LogAccionItem): { label: string; value: string }[] {
    const detalle = this.getDetalleNormalizado(log);
    const d = this.asRecord(detalle) || {};
    const logData = this.asRecord(log) || {};
    const modulo = (log.modulo || '').toString().trim();
    const cfg = this.getModuloFieldConfig(modulo);
    const descripcion = (log.descripcion || '').toString();
    const target = this.getTargetInfo(logData, d, descripcion, modulo);
    const isUsuarios = modulo === 'USUARIOS';

    const idPick =
      this.pickKeyFrom(d, logData, cfg.idKeys) ??
      this.pickKeyFrom(d, logData, cfg.codigoKeys) ??
      this.pickKeyFrom(d, logData, ['id', 'codigo', 'codigo_id', 'codigo_material']);
    const nombrePick =
      this.pickKeyFrom(d, logData, cfg.nombreKeys) ??
      (cfg.emailKeys.length > 0 ? this.pickKeyFrom(d, logData, cfg.emailKeys) : null);

    const cards: { label: string; value: string }[] = [];

    const idFromDesc = this.extractIdFromDescripcion(descripcion);
    const idVal = this.stringifyValue(idPick?.value ?? target.id ?? target.codigo ?? idFromDesc ?? '');
    if (idVal && idVal !== '—') cards.push({ label: 'ID', value: idVal });

    const nombreFromDesc = this.extractNombreFromDescripcion(descripcion);
    const nombrePreferido = nombrePick?.value ?? target.nombre ?? nombreFromDesc ?? (isUsuarios ? target.email : '');
    const nameVal = this.stringifyValue(nombrePreferido);
    if (nameVal && nameVal !== '—' && nameVal !== idVal) cards.push({ label: 'Nombre', value: nameVal });

    return cards;
  }

  getDetalleExtrasModal(log: LogAccionItem): { label: string; value: string }[] {
    const detalle = this.getDetalleNormalizado(log);
    const d = this.asRecord(detalle) || {};
    const logData = this.asRecord(log) || {};
    const modulo = (log.modulo || '').toString().trim();
    const cfg = this.getModuloFieldConfig(modulo);
    const descripcion = (log.descripcion || '').toString();

    const idPick =
      this.pickKeyFrom(d, logData, cfg.idKeys) ??
      this.pickKeyFrom(d, logData, cfg.codigoKeys) ??
      this.pickKeyFrom(d, logData, ['id', 'codigo', 'codigo_id', 'codigo_material']);
    const nombrePick =
      this.pickKeyFrom(d, logData, cfg.nombreKeys) ??
      (cfg.emailKeys.length > 0 ? this.pickKeyFrom(d, logData, cfg.emailKeys) : null);

    const exclude = new Set<string>();
    if (idPick?.key) exclude.add(idPick.key);
    if (nombrePick?.key) exclude.add(nombrePick.key);

    const merged = { ...this.getLogExtraFields(log), ...(d || {}) };
    const pairs = this.getDetallePairs(merged, exclude);
    if (pairs.length > 0) return pairs;

    const descVal = this.stringifyValue(descripcion);
    if (descVal && descVal !== '—') return [{ label: 'Descripción', value: descVal }];
    return [];
  }

  private getLogExtraFields(log: LogAccionItem): Record<string, unknown> {
    const l = this.asRecord(log) || {};
    const ignored = new Set<string>([
      'id_log_accion',
      'fecha',
      'usuario_id',
      'usuario_nombre',
      'usuario_email',
      'modulo',
      'accion',
      'descripcion',
      'detalle'
    ]);
    const out: Record<string, unknown> = {};
    Object.keys(l).forEach(k => {
      if (ignored.has(k)) return;
      if (k.startsWith('usuario_')) return;
      const v = l[k];
      if (v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      out[k] = v;
    });
    return out;
  }

  private extractNombreFromDescripcion(descripcion: string): string {
    const s = (descripcion || '').toString().trim();
    if (!s) return '';
    const mParen = s.match(/\(([^()]{2,})\)\s*$/);
    if (mParen) return mParen[1].trim();
    const afterColon = s.includes(':') ? s.split(':').pop()?.trim() || '' : '';
    const mDash = afterColon.match(/-\s*([A-Za-zÁÉÍÓÚÑáéíóúñ].{2,})$/);
    if (mDash) return mDash[1].trim();
    if (afterColon && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(afterColon) && afterColon.length >= 3) return afterColon;
    return '';
  }

  private extractIdFromDescripcion(descripcion: string): string {
    const s = (descripcion || '').toString().trim();
    if (!s) return '';
    const mTail = s.match(/:\s*([A-Za-z0-9._-]+)\s*$/);
    if (mTail) return mTail[1].trim();
    const matches = s.match(/\b(\d+)\b/g);
    if (matches && matches.length) return matches[matches.length - 1].trim();
    return '';
  }

  private stringifyValue(v: unknown): string {
    if (v == null) return '—';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return '—';
      const human = this.humanizeDescripcionTexto(s);
      const enums: Record<string, string> = {
        ACTIVO: 'Activo',
        INACTIVO: 'Inactivo',
        ENTRADA: 'Entrada',
        SALIDA: 'Salida',
        AJUSTE: 'Ajuste'
      };
      return enums[s] || human;
    }
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') {
      const obj = this.asRecord(v);
      if (!obj) return String(v);
      const anterior = obj['anterior'] ?? obj['old'] ?? obj['before'] ?? obj['from'];
      const nuevo = obj['nuevo'] ?? obj['new'] ?? obj['after'] ?? obj['to'];
      if (anterior !== undefined && nuevo !== undefined && (typeof anterior !== 'object' && typeof nuevo !== 'object')) {
        return `Antes: ${this.stringifyValue(anterior)} · Después: ${this.stringifyValue(nuevo)}`;
      }

      const nombre = obj['nombre'] ?? obj['name'] ?? obj['label'];
      const codigo = obj['codigo'] ?? obj['referencia'] ?? obj['numero'] ?? obj['code'];
      if (nombre && codigo) return `${this.stringifyValue(nombre)} (${this.stringifyValue(codigo)})`;
      if (nombre) return this.stringifyValue(nombre);
      if (codigo) return this.stringifyValue(codigo);

      const scalarEntries = Object.entries(obj).filter(([, val]) => val == null || typeof val !== 'object');
      const nonIdScalarEntries = scalarEntries.filter(([k]) => k !== 'id' && !k.endsWith('_id'));
      const entries = nonIdScalarEntries.length > 0 ? nonIdScalarEntries : scalarEntries;
      if (entries.length > 0 && entries.length <= 4) {
        return entries
          .map(([k, val]) => `${this.humanizeKey(k)}: ${this.stringifyValue(val)}`)
          .join(' · ');
      }
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  getElementoLabel(log: LogAccionItem): string {
    const logData = this.asRecord(log) || {};
    const modulo = (log.modulo || '').toString().trim();
    const detalle = this.getDetalleNormalizado(log) || {};
    const d = this.asRecord(detalle) || {};
    const cfg = this.getModuloFieldConfig(modulo);
    const isUsuarios = (modulo || '').toString().trim() === 'USUARIOS';

    const pick = (keys: string[]): string => {
      for (const k of keys) {
        const val = d[k] ?? logData[k];
        if (val === undefined || val === null) continue;
        const s = this.stringifyValue(val);
        if (s && s !== '—') return s;
      }
      return '';
    };

    const idKey = Object.keys(d).find(k => k === 'id' || k.endsWith('_id'));
    const idVal = idKey ? d[idKey] : undefined;
    const id = (typeof idVal === 'number' || (typeof idVal === 'string' && idVal.trim() !== '' && !isNaN(Number(idVal))))
      ? Number(idVal)
      : null;

    const nombre = pick(cfg.nombreKeys);
    const codigo = pick(cfg.codigoKeys);
    const email = cfg.emailKeys.length > 0 ? pick(cfg.emailKeys) : '';

    const base = this.getModuloEntidadBase(modulo);
    const main = isUsuarios ? (nombre || email || codigo) : (nombre || codigo);
    if (!main && id == null) return '';

    const parts: string[] = [];
    parts.push(base);
    if (main) parts.push(main);
    if (id != null) parts.push(`#${id}`);
    return parts.join(' ');
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  private humanizeKey(key: string): string {
    const raw = (key || '').toString().trim();
    if (!raw) return '';
    const special: Record<string, string> = {
      id_log_accion: 'ID del log',
      id_movimiento: 'ID del movimiento',
      id_usuario: 'ID de usuario',
      usuario_id: 'ID de usuario',
      usuario_email: 'Correo del usuario',
      usuario_nombre: 'Usuario',
      producto_tipo: 'Tipo de producto',
      producto_referencia: 'Referencia',
      tipo_movimiento: 'Tipo de movimiento'
    };
    if (special[raw]) return special[raw];
    return raw
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private sanitizeFileName(value: string): string {
    return (value || '')
      .toString()
      .trim()
      .replace(/[^\w.-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'archivo';
  }
}

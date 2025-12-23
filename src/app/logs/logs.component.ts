import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { logsService } from '../services/logs.service';

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
  private filtrosAccionesSig = signal({
    page: 1,
    limit: 50,
    modulo: '',
    accion: '',
    usuario_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  get filtrosAcciones() { return this.filtrosAccionesSig(); }

  // Filtros para movimientos
  private filtrosMovimientosSig = signal({
    page: 1,
    limit: 50,
    producto_tipo: '',
    tipo_movimiento: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  get filtrosMovimientos() { return this.filtrosMovimientosSig(); }

  // Datos
  private logsAccionesSig = signal<any[]>([]);
  get logsAcciones() { return this.logsAccionesSig(); }

  private movimientosInventarioSig = signal<any[]>([]);
  get movimientosInventario() { return this.movimientosInventarioSig(); }

  private estadisticasSig = signal<any>(null);
  get estadisticas() { return this.estadisticasSig(); }

  // Estados de carga
  private cargandoAccionesSig = signal(false);
  get cargandoAcciones() { return this.cargandoAccionesSig(); }

  private cargandoMovimientosSig = signal(false);
  get cargandoMovimientos() { return this.cargandoMovimientosSig(); }

  private cargandoEstadisticasSig = signal(false);
  get cargandoEstadisticas() { return this.cargandoEstadisticasSig(); }

  // Paginación
  private paginacionAccionesSig = signal({ page: 1, limit: 50, total: 0, pages: 0 });
  get paginacionAcciones() { return this.paginacionAccionesSig(); }

  private paginacionMovimientosSig = signal({ page: 1, limit: 50, total: 0, pages: 0 });
  get paginacionMovimientos() { return this.paginacionMovimientosSig(); }

  // Opciones para filtros
  modulos = ['INSUMOS', 'PAPELERIA', 'REACTIVOS', 'SOLICITUDES', 'CLIENTES', 'CATALOGO_INSUMOS', 'CATALOGO_REACTIVOS', 'EQUIPOS', 'MAT_REFERENCIA', 'MAT_VOLUMETRICOS'];
  acciones = ['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'SUBIR_PDF', 'ELIMINAR_PDF', 'CREAR_ENCUESTA', 'AJUSTAR_EXISTENCIAS', 'CONSUMO'];
  tiposProducto = ['INSUMO', 'REACTIVO', 'EQUIPO', 'PAPELERIA'];
  tiposMovimiento = ['ENTRADA', 'SALIDA', 'AJUSTE'];

  // Estado para el modal de detalles
  logSeleccionadoSig = signal<any>(null);
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
  async cargarAcciones() {
    this.cargandoAccionesSig.set(true);
    try {
      // Preparar filtros para el servicio
      const filtrosParaServicio: any = { ...this.filtrosAcciones };
      
      // Convertir usuario_id a number si no está vacío
      if (filtrosParaServicio.usuario_id && filtrosParaServicio.usuario_id !== '') {
        filtrosParaServicio.usuario_id = Number(filtrosParaServicio.usuario_id);
      } else {
        delete filtrosParaServicio.usuario_id;
      }
      
      // Eliminar campos vacíos
      Object.keys(filtrosParaServicio).forEach(key => {
        if (filtrosParaServicio[key] === '' || filtrosParaServicio[key] === null) {
          delete filtrosParaServicio[key];
        }
      });

      const response = await logsService.getLogsAcciones(filtrosParaServicio);
      this.logsAccionesSig.set(response.data || []);
      
      if (response.pagination) {
        this.filtrosAccionesSig.update(filtros => ({
          ...filtros,
          page: response.pagination.page
        }));
      }
      
      this.paginacionAccionesSig.set(response.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error cargando logs de acciones:', error);
    } finally {
      this.cargandoAccionesSig.set(false);
    }
  }

  // Modal de detalles
  verDetallesLog(log: any) {
    this.logSeleccionadoSig.set(log);
  }

  cerrarModalDetalles() {
    this.logSeleccionadoSig.set(null);
  }

 async cargarMovimientos() {
  this.cargandoMovimientosSig.set(true);
  try {
    // Preparar filtros para el servicio (eliminar campos vacíos)
    const filtrosParaServicio: any = { ...this.filtrosMovimientos };
    Object.keys(filtrosParaServicio).forEach(key => {
      if (filtrosParaServicio[key] === '' || filtrosParaServicio[key] === null) {
        delete filtrosParaServicio[key];
      }
    });

    const response = await logsService.getMovimientosInventario(filtrosParaServicio);
    this.movimientosInventarioSig.set(response.data || []);
    
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
      this.estadisticasSig.set(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      this.cargandoEstadisticasSig.set(false);
    }
  }

  // Métodos para filtros
  actualizarFiltroAcciones(campo: string, valor: any) {
    this.filtrosAccionesSig.update(filtros => ({
      ...filtros,
      [campo]: valor,
      page: 1 // Resetear a primera página al filtrar
    }));
    this.cargarAcciones();
  }

  actualizarFiltroMovimientos(campo: string, valor: any) {
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
      limit: 50,
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
  this.cargarAcciones();
  this.scrollToTopAuditoria();
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
  formatearFecha(fecha: string): string {
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
  getClaseAccion(accion: string): string {
    const clases: { [key: string]: string } = {
      'CREAR': 'status-good',
      'ACTUALIZAR': 'status-warning',
      'ELIMINAR': 'status-critical',
      'SUBIR_PDF': 'status-good',
      'ELIMINAR_PDF': 'status-critical',
      'AJUSTAR_EXISTENCIAS': 'status-warning',
      'CONSUMO': 'status-critical'
    };
    return clases[accion] || 'status-neutral';
  }

  getClaseMovimiento(tipo: string): string {
    const clases: { [key: string]: string } = {
      'ENTRADA': 'status-good',
      'SALIDA': 'status-critical',
      'AJUSTE': 'status-warning'
    };
    return clases[tipo] || 'status-neutral';
  }

  getAccionLabel(accion: string): string {
    const labels: Record<string, string> = {
      CREAR: 'Creación',
      ACTUALIZAR: 'Actualización',
      ELIMINAR: 'Eliminación',
      SUBIR_PDF: 'Documento subido',
      ELIMINAR_PDF: 'Documento eliminado',
      CREAR_ENCUESTA: 'Encuesta registrada',
      AJUSTAR_EXISTENCIAS: 'Ajuste de existencias',
      CONSUMO: 'Consumo registrado'
    };
    return labels[accion] || this.humanizeKey(accion);
  }

  getAccionDescripcion(log: any): string {
    const accion = (log?.accion || '').toString();
    const modulo = (log?.modulo || '').toString();
    const descripcion = (log?.descripcion || '').toString().trim();
    const detalle = this.getDetalleNormalizado(log);
    const cambios = this.getCambios(detalle);
    const elemento = this.getElementoLabel(log);
    const descLower = descripcion.toLowerCase();
    const d = detalle && typeof detalle === 'object' ? detalle : {};
    const target = this.getTargetInfo(log, d, descripcion, modulo);
    const baseEntidad = this.getModuloEntidadBase(modulo);
    let entidad = this.formatEntidad(baseEntidad, target);
    if (entidad === baseEntidad && elemento) entidad = elemento;
    const deEntidad = this.toDeEntidad(entidad);
    const archivo = this.stringifyValue(this.pickFrom(d, log, ['archivo', 'nombre_archivo', 'filename', 'file_name', 'documento', 'pdf']));
    const cantidad = this.stringifyValue(this.pickFrom(d, log, ['cantidad', 'cantidad_total', 'unidades', 'stock', 'existencias', 'nuevo_stock']));
    const encuesta = this.stringifyValue(this.pickFrom(d, log, ['encuesta', 'encuesta_nombre', 'titulo', 'nombre_encuesta']));

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
      CONSUMO: `Se registró un consumo en ${modulo || 'el sistema'}.`
    };
    if (accion === 'SUBIR_PDF') {
      const archivoPart = archivo && archivo !== '—' ? ` (${archivo})` : '';
      if (entidad) return `Se subió un documento${archivoPart} para ${entidad}.`;
      return templates[accion];
    }
    if (accion === 'ELIMINAR_PDF') {
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
    const descHuman = this.humanizeDescripcionTexto(descripcion);
    return descHuman || templates[accion] || 'Se registró una acción del sistema.';
  }

  private humanizeDescripcionTexto(descripcion: string): string {
    const s = (descripcion || '').toString().trim();
    if (!s) return '';
    const mEstadoUsuario = s.match(/cambio\s+de\s+estado\s+usuario\s*:\s*(\d{2,})/i);
    if (mEstadoUsuario) return `Cambio de estado del usuario con id ${mEstadoUsuario[1]}`;

    const m = s.match(/^(creaci[oó]n|eliminaci[oó]n|actualizaci[oó]n|cambio\s+de\s+estado)\s+([a-záéíóúñ_ ]+?)\s*:\s*(\d{2,})\s*$/i);
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

  private getModuloFieldConfig(modulo: string): { nombreKeys: string[]; codigoKeys: string[]; emailKeys: string[]; idKeys: string[]; includeId: boolean } {
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
        nombreKeys: ['razon_social', 'nombre', 'cliente_nombre'],
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
    if (mod === 'MAT_REFERENCIA') {
      return {
        nombreKeys: ['nombre_material', 'nombre_referencia', 'nombre', 'material_nombre', 'material', 'marca', 'modelo', 'serie', 'descripcion'],
        codigoKeys: ['codigo', 'codigo_id', 'codigo_material', 'material_codigo', 'id_material', 'codigoMaterial', 'serie', 'referencia', 'id'],
        emailKeys: [],
        idKeys: ['id'],
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

  private getTargetInfo(log: any, d: any, descripcion: string, modulo: string): { nombre: string; codigo: string; email: string; id: string } {
    const cfg = this.getModuloFieldConfig(modulo);
    const rawDesc = (descripcion || '').toString().trim();
    const codigoFromDesc = (() => {
      const m = rawDesc.match(/:\s*([A-Za-z0-9._-]{2,})\s*$/);
      return m ? m[1] : '';
    })();
    const idFromDesc = (() => {
      const m = rawDesc.match(/(\d{2,})/);
      return m ? m[1] : '';
    })();

    const nombreRaw = this.pickFrom(d, log, cfg.nombreKeys);
    const codigoRaw = this.pickFrom(d, log, cfg.codigoKeys) ?? (codigoFromDesc || undefined);
    const emailRaw = cfg.emailKeys.length > 0 ? this.pickFrom(d, log, cfg.emailKeys) : undefined;
    const idRaw = cfg.includeId
      ? (this.pickFrom(d, log, cfg.idKeys) ?? idFromDesc)
      : (this.pickFrom(d, log, cfg.idKeys) ?? '');

    const nombre = nombreRaw !== undefined ? this.stringifyValue(nombreRaw) : '';
    const codigo = codigoRaw !== undefined ? this.stringifyValue(codigoRaw) : '';
    const email = emailRaw !== undefined ? this.stringifyValue(emailRaw) : '';
    const id = idRaw !== undefined && idRaw !== null && String(idRaw).trim() !== '' ? String(idRaw).trim() : '';
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
      MAT_VOLUMETRICOS: 'el material volumétrico',
      USUARIOS: 'el usuario'
    };
    return moduloLabelMap[(modulo || '').toString().trim()] || 'el elemento';
  }

  private formatEntidad(base: string, target: { nombre: string; codigo: string; email: string; id: string }): string {
    const isUsuario = (base || '').toString().toLowerCase().includes('usuario');
    const parts: string[] = [];
    parts.push(base || 'el elemento');
    const nombre = target?.nombre || '';
    const email = target?.email || '';
    const codigo = target?.codigo || '';
    const id = target?.id || '';
    const label = isUsuario ? (nombre || email) : (nombre || codigo);
    if (label) {
      const labelText = !isUsuario && !nombre && codigo ? `código ${codigo}` : label;
      parts.push(`(${labelText})`);
    }
    if (isUsuario && id) parts.push(`con id ${id}`);
    if (!label && id) parts.push(`con id ${id}`);
    return parts.join(' ').trim();
  }

  private toDeEntidad(entidad: string): string {
    const e = (entidad || '').toString().trim();
    if (!e) return 'del elemento';
    if (e.startsWith('el ')) return `del ${e.slice(3)}`;
    if (e.startsWith('la ')) return `de la ${e.slice(3)}`;
    return `de ${e}`;
  }

  private pickFrom(d: any, log: any, keys: string[]): any {
    for (const k of keys) {
      const v = d?.[k] ?? log?.[k];
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      return v;
    }
    return undefined;
  }

  private pickKeyFrom(d: any, log: any, keys: string[]): { key: string; value: any } | null {
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

  getDetalleNormalizado(log: any): any {
    const raw = log?.detalle;
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

  getCambios(detalle: any): Array<{ campo: string; antes: string; despues: string }> {
    const d = detalle;
    if (!d || typeof d !== 'object') return [];

    const cambios = (d as any).cambios;
    if (cambios && typeof cambios === 'object' && !Array.isArray(cambios)) {
      return Object.entries(cambios).map(([campo, v]: any) => {
        const antes = v?.antes ?? v?.old ?? v?.from ?? v?.previous ?? '';
        const despues = v?.despues ?? v?.new ?? v?.to ?? v?.current ?? '';
        return { campo: this.humanizeKey(campo), antes: this.stringifyValue(antes), despues: this.stringifyValue(despues) };
      }).filter(r => r.antes !== r.despues);
    }

    const before = (d as any).antes ?? (d as any).before ?? (d as any).old ?? (d as any).prev;
    const after = (d as any).despues ?? (d as any).after ?? (d as any).new ?? (d as any).next;
    if (before && after && typeof before === 'object' && typeof after === 'object') {
      const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
      const rows: Array<{ campo: string; antes: string; despues: string }> = [];
      keys.forEach(k => {
        const a = (before as any)[k];
        const b = (after as any)[k];
        const sa = this.stringifyValue(a);
        const sb = this.stringifyValue(b);
        if (sa !== sb) rows.push({ campo: this.humanizeKey(k), antes: sa, despues: sb });
      });
      return rows;
    }

    const anterior = (d as any).anterior ?? (d as any).old_value ?? (d as any).valor_anterior;
    const nuevo = (d as any).nuevo ?? (d as any).new_value ?? (d as any).valor_nuevo;
    if (anterior !== undefined && nuevo !== undefined && (typeof anterior !== 'object' && typeof nuevo !== 'object')) {
      const a = this.stringifyValue(anterior);
      const b = this.stringifyValue(nuevo);
      const isEstado = ['ACTIVO', 'INACTIVO'].includes((anterior ?? '').toString()) && ['ACTIVO', 'INACTIVO'].includes((nuevo ?? '').toString());
      return [{ campo: isEstado ? 'Estado' : 'Cambio', antes: a, despues: b }].filter(r => r.antes !== r.despues);
    }

    return [];
  }

  getDetallePairs(detalle: any, excludeKeys?: Set<string>): Array<{ label: string; value: string }> {
    const d = detalle;
    if (!d || typeof d !== 'object') return [];
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
    const pairs: Array<{ label: string; value: string }> = [];
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
        if (altKeys.some(ak => (d as any)[ak] !== undefined && (d as any)[ak] !== null && String((d as any)[ak]).trim() !== '')) {
          return;
        }
      }
      pairs.push({ label: this.humanizeKey(k), value: this.stringifyValue(v) });
    });
    return pairs;
  }

  getDetalleCardsModal(log: any): Array<{ label: string; value: string }> {
    const detalle = this.getDetalleNormalizado(log);
    const d = detalle && typeof detalle === 'object' ? detalle : {};
    const modulo = (log?.modulo || '').toString().trim();
    const cfg = this.getModuloFieldConfig(modulo);
    const descripcion = (log?.descripcion || '').toString();
    const target = this.getTargetInfo(log, d, descripcion, modulo);
    const isUsuarios = modulo === 'USUARIOS';

    const idPick =
      this.pickKeyFrom(d, log, cfg.idKeys) ??
      this.pickKeyFrom(d, log, cfg.codigoKeys) ??
      this.pickKeyFrom(d, log, ['id', 'codigo', 'codigo_id', 'codigo_material']);
    const nombrePick =
      this.pickKeyFrom(d, log, cfg.nombreKeys) ??
      (cfg.emailKeys.length > 0 ? this.pickKeyFrom(d, log, cfg.emailKeys) : null);

    const cards: Array<{ label: string; value: string }> = [];

    const idFromDesc = this.extractIdFromDescripcion(descripcion);
    const idVal = this.stringifyValue(idPick?.value ?? target.id ?? target.codigo ?? idFromDesc ?? '');
    if (idVal && idVal !== '—') cards.push({ label: 'ID', value: idVal });

    const nombreFromDesc = this.extractNombreFromDescripcion(descripcion);
    const nombrePreferido = nombrePick?.value ?? target.nombre ?? nombreFromDesc ?? (isUsuarios ? target.email : '');
    const nameVal = this.stringifyValue(nombrePreferido);
    if (nameVal && nameVal !== '—' && nameVal !== idVal) cards.push({ label: 'Nombre', value: nameVal });

    return cards;
  }

  getDetalleExtrasModal(log: any): Array<{ label: string; value: string }> {
    const detalle = this.getDetalleNormalizado(log);
    const d = detalle && typeof detalle === 'object' ? detalle : {};
    const modulo = (log?.modulo || '').toString().trim();
    const cfg = this.getModuloFieldConfig(modulo);
    const descripcion = (log?.descripcion || '').toString();

    const idPick =
      this.pickKeyFrom(d, log, cfg.idKeys) ??
      this.pickKeyFrom(d, log, cfg.codigoKeys) ??
      this.pickKeyFrom(d, log, ['id', 'codigo', 'codigo_id', 'codigo_material']);
    const nombrePick =
      this.pickKeyFrom(d, log, cfg.nombreKeys) ??
      (cfg.emailKeys.length > 0 ? this.pickKeyFrom(d, log, cfg.emailKeys) : null);

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

  private getLogExtraFields(log: any): Record<string, any> {
    const l = log && typeof log === 'object' ? log : {};
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
    const out: Record<string, any> = {};
    Object.keys(l).forEach(k => {
      if (ignored.has(k)) return;
      if (k.startsWith('usuario_')) return;
      const v = (l as any)[k];
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
    const mTail = s.match(/:\s*([A-Za-z0-9._-]{2,})\s*$/);
    if (mTail) return mTail[1].trim();
    const matches = s.match(/\b(\d{2,})\b/g);
    if (matches && matches.length) return matches[matches.length - 1].trim();
    return '';
  }

  private stringifyValue(v: any): string {
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
      const anterior = (v as any).anterior ?? (v as any).old ?? (v as any).before ?? (v as any).from;
      const nuevo = (v as any).nuevo ?? (v as any).new ?? (v as any).after ?? (v as any).to;
      if (anterior !== undefined && nuevo !== undefined && (typeof anterior !== 'object' && typeof nuevo !== 'object')) {
        return `Antes: ${this.stringifyValue(anterior)} · Después: ${this.stringifyValue(nuevo)}`;
      }

      const nombre = (v as any).nombre ?? (v as any).name ?? (v as any).label;
      const codigo = (v as any).codigo ?? (v as any).referencia ?? (v as any).numero ?? (v as any).code;
      if (nombre && codigo) return `${this.stringifyValue(nombre)} (${this.stringifyValue(codigo)})`;
      if (nombre) return this.stringifyValue(nombre);
      if (codigo) return this.stringifyValue(codigo);

      const scalarEntries = Object.entries(v).filter(([, val]) => val == null || typeof val !== 'object');
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

  getElementoLabel(log: any): string {
    const modulo = (log?.modulo || '').toString().trim();
    const detalle = this.getDetalleNormalizado(log) || {};
    const d = typeof detalle === 'object' ? detalle : {};
    const cfg = this.getModuloFieldConfig(modulo);
    const isUsuarios = (modulo || '').toString().trim() === 'USUARIOS';

    const pick = (keys: string[]): string => {
      for (const k of keys) {
        const val = (d as any)[k] ?? (log as any)?.[k];
        if (val === undefined || val === null) continue;
        const s = this.stringifyValue(val);
        if (s && s !== '—') return s;
      }
      return '';
    };

    const idKey = Object.keys(d).find(k => k === 'id' || k.endsWith('_id'));
    const idVal = idKey ? (d as any)[idKey] : undefined;
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
}

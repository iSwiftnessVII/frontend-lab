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

      console.log('Cargando logs con filtros:', filtrosParaServicio);
      const response = await logsService.getLogsAcciones(filtrosParaServicio);
      console.log('Logs recibidos:', response.data);
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

  async testVolumetricos() {
    try {
      console.log('Testing MAT_VOLUMETRICOS fetch...');
      const response = await logsService.getLogsAcciones({ modulo: 'MAT_VOLUMETRICOS' });
      console.log('Test result:', response);
      alert(`Test: Encontrados ${response.data?.length || 0} logs de MAT_VOLUMETRICOS. Revisar consola.`);
    } catch (e: any) {
      console.error('Test failed:', e);
      alert(`Test failed: ${e.message}`);
    }
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
}

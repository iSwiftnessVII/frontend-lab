import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService } from '../services/auth.service';
import { reactivosService } from '../services/reactivos.service';

@Component({
  standalone: true,
  selector: 'app-reactivos',
  templateUrl: './reactivos.component.html',
  styleUrls: ['./reactivos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ReactivosComponent implements OnInit {
  // Aux lists
  tipos: Array<any> = [];
  clasif: Array<any> = [];
  unidades: Array<any> = [];
  estado: Array<any> = [];
  recipiente: Array<any> = [];
  almacen: Array<any> = [];
  reactivoSeleccionado: any = null;
  mostrarDetalles: boolean = false;
  
  ngOnInit() {
    // La inicialización se realiza en el constructor a través del método init()
    // que carga los datos auxiliares para los selects
  }

  // Catálogo form
  catCodigo = '';
  catNombre = '';
  catTipo = '';
  catClasificacion = '';
  catDescripcion = '';
  catalogoMsg = '';

  // Catálogo búsqueda y selección
  catalogoQ = '';
  catalogoResultados: Array<any> = [];
  catalogoSeleccionado: any = null;
  catalogoCargando: boolean = false;
  // Base y listas filtradas para selects
  catalogoBase: Array<any> = [];
  catalogoCodigoResultados: Array<any> = [];
  catalogoNombreResultados: Array<any> = [];
  codigoFiltro: string = '';
  nombreFiltro: string = '';
  // Paginación del catálogo
  catalogoVisibleCount: number = 50;
  catalogoPageSize: number = 50;
  get catalogoResultadosPaginados(): Array<any> {
    return this.catalogoResultados.slice(0, this.catalogoVisibleCount);
  }

  // Gestión de PDFs
  hojaUrl: string | null = null;
  certUrl: string | null = null;
  hojaFile: File | null = null;
  certFile: File | null = null;
  hojaMsg = '';
  certMsg = '';

  // Reactivo form
  lote = '';
  codigo = '';
  nombre = '';
  marca = '';
  referencia = '';
  cas = '';
  presentacion: number | null = null;
  presentacion_cant: number | null = null;
  cantidad_total: number | null = null;
  fecha_adquisicion = '';
  fecha_vencimiento = '';
  observaciones = '';

  tipo_id: any = '';
  clasificacion_id: any = '';
  unidad_id: any = '';
  estado_id: any = '';
  almacenamiento_id: any = '';
  tipo_recipiente_id: any = '';

  reactivoMsg = '';

  // Lista de reactivos
  reactivos: Array<any> = [];
  reactivosQ = '';
  // Panel de catálogo dentro del formulario
  mostrarCatalogoFormPanel: boolean = false;
  // Mostrar/Ocultar tabla de catálogo
  mostrarTablaCatalogo: boolean = false;

  constructor() {
    this.init();
  }

  async init() {
    try {
      await this.loadAux();
      await this.loadReactivos();
      // Cargar catálogo base y mostrar todos desde el inicio
      await this.cargarCatalogoBase();
      this.catalogoResultados = this.catalogoBase.slice();
      this.catalogoVisibleCount = Math.min(this.catalogoPageSize, this.catalogoResultados.length);
    } catch (err) {
      console.error('Error inicializando Reactivos:', err);
    }
  }

  async loadAux() {
    const data = await reactivosService.aux();
    this.tipos = data.tipos || [];
    this.clasif = data.clasif || [];
    this.unidades = data.unidades || [];
    this.estado = data.estado || [];
    this.recipiente = data.recipiente || [];
    this.almacen = data.almacen || [];
  }

  async loadReactivos() {
    const rows = await reactivosService.listarReactivos(this.reactivosQ || '');
    this.reactivos = rows || [];
  }

  async buscarCatalogo() {
    const q = this.normalizarTexto(this.catalogoQ || '');
    if (!this.catalogoBase.length) {
      await this.cargarCatalogoBase();
    }
    this.catalogoCargando = true;
    try {
      if (!q) {
        this.catalogoResultados = this.catalogoBase.slice();
      } else {
        this.catalogoResultados = this.catalogoBase.filter(c =>
          this.normalizarTexto(c.codigo || '').includes(q) ||
          this.normalizarTexto(c.nombre || '').includes(q)
        );
      }
      this.catalogoVisibleCount = Math.min(this.catalogoPageSize, this.catalogoResultados.length);
    } finally {
      this.catalogoCargando = false;
    }
  }

  async cargarCatalogoBase() {
    const rows = await reactivosService.buscarCatalogo('');
    this.catalogoBase = rows || [];
    this.catalogoCodigoResultados = this.catalogoBase.slice();
    this.catalogoNombreResultados = this.catalogoBase.slice();
    this.catalogoResultados = this.catalogoBase.slice();
    this.catalogoVisibleCount = Math.min(this.catalogoPageSize, this.catalogoResultados.length);
  }

  seleccionarCatalogo(item: any) {
    this.catalogoSeleccionado = item;
    // Rellenar campos del formulario reactivo
    this.codigo = item.codigo || '';
    this.nombre = item.nombre || '';
    // Mapear tipo/clasificación por nombre a IDs de tablas auxiliares
    const tipo = this.tipos.find(t => (t.nombre || '').toLowerCase().trim() === (item.tipo_reactivo || '').toLowerCase().trim());
    const clasif = this.clasif.find(c => (c.nombre || '').toLowerCase().trim() === (item.clasificacion_sga || '').toLowerCase().trim());
    this.tipo_id = tipo ? tipo.id : '';
    this.clasificacion_id = clasif ? clasif.id : '';

    // Cargar PDFs existentes
    this.loadDocs(item.codigo);
    // Ocultar panel de catálogo embebido
    this.mostrarCatalogoFormPanel = false;
  }

  filtrarCatalogoCodigo() {
    const q = this.normalizarTexto(this.codigoFiltro || '');
    if (!q) {
      this.catalogoCodigoResultados = this.catalogoBase.slice();
    } else {
      this.catalogoCodigoResultados = this.catalogoBase.filter(c => this.normalizarTexto(c.codigo || '').startsWith(q));
    }
  }

  filtrarCatalogoNombre() {
    const q = this.normalizarTexto(this.nombreFiltro || '');
    if (!q) {
      this.catalogoNombreResultados = this.catalogoBase.slice();
    } else {
      this.catalogoNombreResultados = this.catalogoBase.filter(c => this.normalizarTexto(c.nombre || '').includes(q));
    }
  }

  filtrarCatalogoPorCampos() {
    const codeQ = this.normalizarTexto(this.codigoFiltro || '');
    const nameQ = this.normalizarTexto(this.nombreFiltro || '');
    let results = this.catalogoBase.slice();
    if (codeQ) {
      results = results.filter(c => this.normalizarTexto(c.codigo || '').includes(codeQ));
    }
    if (nameQ) {
      results = results.filter(c => this.normalizarTexto(c.nombre || '').includes(nameQ));
    }
    this.catalogoResultados = results;
    this.catalogoVisibleCount = Math.min(this.catalogoPageSize, this.catalogoResultados.length);
  }

  normalizarTexto(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  cargarMasCatalogo() {
    const next = this.catalogoVisibleCount + this.catalogoPageSize;
    this.catalogoVisibleCount = Math.min(next, this.catalogoResultados.length);
  }

  // --- Acciones PDF en tabla catálogo ---
  async onSubirHojaCatalogo(ev: any, codigo: string) {
    const f = ev?.target?.files?.[0];
    if (!f) return;
    try {
      await reactivosService.subirHojaSeguridad(codigo, f);
      this.catalogoMsg = `Hoja de seguridad subida para ${codigo}`;
    } catch (e: any) {
      this.catalogoMsg = e?.message || 'Error subiendo hoja de seguridad';
    } finally {
      if (ev?.target) ev.target.value = '';
    }
  }
  async onEliminarHojaCatalogo(codigo: string) {
    if (!confirm('¿Eliminar hoja de seguridad?')) return;
    try {
      await reactivosService.eliminarHojaSeguridad(codigo);
      this.catalogoMsg = `Hoja de seguridad eliminada para ${codigo}`;
    } catch (e: any) {
      this.catalogoMsg = e?.message || 'Error eliminando hoja de seguridad';
    }
  }
  async onSubirCertCatalogo(ev: any, codigo: string) {
    const f = ev?.target?.files?.[0];
    if (!f) return;
    try {
      await reactivosService.subirCertAnalisis(codigo, f);
      this.catalogoMsg = `Certificado de análisis subido para ${codigo}`;
    } catch (e: any) {
      this.catalogoMsg = e?.message || 'Error subiendo certificado de análisis';
    } finally {
      if (ev?.target) ev.target.value = '';
    }
  }
  async onEliminarCertCatalogo(codigo: string) {
    if (!confirm('¿Eliminar certificado de análisis?')) return;
    try {
      await reactivosService.eliminarCertAnalisis(codigo);
      this.catalogoMsg = `Certificado de análisis eliminado para ${codigo}`;
    } catch (e: any) {
      this.catalogoMsg = e?.message || 'Error eliminando certificado de análisis';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  }

  mostrarDetallesReactivo(reactivo: any) {
    this.reactivoSeleccionado = reactivo;
    this.mostrarDetalles = true;
  }

  // Funciones auxiliares para obtener nombres descriptivos
  obtenerNombreTipo(id: any): string {
    const tipo = this.tipos.find(t => t.id == id);
    return tipo ? tipo.nombre : 'N/A';
  }

  obtenerNombreClasificacion(id: any): string {
    const clasif = this.clasif.find(c => c.id == id);
    return clasif ? clasif.nombre : 'N/A';
  }

  obtenerNombreUnidad(id: any): string {
    const unidad = this.unidades.find(u => u.id == id);
    return unidad ? unidad.nombre : 'N/A';
  }

  obtenerNombreEstado(id: any): string {
    const estado = this.estado.find(e => e.id == id);
    return estado ? estado.nombre : 'N/A';
  }

  obtenerNombreAlmacenamiento(id: any): string {
    const almacen = this.almacen.find(a => a.id == id);
    return almacen ? almacen.nombre : 'N/A';
  }

  obtenerNombreTipoRecipiente(id: any): string {
    const recipiente = this.recipiente.find(r => r.id == id);
    return recipiente ? recipiente.nombre : 'N/A';
  }

  async onVerHojaCatalogo(codigo: string) {
    try {
      const r = await reactivosService.obtenerHojaSeguridad(codigo);
      const url = r?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        this.catalogoMsg = 'Hoja de seguridad no disponible';
      }
    } catch (e: any) {
      this.catalogoMsg = e?.message || 'Hoja de seguridad no disponible';
    }
  }

  async onVerCertCatalogo(codigo: string) {
    try {
      const r = await reactivosService.obtenerCertAnalisis(codigo);
      const url = r?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        this.catalogoMsg = 'Certificado de análisis no disponible';
      }
    } catch (e: any) {
      this.catalogoMsg = e?.message || 'Certificado de análisis no disponible';
    }
  }

  onCodigoSeleccionado() {
    const item = this.catalogoBase.find(c => (c.codigo || '') === (this.codigo || ''));
    if (!item) return;
    this.catalogoSeleccionado = item;
    this.nombre = item.nombre || '';
    const tipo = this.tipos.find(t => (t.nombre || '').toLowerCase().trim() === (item.tipo_reactivo || '').toLowerCase().trim());
    const clasif = this.clasif.find(c => (c.nombre || '').toLowerCase().trim() === (item.clasificacion_sga || '').toLowerCase().trim());
    this.tipo_id = tipo ? tipo.id : '';
    this.clasificacion_id = clasif ? clasif.id : '';
    this.loadDocs(item.codigo);
  }

  onNombreSeleccionado() {
    const item = this.catalogoBase.find(c => (c.nombre || '') === (this.nombre || ''));
    if (!item) return;
    this.catalogoSeleccionado = item;
    this.codigo = item.codigo || '';
    const tipo = this.tipos.find(t => (t.nombre || '').toLowerCase().trim() === (item.tipo_reactivo || '').toLowerCase().trim());
    const clasif = this.clasif.find(c => (c.nombre || '').toLowerCase().trim() === (item.clasificacion_sga || '').toLowerCase().trim());
    this.tipo_id = tipo ? tipo.id : '';
    this.clasificacion_id = clasif ? clasif.id : '';
    this.loadDocs(item.codigo);
  }

  async loadDocs(codigo: string) {
    this.hojaUrl = null; this.certUrl = null; this.hojaMsg = ''; this.certMsg = '';
    try {
      const hoja = await reactivosService.obtenerHojaSeguridad(codigo);
      this.hojaUrl = hoja?.url || null;
    } catch {}
    try {
      const cert = await reactivosService.obtenerCertAnalisis(codigo);
      this.certUrl = cert?.url || null;
    } catch {}
  }

  onHojaSelected(ev: any) {
    const f = ev?.target?.files?.[0];
    this.hojaFile = f || null;
  }
  async subirHoja() {
    if (!this.catalogoSeleccionado?.codigo || !this.hojaFile) { this.hojaMsg = 'Seleccione código y archivo'; return; }
    this.hojaMsg = '';
    try {
      const r = await reactivosService.subirHojaSeguridad(this.catalogoSeleccionado.codigo, this.hojaFile);
      this.hojaUrl = r?.url || null;
      this.hojaMsg = 'Hoja de seguridad subida';
      this.hojaFile = null;
    } catch (e: any) {
      this.hojaMsg = e?.message || 'Error subiendo hoja';
    }
  }
  async eliminarHoja() {
    if (!this.catalogoSeleccionado?.codigo) return;
    if (!confirm('¿Eliminar hoja de seguridad?')) return;
    try {
      await reactivosService.eliminarHojaSeguridad(this.catalogoSeleccionado.codigo);
      this.hojaUrl = null;
      this.hojaMsg = 'Hoja de seguridad eliminada';
    } catch (e) {
      this.hojaMsg = 'Error eliminando hoja';
    }
  }

  onCertSelected(ev: any) {
    const f = ev?.target?.files?.[0];
    this.certFile = f || null;
  }
  async subirCert() {
    if (!this.catalogoSeleccionado?.codigo || !this.certFile) { this.certMsg = 'Seleccione código y archivo'; return; }
    this.certMsg = '';
    try {
      const r = await reactivosService.subirCertAnalisis(this.catalogoSeleccionado.codigo, this.certFile);
      this.certUrl = r?.url || null;
      this.certMsg = 'Certificado de análisis subido';
      this.certFile = null;
    } catch (e: any) {
      this.certMsg = e?.message || 'Error subiendo certificado';
    }
  }
  async eliminarCert() {
    if (!this.catalogoSeleccionado?.codigo) return;
    if (!confirm('¿Eliminar certificado de análisis?')) return;
    try {
      await reactivosService.eliminarCertAnalisis(this.catalogoSeleccionado.codigo);
      this.certUrl = null;
      this.certMsg = 'Certificado de análisis eliminado';
    } catch (e) {
      this.certMsg = 'Error eliminando certificado';
    }
  }

  calcularCantidadTotal() {
    if (this.presentacion != null && this.presentacion_cant != null) {
      this.cantidad_total = Number(this.presentacion) * Number(this.presentacion_cant);
    }
  }

  async crearCatalogo(e: Event) {
    e.preventDefault();
    this.catalogoMsg = '';
    try {
      await reactivosService.crearCatalogo({
        codigo: this.catCodigo.trim(),
        nombre: this.catNombre.trim(),
        tipo_reactivo: this.catTipo.trim(),
        clasificacion_sga: this.catClasificacion.trim(),
        descripcion: this.catDescripcion.trim() || null
      });
      this.catalogoMsg = 'Catálogo creado correctamente';
      // limpiar
      this.catCodigo = this.catNombre = this.catTipo = this.catClasificacion = this.catDescripcion = '';
      // Recargar base y re-aplicar filtros/búsqueda para que el nuevo elemento aparezca
      await this.cargarCatalogoBase();
      if ((this.codigoFiltro || '').trim() || (this.nombreFiltro || '').trim()) {
        this.filtrarCatalogoPorCampos();
      } else {
        this.catalogoQ = '';
        await this.buscarCatalogo();
      }
    } catch (err: any) {
      this.catalogoMsg = err?.message || 'Error creando catálogo';
    }
  }

  async crearReactivo(e: Event) {
    e.preventDefault();
    this.reactivoMsg = '';
    try {
      this.calcularCantidadTotal();
      const payload = {
        lote: this.lote.trim(),
        codigo: this.codigo.trim(),
        nombre: this.nombre.trim(),
        marca: this.marca.trim(),
        referencia: this.referencia.trim() || null,
        cas: this.cas.trim() || null,
        presentacion: this.presentacion,
        presentacion_cant: this.presentacion_cant,
        cantidad_total: this.cantidad_total,
        fecha_adquisicion: this.fecha_adquisicion,
        fecha_vencimiento: this.fecha_vencimiento,
        observaciones: this.observaciones.trim() || null,
        tipo_id: this.tipo_id,
        clasificacion_id: this.clasificacion_id,
        unidad_id: this.unidad_id,
        estado_id: this.estado_id,
        almacenamiento_id: this.almacenamiento_id,
        tipo_recipiente_id: this.tipo_recipiente_id
      };
      await reactivosService.crearReactivo(payload);
      this.reactivoMsg = 'Reactivo creado correctamente';
      await this.loadReactivos();
      this.resetReactivoForm();
    } catch (err: any) {
      this.reactivoMsg = err?.message || 'Error creando reactivo';
    }
  }

  resetReactivoForm() {
    this.lote = this.codigo = this.nombre = this.marca = this.referencia = this.cas = '';
    this.presentacion = this.presentacion_cant = this.cantidad_total = null;
    this.fecha_adquisicion = this.fecha_vencimiento = this.observaciones = '';
    this.tipo_id = this.clasificacion_id = this.unidad_id = this.estado_id = this.almacenamiento_id = this.tipo_recipiente_id = '';
  }


  async onCodigoInput() {
    const q = (this.codigo || '').trim();
    if (q.length >= 1) {
      this.catalogoQ = q;
      await this.buscarCatalogo();
      this.mostrarCatalogoFormPanel = true;
    } else {
      this.mostrarCatalogoFormPanel = false;
    }
  }

  async onNombreInput() {
    const q = (this.nombre || '').trim();
    if (q.length >= 1) {
      this.catalogoQ = q;
      await this.buscarCatalogo();
      this.mostrarCatalogoFormPanel = true;
    } else {
      this.mostrarCatalogoFormPanel = false;
    }
  }

  cerrarCatalogoFormPanel() {
    this.mostrarCatalogoFormPanel = false;
  }

  async mostrarTodosCatalogo() {
    // Primero mostramos la tabla para evitar necesidad de segundo clic
    this.mostrarTablaCatalogo = true;
    this.catalogoQ = '';
    await this.buscarCatalogo();
  }

  ocultarTablaCatalogo() {
    this.mostrarTablaCatalogo = false;
  }

  async filtrarReactivos() {
    await this.loadReactivos();
  }

  async mostrarTodosReactivos() {
    this.reactivosQ = '';
    await this.loadReactivos();
  }

  async eliminarReactivo(lote: string) {
    if (!confirm('¿Eliminar reactivo ' + lote + '?')) return;
    try {
      await reactivosService.eliminarReactivo(lote);
      await this.loadReactivos();
    } catch (err) {
      console.error('Error eliminando reactivo', err);
    }
  }

  logout() {
    authService.logout();
  }
}
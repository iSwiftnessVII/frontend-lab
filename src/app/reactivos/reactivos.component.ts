import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService } from '../services/auth.service';
import { reactivosService } from '../services/reactivos.service';



@Component({
  standalone: true,
  selector: 'app-reactivos',
  templateUrl: './reactivos.component.html',
  styleUrls: ['./reactivos.component.css'],
  imports: [CommonModule, NgIf, FormsModule, RouterModule]
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
    // Ejecutar inicialización al montar el componente
    this.init();
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
  // Signals para catálogo
  catalogoResultadosSig = signal<Array<any>>([]);
  catalogoSeleccionado: any = null;
  catalogoCargando: boolean = false;
  // Base y listas filtradas para selects (signal)
  catalogoBaseSig = signal<Array<any>>([]);
  catalogoCodigoResultados: Array<any> = [];
  catalogoNombreResultados: Array<any> = [];
  codigoFiltro: string = '';
  nombreFiltro: string = '';
  // Paginación catálogo
  catalogoVisibleCount: number = 10; // tamaño página frontend respaldo
  catalogoTotal: number = 0;
  catalogoOffset: number = 0; // offset usado en backend
  // Paginación del catálogo removida: siempre mostrar todo

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
  // Panel de catálogo dentro del formulario (se mantiene para autocompletar)
  mostrarCatalogoFormPanel: boolean = false;

  // Estado de disponibilidad de PDFs por código
  pdfStatus: { [codigo: string]: { hoja: boolean | null; cert: boolean | null } } = {};
  // Helper para actualizar estado PDF y forzar cambio de referencia
  private setPdfStatus(codigo: string, changes: Partial<{ hoja: boolean | null; cert: boolean | null }>) {
    const prev = this.pdfStatus[codigo] || { hoja: null, cert: null };
    this.pdfStatus = { ...this.pdfStatus, [codigo]: { ...prev, ...changes } };
    this.persistPdfStatus();
  }

  constructor(private sanitizer: DomSanitizer) {}

  async init() {
    try {
      // Restaurar cache pdfStatus si existe
      try {
        const cache = sessionStorage.getItem('pdfStatusCache');
        if (cache) {
          this.pdfStatus = JSON.parse(cache);
        }
      } catch {}
      // Cargar auxiliares y catálogo en paralelo para reducir tiempo de espera perceptual
      this.catalogoCargando = true;
      await Promise.all([
        this.loadAux(),
        this.loadReactivos(10),
        this.loadCatalogoInicial()
      ]);
      // Guardar cache inicial tras carga
      this.persistPdfStatus();
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

  async loadReactivos(limit?: number) {
    const rows = await reactivosService.listarReactivos(this.reactivosQ || '', limit);
    this.reactivos = rows || [];
  }

  async buscarCatalogo() {
    const q = this.normalizarTexto(this.catalogoQ || '');
    if (!this.catalogoBaseSig().length) {
      await this.cargarCatalogoBase();
    }
    this.catalogoCargando = true;
    try {
      if (!q) {
        this.catalogoResultadosSig.set(this.catalogoBaseSig().slice());
      } else {
        const filtered = this.catalogoBaseSig().filter(c =>
          this.normalizarTexto(c.codigo || '').includes(q) ||
          this.normalizarTexto(c.nombre || '').includes(q)
        );
        this.catalogoResultadosSig.set(filtered);
      }
    } finally {
      this.catalogoCargando = false;
    }
  }

  async cargarCatalogoBase() {
    try {
      const resp = await reactivosService.buscarCatalogo('', this.catalogoVisibleCount, this.catalogoOffset);
      if (Array.isArray(resp)) {
        this.catalogoBaseSig.set(resp);
        this.catalogoTotal = resp.length;
        this.catalogoResultadosSig.set(resp.slice(0, this.catalogoVisibleCount));
      } else {
        const base = resp.rows || [];
        this.catalogoBaseSig.set(base);
        this.catalogoTotal = resp.total || base.length;
        this.catalogoResultadosSig.set(base.slice());
      }
      this.catalogoCodigoResultados = this.catalogoBaseSig().slice();
      this.catalogoNombreResultados = this.catalogoBaseSig().slice();
      // Pre-cargar disponibilidad de PDFs para los visibles iniciales
      this.preloadDocsForVisible();
    } catch (e) {
      console.error('Error cargando catálogo inicial', e);
      this.catalogoMsg = 'Error cargando catálogo';
      this.catalogoBaseSig.set([]);
      this.catalogoResultadosSig.set([]);
      this.catalogoTotal = 0;
    }
  }

  async loadCatalogoInicial() {
    this.catalogoOffset = 0;
    this.catalogoVisibleCount = 10;
    this.codigoFiltro = '';
    this.nombreFiltro = '';
    try {
      await this.cargarCatalogoBase();
    } finally {
      this.catalogoCargando = false;
    }
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
      this.catalogoCodigoResultados = this.catalogoBaseSig().slice();
    } else {
      // Coincidencia insensible a mayúsculas y en cualquier parte del código
      this.catalogoCodigoResultados = this.catalogoBaseSig().filter(c => this.normalizarTexto(c.codigo || '').includes(q));
    }
  }

  filtrarCatalogoNombre() {
    const q = this.normalizarTexto(this.nombreFiltro || '');
    if (!q) {
      this.catalogoNombreResultados = this.catalogoBaseSig().slice();
    } else {
      this.catalogoNombreResultados = this.catalogoBaseSig().filter(c => this.normalizarTexto(c.nombre || '').includes(q));
    }
  }

  async filtrarCatalogoPorCampos() {
    const codeQraw = (this.codigoFiltro || '').trim();
    const nameQraw = (this.nombreFiltro || '').trim();
    const codeQ = this.normalizarTexto(codeQraw);
    const nameQ = this.normalizarTexto(nameQraw);
    this.catalogoOffset = 0;

    // Estrategia: no mezclamos. Si sólo hay código -> buscar por código; si sólo nombre -> buscar por nombre; si ambos -> cargar base limitada y filtrar local con AND.
    let backendQuery = '';
    if (codeQ && !nameQ) backendQuery = codeQraw; // enviar tal cual para que backend pueda usar LIKE sobre codigo
    else if (nameQ && !codeQ) backendQuery = nameQraw; // sólo nombre
    else backendQuery = ''; // ambos o ninguno -> traer primer page y filtrar local

  // Si la búsqueda es de un único carácter (código o nombre), ampliamos límite para no truncar demasiados resultados.
  const singleCharQuery = (backendQuery && backendQuery.length === 1);
  const effectiveLimit = singleCharQuery ? 0 : this.catalogoVisibleCount; // 0 => backend sin límite
  const resp = await reactivosService.buscarCatalogo(backendQuery, effectiveLimit, this.catalogoOffset);
    let base: any[] = [];
    if (Array.isArray(resp)) {
      base = resp;
      this.catalogoTotal = resp.length;
    } else {
      base = resp.rows || [];
      this.catalogoTotal = resp.total || base.length;
    }

    // Filtrado exclusivo
    let filtered = base;
    if (codeQ) {
      filtered = filtered.filter(c => this.normalizarTexto(c.codigo || '').includes(codeQ));
    }
    if (nameQ) {
      // filtrado adicional por nombre, pero sin que el nombre afecte el código (AND si ambos presentes)
      filtered = filtered.filter(c => this.normalizarTexto(c.nombre || '').includes(nameQ));
    }

    this.catalogoBaseSig.set(base);
  this.catalogoResultadosSig.set(singleCharQuery ? filtered : filtered.slice(0, this.catalogoVisibleCount));
    this.catalogoTotal = filtered.length;
    this.catalogoCodigoResultados = this.catalogoBaseSig().slice();
    this.catalogoNombreResultados = this.catalogoBaseSig().slice();
    this.preloadDocsForVisible();
  }

  normalizarTexto(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Sin cargarMasCatalogo: se muestra todo
  resetCatalogoPaginado() {
    this.catalogoVisibleCount = 10;
    this.catalogoOffset = 0;
    this.cargarCatalogoBase();
  }

  async cargarMasCatalogo() {
    if (this.catalogoResultadosSig().length >= this.catalogoTotal) return;
    this.catalogoOffset += this.catalogoVisibleCount;
    const resp = await reactivosService.buscarCatalogo(this.codigoFiltro || this.nombreFiltro || '', this.catalogoVisibleCount, this.catalogoOffset);
    let nuevos: any[] = [];
    if (Array.isArray(resp)) {
      nuevos = resp;
    } else {
      nuevos = resp.rows || [];
      this.catalogoTotal = resp.total || this.catalogoTotal;
    }
    this.catalogoResultadosSig.set(this.catalogoResultadosSig().concat(nuevos));
    this.preloadDocsForVisible(nuevos);
  }

  trackByCatalogo(index: number, item: any) {
    return item?.codigo || index;
  }

  // --- Acciones PDF en tabla catálogo ---
  async onSubirHojaCatalogo(ev: any, codigo: string) {
    const f = ev?.target?.files?.[0];
    if (!f) return;
    try {
      await reactivosService.subirHojaSeguridad(codigo, f);
      this.catalogoMsg = `Hoja de seguridad subida para ${codigo}`;
  this.setPdfStatus(codigo, { hoja: true });
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
      this.setPdfStatus(codigo, { hoja: false });
    } catch (e: any) {
      this.setPdfStatus(codigo, { hoja: false });
      this.catalogoMsg = e?.message || 'Error eliminando hoja de seguridad';
    }
  }
  async onSubirCertCatalogo(ev: any, codigo: string) {
    const f = ev?.target?.files?.[0];
    if (!f) return;
    try {
      await reactivosService.subirCertAnalisis(codigo, f);
      this.catalogoMsg = `Certificado de análisis subido para ${codigo}`;
  this.setPdfStatus(codigo, { cert: true });
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
      this.setPdfStatus(codigo, { cert: false });
    } catch (e: any) {
      this.setPdfStatus(codigo, { cert: false });
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
    const item = this.catalogoBaseSig().find(c => (c.codigo || '') === (this.codigo || ''));
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
    const item = this.catalogoBaseSig().find(c => (c.nombre || '') === (this.nombre || ''));
    if (!item) return;
    this.catalogoSeleccionado = item;
    this.codigo = item.codigo || '';
    const tipo = this.tipos.find(t => (t.nombre || '').toLowerCase().trim() === (item.tipo_reactivo || '').toLowerCase().trim());
    const clasif = this.clasif.find(c => (c.nombre || '').toLowerCase().trim() === (item.clasificacion_sga || '').toLowerCase().trim());
    this.tipo_id = tipo ? tipo.id : '';
    this.clasificacion_id = clasif ? clasif.id : '';
    this.loadDocs(item.codigo);
  }

  // Getters para mantener compatibilidad con el template existente
  get catalogoResultados() { return this.catalogoResultadosSig(); }
  get catalogoBase() { return this.catalogoBaseSig(); }

  // Pre-carga de disponibilidad de PDFs (solo estado, no abre ventana)
  async preloadDocsForVisible(list?: any[]) {
    const items = list || this.catalogoResultadosSig();
    // Limitar a 20 para evitar tormenta de peticiones
    const slice = items.slice(0, 20);
    for (const item of slice) {
      const codigo = item.codigo;
      if (!codigo) continue;
      if (!this.pdfStatus[codigo]) {
        this.pdfStatus[codigo] = { hoja: null, cert: null };
        // Lanzar comprobaciones en paralelo (sin await secuencial bloqueante)
        this.checkPdfAvailability(codigo);
      }
    }
  }

  private async checkPdfAvailability(codigo: string) {
    try { await reactivosService.obtenerHojaSeguridad(codigo); this.setPdfStatus(codigo, { hoja: true }); }
    catch { this.setPdfStatus(codigo, { hoja: false }); }
    try { await reactivosService.obtenerCertAnalisis(codigo); this.setPdfStatus(codigo, { cert: true }); }
    catch { this.setPdfStatus(codigo, { cert: false }); }
  }

  // Resalta coincidencias de búsqueda/filtro dentro de campos
  highlightField(value: string, field: 'codigo' | 'nombre' | 'otro' = 'otro'): SafeHtml {
    if (!value) return '';
    // Determinar si el usuario está filtrando exclusivamente por código o exclusivamente por nombre
    const hasCode = !!this.codigoFiltro.trim();
    const hasName = !!this.nombreFiltro.trim();
    const exclusiveCode = hasCode && !hasName;
    const exclusiveName = hasName && !hasCode;

    let term: string | null = null;
    if (exclusiveCode && field === 'codigo') {
      term = this.normalizarTexto(this.codigoFiltro);
    } else if (exclusiveName && field === 'nombre') {
      term = this.normalizarTexto(this.nombreFiltro);
    } else {
      // No resaltar en otros casos para evitar "sombreado" no deseado
      return value;
    }
    if (!term) return value;
  // Escapar caracteres especiales para construir regex seguro
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'ig');
    const html = value.replace(re, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private persistPdfStatus() {
    try { sessionStorage.setItem('pdfStatusCache', JSON.stringify(this.pdfStatus)); } catch {}
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
      const codigo = this.catalogoSeleccionado.codigo;
      this.setPdfStatus(codigo, { hoja: false });
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
      const codigo = this.catalogoSeleccionado.codigo;
      this.setPdfStatus(codigo, { cert: false });
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

  async filtrarReactivos() {
    // Filtrar vuelve a cargar con límite 10 para mantener paginación simple
    await this.loadReactivos(10);
  }

  async mostrarTodosReactivos() {
    this.reactivosQ = '';
    await this.loadReactivos(); // sin límite => todos
  }

  async eliminarReactivo(lote: string) {
    if (!confirm('¿Eliminar reactivo ' + lote + '?')) return;
    try {
      await reactivosService.eliminarReactivo(lote);
      await this.loadReactivos();
    } catch (err) {
      console.error('Error eliminando reactivo', err);

}}
  logout() {
    authService.logout();
  }

}
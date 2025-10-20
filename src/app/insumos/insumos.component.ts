import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService } from '../services/auth.service';
import { insumosService } from '../services/insumos.service';

@Component({  
  standalone: true,
  selector: 'app-insumos',
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.css'],
  imports: [CommonModule, NgIf, FormsModule, RouterModule]
})

export class InsumosComponent implements OnInit {
  // Aux lists
  tipos: Array<any> = [];
  clasif: Array<any> = [];
  unidades: Array<any> = [];
  estado: Array<any> = [];
  recipiente: Array<any> = [];
  almacen: Array<any> = [];
  insumoSeleccionado: any = null;
  mostrarDetalles: boolean = false;

  ngOnInit() {
    // Ejecutar inicialización al montar el componente
    this.init();
  }

  // Catálogo form
  catItem = '';
  catNombre = '';
  catDescripcion = '';
  catalogoMsg = '';
  itemFiltro = '';


  // Catálogo búsqueda y selección
  catalogoQ = '';
  // Signals para catálogo
  catalogoResultadosSig = signal<Array<any>>([]);
  catalogoSeleccionado: any = null;
  catalogoCargando: boolean = false;
  // Base y listas filtradas para selects (signal)
  catalogoBaseSig = signal<Array<any>>([]);
  catalogoItemResultados: Array<any> = [];
  catalogoNombreResultados: Array<any> = [];
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

  // Insumo form
item = 0; // corresponde al campo "item" de la tabla insumos

nombre = '';
marca = '';
presentacion: number | null = null;
cantidad_adquirida: number | null = null;
cantidad_existente: number | null = null;
fecha_adquisicion = '';
ubicacion = '';
observaciones = '';
descripcion = '';

// Mensaje de operación
insumoMsg = '';

// Lista de insumos
insumos: Array<any> = [];
// Filtros de inventario
insumosItemQ = '';
insumosNombreQ = '';
insumosFiltrados: Array<any> = [];
insumosQ = '';

// Panel de catálogo dentro del formulario (autocompletar)
mostrarCatalogoFormPanel: boolean = false;

// Estado de disponibilidad de PDFs por código
pdfStatus: { [item: string]: { hoja: boolean | null; cert: boolean | null } } = {};

// Helper para actualizar estado PDF y forzar cambio de referencia
private setPdfStatus(item: string, changes: Partial<{ hoja: boolean | null; cert: boolean | null }>) {
  const prev = this.pdfStatus[item] || { hoja: null, cert: null };
  this.pdfStatus = { ...this.pdfStatus, [item]: { ...prev, ...changes } };
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
      this.loadInsumos(10),
      this.loadCatalogoInicial()
    ]);

    // Guardar cache inicial tras carga
    this.persistPdfStatus();
  } catch (err) {
    console.error('Error inicializando Insumos:', err);
  }
}

async loadAux() {
  const data = await insumosService.aux();
  this.tipos = data.tipos || [];
  this.clasif = data.clasif || [];
  this.unidades = data.unidades || [];
  this.estado = data.estado || [];
  this.recipiente = data.recipiente || [];
  this.almacen = data.almacen || [];
}

async loadInsumos(limit?: number) {
  const rows = await insumosService.listarInsumos(this.insumosQ || '', limit);
  this.insumos = rows || [];
  this.aplicarFiltroInsumos();
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
        this.normalizarTexto(c.item || '').includes(q) ||
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
    const resp = await insumosService.buscarCatalogo('', this.catalogoVisibleCount, this.catalogoOffset);
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
    this.catalogoItemResultados = this.catalogoBaseSig().slice();
    this.catalogoNombreResultados = this.catalogoBaseSig().slice();

    // Pre-cargar disponibilidad de PDFs para los visibles iniciales
    this.preloadDocsForVisible();
  } catch (e) {
    console.error('Error cargando catálogo inicial de insumos', e);
    this.catalogoMsg = 'Error cargando catálogo';
    this.catalogoBaseSig.set([]);
    this.catalogoResultadosSig.set([]);
    this.catalogoTotal = 0;
  }
}

async loadCatalogoInicial() {
  this.catalogoOffset = 0;
  this.catalogoVisibleCount = 10;
  this.itemFiltro = '';
  this.nombreFiltro = '';
  try {
    await this.cargarCatalogoBase();
  } finally {
    this.catalogoCargando = false;
  }
}

  seleccionarCatalogo(catalogoItem: any) {
    this.catalogoSeleccionado = catalogoItem;
    
    // ✅ Asignar correctamente: convertir el 'item' del catálogo (string) a number
    this.item = parseInt(catalogoItem.item) || 0;
    this.nombre = catalogoItem.nombre || '';
    
    // Cargar PDFs existentes usando el 'item' del catálogo
    this.loadDocs(catalogoItem.item);
    
    // Ocultar panel de catálogo
    this.mostrarCatalogoFormPanel = false;
  }
filtrarCatalogoItem() {
  const q = this.normalizarTexto(this.itemFiltro || '');
  if (!q) {
    this.catalogoItemResultados = this.catalogoBaseSig().slice();
  } else {
    // Coincidencia insensible a mayúsculas y en cualquier parte del código
    this.catalogoItemResultados = this.catalogoBaseSig().filter(c => this.normalizarTexto(c.item || '').includes(q));
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
  const codeQraw = (this.itemFiltro || '').trim();
  const nameQraw = (this.nombreFiltro || '').trim();
  const codeQ = this.normalizarTexto(codeQraw);
  const nameQ = this.normalizarTexto(nameQraw);
  this.catalogoOffset = 0;

  // Estrategia: no mezclamos. Si sólo hay código -> buscar por código; si sólo nombre -> buscar por nombre; si ambos -> cargar base limitada y filtrar local con AND.
  let backendQuery = '';
  if (codeQ && !nameQ) backendQuery = codeQraw; // enviar tal cual para backend
  else if (nameQ && !codeQ) backendQuery = nameQraw; // sólo nombre
  else backendQuery = ''; // ambos o ninguno -> traer primer page y filtrar local

  // Si la búsqueda es de un único carácter (código o nombre), ampliamos límite para no truncar demasiados resultados.
  const singleCharQuery = (backendQuery && backendQuery.length === 1);
  const effectiveLimit = singleCharQuery ? 0 : this.catalogoVisibleCount; // 0 => backend sin límite

  // Usar insumosService
  const resp = await insumosService.buscarCatalogo(backendQuery, effectiveLimit, this.catalogoOffset);
  let base: any[] = [];
  if (Array.isArray(resp)) {
    base = resp;
    this.catalogoTotal = resp.length;
  } else {
    base = resp.rows || [];
    this.catalogoTotal = resp.total || base.length;
  }

  // Filtrado exclusivo (local)
  let filtered = base;
  if (codeQ) {
    filtered = filtered.filter(c => this.normalizarTexto(c.item || '').includes(codeQ));
  }
  if (nameQ) {
    filtered = filtered.filter(c => this.normalizarTexto(c.nombre || '').includes(nameQ));
  }

  this.catalogoBaseSig.set(base);
  this.catalogoResultadosSig.set(singleCharQuery ? filtered : filtered.slice(0, this.catalogoVisibleCount));
  this.catalogoTotal = filtered.length;
  this.catalogoItemResultados = this.catalogoBaseSig().slice();
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
  const resp = await insumosService.buscarCatalogo(this.itemFiltro || this.nombreFiltro || '', this.catalogoVisibleCount, this.catalogoOffset);
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

 trackByCatalogo(index: number, catalogoItem: any) {
    return catalogoItem?.item || index;
  }

// --- Acciones PDF en tabla catálogo ---
async onSubirHojaCatalogo(ev: any, item: string) {
  const f = ev?.target?.files?.[0];
  if (!f) return;
  try {
    await insumosService.subirHojaSeguridad(item, f);
    this.catalogoMsg = `Hoja de seguridad subida para ${item}`;
    this.setPdfStatus(item, { hoja: true });
  } catch (e: any) {
    this.catalogoMsg = e?.message || 'Error subiendo hoja de seguridad';
  } finally {
    if (ev?.target) ev.target.value = '';
  }
}

  async onEliminarHojaCatalogo(item: string) {
    if (!confirm('¿Eliminar hoja de seguridad?')) return;
    try {
      await insumosService.eliminarHojaSeguridad(Number(item));

      this.catalogoMsg = `Hoja de seguridad eliminada para ${item}`;
      this.setPdfStatus(item, { hoja: false });
    } catch (e: any) {
      this.setPdfStatus(item, { hoja: false });
      this.catalogoMsg = e?.message || 'Error eliminando hoja de seguridad';
    }
  }

async onSubirCertCatalogo(ev: any, item: string) {
  const f = ev?.target?.files?.[0];
  if (!f) return;
  try {
    await insumosService.subirCertAnalisis(item, f);
    this.catalogoMsg = `Certificado de análisis subido para ${item}`;
    this.setPdfStatus(item, { cert: true });
  } catch (e: any) {
    this.catalogoMsg = e?.message || 'Error subiendo certificado de análisis';
  } finally {
    if (ev?.target) ev.target.value = '';
  }
}

async onEliminarCertCatalogo(item: string) {
  if (!confirm('¿Eliminar certificado de análisis?')) return;
  try {
    await insumosService.eliminarCertAnalisis(item);
    this.catalogoMsg = `Certificado de análisis eliminado para ${item}`;
    this.setPdfStatus(item, { cert: false });
  } catch (e: any) {
    this.setPdfStatus(item, { cert: false });
    this.catalogoMsg = e?.message || 'Error eliminando certificado de análisis';
  }
}

formatearFecha(fecha: string): string {
  if (!fecha) return '';
  const date = new Date(fecha);
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

mostrarDetallesInsumo(insumo: any) {
  this.insumoSeleccionado = insumo; // puedes renombrar a insumoSeleccionado si quieres
  this.mostrarDetalles = true;
}

// Funciones auxiliares para obtener nombres descriptivos
obtenerNombreTipo(id: any): string {
  const tipo = this.tipos.find(t => t.id == id);
  return tipo ? tipo.nombre : 'N/A';
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

// Visualización de PDFs
async onVerHojaCatalogo(item: string) {
  try {
    const r = await insumosService.obtenerHojaSeguridad(item);
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

async onVerCertCatalogo(item: string) {
  try {
    const r = await insumosService.obtenerCertAnalisis(item);
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

// Selección desde el catálogo
  onItemSeleccionado() {
    const catalogoItem = this.catalogoBaseSig().find(c => 
      String(c.item) === String(this.item) 
    );
    if (!catalogoItem) return;
    
    this.catalogoSeleccionado = catalogoItem;
    this.nombre = catalogoItem.nombre || '';
    this.loadDocs(catalogoItem.item); 
  }

onNombreSeleccionado() {
  const catalogoItem = this.catalogoBaseSig().find(c => (c.nombre || '') === (this.nombre || ''));
  if (!catalogoItem) return;
  this.catalogoSeleccionado = catalogoItem;
  this.item = parseInt(catalogoItem.item) || 0;  
  this.loadDocs(catalogoItem.item);             
}

// Getters para mantener compatibilidad con el template existente
get catalogoResultados() { return this.catalogoResultadosSig(); }
get catalogoBase() { return this.catalogoBaseSig(); }

// Pre-carga de disponibilidad de PDFs (solo estado, no abre ventana)
  async preloadDocsForVisible(list?: any[]) {
    const items = list || this.catalogoResultadosSig();
    const slice = items.slice(0, 20);
    
    for (const catalogoItem of slice) {
      if (!catalogoItem) continue;  // 
      
      const item = catalogoItem.item;  // 
      if (!item || this.pdfStatus[item]) continue;
      
      this.pdfStatus[item] = { hoja: null, cert: null };
      this.checkPdfAvailability(item);
    }
  }

private async checkPdfAvailability(item: string) {
  try { await insumosService.obtenerHojaSeguridad(item); this.setPdfStatus(item, { hoja: true }); }
  catch { this.setPdfStatus(item, { hoja: false }); }
  try { await insumosService.obtenerCertAnalisis(item); this.setPdfStatus(item, { cert: true }); }
  catch { this.setPdfStatus(item, { cert: false }); }
}

// Resalta coincidencias de búsqueda/filtro dentro de campos
highlightField(value: string, field:'nombre' | 'otro' | 'item'): SafeHtml {
  if (!value) return '';
  // Determinar si el usuario está filtrando exclusivamente por código o exclusivamente por nombre
  const hasCode = !!this.itemFiltro.trim();
  const hasName = !!this.nombreFiltro.trim();
  const exclusiveCode = hasCode && !hasName;
  const exclusiveName = hasName && !hasCode;

  let term: string | null = null; 
  if (exclusiveCode && field === 'item') {
    term = this.normalizarTexto(this.itemFiltro);
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

async loadDocs(item: string) {
  this.hojaUrl = null; this.certUrl = null; this.hojaMsg = ''; this.certMsg = '';
  try {
    const hoja = await insumosService.obtenerHojaSeguridad(item);
    this.hojaUrl = hoja?.url || null;
  } catch {}
  try {
    const cert = await insumosService.obtenerCertAnalisis(item);
    this.certUrl = cert?.url || null;
  } catch {}
}

onHojaSelected(ev: any) {
  const f = ev?.target?.files?.[0];
  this.hojaFile = f || null;
}

async subirHoja() {
  if (!this.catalogoSeleccionado?.item || !this.hojaFile) { 
    this.hojaMsg = 'Seleccione código y archivo'; 
    return; 
  }
  this.hojaMsg = '';
  try {
    const r = await insumosService.subirHojaSeguridad(this.catalogoSeleccionado.item, this.hojaFile);
    this.hojaUrl = r?.url || null;
    this.hojaMsg = 'Hoja de seguridad subida';
    this.hojaFile = null;
  } catch (e: any) {
    this.hojaMsg = e?.message || 'Error subiendo hoja';
  }
}

async eliminarHoja() {
  if (!this.catalogoSeleccionado?.item) return;
  if (!confirm('¿Eliminar hoja de seguridad?')) return;
  try {
    await insumosService.eliminarHojaSeguridad(this.catalogoSeleccionado.item);
    this.hojaUrl = null;
    this.hojaMsg = 'Hoja de seguridad eliminada';
    const item = this.catalogoSeleccionado.item;
    this.setPdfStatus(item, { hoja: false });
  } catch (e) {
    this.hojaMsg = 'Error eliminando hoja';
  }
}

onCertSelected(ev: any) {
  const f = ev?.target?.files?.[0];
  this.certFile = f || null;
}

async subirCert() {
  if (!this.catalogoSeleccionado?.item || !this.certFile) { 
    this.certMsg = 'Seleccione código y archivo'; 
    return; 
  }
  this.certMsg = '';
  try {
    const r = await insumosService.subirCertAnalisis(this.catalogoSeleccionado.item, this.certFile);
    this.certUrl = r?.url || null;
    this.certMsg = 'Certificado de análisis subido';
    this.certFile = null;
  } catch (e: any) {
    this.certMsg = e?.message || 'Error subiendo certificado';
  }
}

async eliminarCert() {
  if (!this.catalogoSeleccionado?.item) return;
  if (!confirm('¿Eliminar certificado de análisis?')) return;
  try {
    await insumosService.eliminarCertAnalisis(this.catalogoSeleccionado.item);
    this.certUrl = null;
    this.certMsg = 'Certificado de análisis eliminado';
    const item = this.catalogoSeleccionado.item;
    this.setPdfStatus(item, { cert: false });
  } catch (e) {
    this.certMsg = 'Error eliminando certificado';
  }
}



async crearCatalogo(e: Event) {
    e.preventDefault();
    this.catalogoMsg = '';
    
    if (!this.catItem.trim() || !this.catNombre.trim()) {
      this.catalogoMsg = 'Item y Nombre son requeridos';
      return;
    }
    
    try {
      await insumosService.crearCatalogo({
        item: this.catItem.trim(),
        nombre: this.catNombre.trim(),
        descripcion: this.catDescripcion.trim() || null
      });
      
      this.catalogoMsg = ' Catálogo creado correctamente';
      
      // Limpiar formulario
      this.catItem = '';
      this.catNombre = '';
      this.catDescripcion = '';
      
      // Recargar catálogo
      await this.cargarCatalogoBase();
      
      if ((this.itemFiltro || '').trim() || (this.nombreFiltro || '').trim()) {
        this.filtrarCatalogoPorCampos();
      } else {
        this.catalogoQ = '';
        await this.buscarCatalogo();
      }
    } catch (err: any) {
      this.catalogoMsg = '❌ ' + (err?.message || 'Error creando catálogo');
    }
  }

async crearInsumo(e: Event) {
  e.preventDefault();
  this.insumoMsg = ''; // usamos el mensaje correcto
  try {
    const payload = {
      item: this.item, // o null si lo crea el backend automáticamente
      nombre: this.nombre.trim(),
      marca: this.marca.trim(),
      presentacion: this.presentacion,
      cantidad_adquirida: this.cantidad_adquirida,
      cantidad_existente: this.cantidad_existente,
      fecha_adquisicion: this.fecha_adquisicion,
      ubicacion: this.ubicacion.trim() || null,
      observaciones: this.observaciones.trim() || null,
      descripcion: this.descripcion.trim() || null,
    };

    await insumosService.crearInsumo(payload);
    this.insumoMsg = 'Insumo creado correctamente';

    await this.loadInsumos();
  } catch (err: any) {
    this.insumoMsg = err?.message || 'Error creando insumo';
  }
}


resetInsumoForm() {
  this.item = 0;
  this.nombre = '';
  this.marca = '';
  this.presentacion = null;
  this.cantidad_adquirida = null;
  this.cantidad_existente = null;
  this.fecha_adquisicion = '';
  this.ubicacion = '';
  this.observaciones = '';
  this.descripcion = '';


  this.insumoMsg = '';
}


async onItemInput() {
  const q = String(this.item || '').trim();
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

async filtrarInsumos() {
  // Filtrado local por lote, código y nombre (insensible a mayúsculas/acentos)
  this.aplicarFiltroInsumos();
}

private aplicarFiltroInsumos() {
  const normalizar = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const qItem = normalizar(this.insumosItemQ || '');
  const qNom  = normalizar(this.insumosNombreQ || '');

  // Si no hay filtros, devolver copia completa
  if (!qItem && !qNom) {
    this.insumosFiltrados = (this.insumos || []).slice();
    return;
  }

  this.insumosFiltrados = (this.insumos || []).filter(i => {
    const itemStr  = normalizar(String(i.item ?? ''));
    const nombre   = normalizar(String(i.nombre ?? ''));

    if (qItem && !itemStr.includes(qItem)) return false;
    if (qNom  && !nombre.includes(qNom))   return false;
    return true;
  });
}


async mostrarTodosInsumos() {
  this.insumosQ = '';
  await this.loadInsumos(); 
}

async eliminarInsumo(id: number) {  
  if (!confirm('¿Eliminar este insumo?')) return;
  
  try {
    await insumosService.eliminarInsumo(id);
    await this.loadInsumos();
  } catch (err) {
    console.error('Error eliminando insumo', err);
    alert('Error al eliminar el insumo');
  }
}

logout() {
  authService.logout();
}


}
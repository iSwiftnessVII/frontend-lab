import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService, authUser } from '../services/auth.service';
import { insumosService } from '../services/insumos.service';

@Component({  
  standalone: true,
  selector: 'app-insumos',
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})

export class InsumosComponent implements OnInit {
  @ViewChild('insumoFormSection') insumoFormSection?: ElementRef<HTMLElement>;
  @ViewChild('itemCatalogoInput') itemCatalogoInput?: ElementRef<HTMLInputElement>;
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

  // Catálogo form (signals con accessors para compatibilidad con template)
  private catItemSig = signal<string>('');
  get catItem() { return this.catItemSig(); }
  set catItem(v: string) { this.catItemSig.set(v ?? ''); }

  private catNombreSig = signal<string>('');
  get catNombre() { return this.catNombreSig(); }
  set catNombre(v: string) { this.catNombreSig.set(v ?? ''); }

  private catDescripcionSig = signal<string>('');
  get catDescripcion() { return this.catDescripcionSig(); }
  set catDescripcion(v: string) { this.catDescripcionSig.set(v ?? ''); }

  private catImagenSig = signal<File | null>(null);
  get catImagen() { return this.catImagenSig(); }
  set catImagen(f: File | null) { this.catImagenSig.set(f ?? null); }

  private catalogoMsgSig = signal<string>('');
  get catalogoMsg() { return this.catalogoMsgSig(); }
  set catalogoMsg(v: string) { this.catalogoMsgSig.set(v ?? ''); }

  private itemFiltroSig = signal<string>('');
  get itemFiltro() { return this.itemFiltroSig(); }
  set itemFiltro(v: string) { this.itemFiltroSig.set(v ?? ''); }


  // Catálogo búsqueda y selección
  catalogoQ = '';
  // Signals para catálogo
  catalogoResultadosSig = signal<Array<any>>([]);
  catalogoSeleccionado: any = null;
  private catalogoCargandoSig = signal<boolean>(false);
  get catalogoCargando() { return this.catalogoCargandoSig(); }
  set catalogoCargando(v: boolean) { this.catalogoCargandoSig.set(!!v); }
  // Base y listas filtradas para selects (signal)
  catalogoBaseSig = signal<Array<any>>([]);
  catalogoItemResultados: Array<any> = [];
  catalogoNombreResultados: Array<any> = [];
  private nombreFiltroSig = signal<string>('');
  get nombreFiltro() { return this.nombreFiltroSig(); }
  set nombreFiltro(v: string) { this.nombreFiltroSig.set(v ?? ''); }
  // Paginación catálogo
  catalogoVisibleCount: number = 10; // tamaño página frontend respaldo
  private catalogoTotalSig = signal<number>(0);
  get catalogoTotal() { return this.catalogoTotalSig(); }
  set catalogoTotal(v: number) { this.catalogoTotalSig.set(Number(v) || 0); }
  catalogoOffset: number = 0; // offset usado en backend
  // Paginación del catálogo removida: siempre mostrar todo

  // Gestión de PDFs
  hojaUrl: string | null = null;
  certUrl: string | null = null;
  hojaFile: File | null = null;
  certFile: File | null = null;
  hojaMsg = '';
  certMsg = '';

  // Insumo form (nuevo esquema)
  // Formulario de insumo (signals con accessors)
  private itemCatalogoSig = signal<number | null>(null);
  get item_catalogo() { return this.itemCatalogoSig(); }
  set item_catalogo(v: number | null) {
    const n = v as any;
    if (n === null || typeof n === 'undefined' || n === '') { this.itemCatalogoSig.set(null); return; }
    const num = Number(n);
    this.itemCatalogoSig.set(Number.isFinite(num) ? num : null);
  }

  private nombreSig = signal<string>('');
  get nombre() { return this.nombreSig(); }
  set nombre(v: string) { this.nombreSig.set((v ?? '').toString()); }

  private marcaSig = signal<string>('');
  get marca() { return this.marcaSig(); }
  set marca(v: string) { this.marcaSig.set((v ?? '').toString()); }

  private presentacionSig = signal<string>('');
  get presentacion() { return this.presentacionSig(); }
  set presentacion(v: string) { this.presentacionSig.set((v ?? '').toString()); }

  private referenciaSig = signal<string>('');
  get referencia() { return this.referenciaSig(); }
  set referencia(v: string) { this.referenciaSig.set((v ?? '').toString()); }

  private cantAdqSig = signal<number | null>(null);
  get cantidad_adquirida() { return this.cantAdqSig(); }
  set cantidad_adquirida(v: number | null) {
    const n = (v as any);
    if (n === null || typeof n === 'undefined' || n === '') { this.cantAdqSig.set(null); return; }
    const num = Number(n);
    this.cantAdqSig.set(Number.isFinite(num) ? num : null);
  }

  private cantExSig = signal<number | null>(null);
  get cantidad_existente() { return this.cantExSig(); }
  set cantidad_existente(v: number | null) {
    const n = (v as any);
    if (n === null || typeof n === 'undefined' || n === '') { this.cantExSig.set(null); return; }
    const num = Number(n);
    this.cantExSig.set(Number.isFinite(num) ? num : null);
  }

  private fechaAdqSig = signal<string>('');
  get fecha_adquisicion() { return this.fechaAdqSig(); }
  set fecha_adquisicion(v: string) { this.fechaAdqSig.set((v ?? '').toString()); }

  private ubicacionSig = signal<string>('');
  get ubicacion() { return this.ubicacionSig(); }
  set ubicacion(v: string) { this.ubicacionSig.set((v ?? '').toString()); }

  private observacionesSig = signal<string>('');
  get observaciones() { return this.observacionesSig(); }
  set observaciones(v: string) { this.observacionesSig.set((v ?? '').toString()); }

  private descripcionSig = signal<string>('');
  get descripcion() { return this.descripcionSig(); }
  set descripcion(v: string) { this.descripcionSig.set((v ?? '').toString()); }

// Mensaje de operación (signal)
private insumoMsgSig = signal<string>('');
get insumoMsg() { return this.insumoMsgSig(); }
set insumoMsg(v: string) { this.insumoMsgSig.set(v || ''); }

// Lista y filtros de insumos (signals + accessors para compatibilidad de template)
private insumosSig = signal<Array<any>>([]);
get insumos() { return this.insumosSig(); }

private insumosFiltradosSig = signal<Array<any>>([]);
get insumosFiltrados() { return this.insumosFiltradosSig(); }

private insumosItemQSig = signal<string>('');
get insumosItemQ() { return this.insumosItemQSig(); }
set insumosItemQ(v: string) { this.insumosItemQSig.set(v || ''); }

private insumosNombreQSig = signal<string>('');
get insumosNombreQ() { return this.insumosNombreQSig(); }
set insumosNombreQ(v: string) { this.insumosNombreQSig.set(v || ''); }

insumosQ = '';
  // Estado de desplegables por tarjeta de insumo
  private expandedInsumos: Set<number> = new Set<number>();
  // Edición inline de cantidad existente por insumo (señales para botones/estados)
  editExistMapSig = signal<Record<number, boolean>>({});
  editExistVal: Record<number, string> = {}; // dejamos valores como objeto simple para [(ngModel)] estable
  savedExistMapSig = signal<Record<number, boolean>>({});
  editExistLoadingSig = signal<Record<number, boolean>>({});
  deleteLoadingSig = signal<Record<number, boolean>>({});

// Panel de catálogo dentro del formulario (autocompletar)
mostrarCatalogoFormPanel: boolean = false;


constructor(private sanitizer: DomSanitizer) {}

async init() {
  try {

    // Cargar auxiliares y catálogo en paralelo para reducir tiempo de espera perceptual
    this.catalogoCargando = true;
    await Promise.all([
      this.loadAux(),
      this.loadInsumos(10),
      this.loadCatalogoInicial()
    ]);

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
  this.insumosSig.set(rows || []);
  this.aplicarFiltroInsumos();
}

async buscarCatalogo() {
  const q = this.normalizarTexto(this.catalogoQ || '');
  if (!this.catalogoBaseSig().length) {
    await this.cargarCatalogoBase();
  }
  this.catalogoCargandoSig.set(true);
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
    this.catalogoCargandoSig.set(false);
  }
}

async cargarCatalogoBase() {
  try {
    const resp = await insumosService.buscarCatalogo('', this.catalogoVisibleCount, this.catalogoOffset);
    if (Array.isArray(resp)) {
      this.catalogoBaseSig.set(resp);
      this.catalogoTotalSig.set(resp.length);
      this.catalogoResultadosSig.set(resp.slice(0, this.catalogoVisibleCount));
    } else {
      const base = resp.rows || [];
      this.catalogoBaseSig.set(base);
      this.catalogoTotalSig.set(resp.total || base.length);
      this.catalogoResultadosSig.set(base.slice());
    }
    this.catalogoItemResultados = this.catalogoBaseSig().slice();
    this.catalogoNombreResultados = this.catalogoBaseSig().slice();

  } catch (e) {
    console.error('Error cargando catálogo inicial de insumos', e);
    this.catalogoMsgSig.set('Error cargando catálogo');
    this.catalogoBaseSig.set([]);
    this.catalogoResultadosSig.set([]);
    this.catalogoTotalSig.set(0);
  }
}

async loadCatalogoInicial() {
  this.catalogoOffset = 0;
  this.catalogoVisibleCount = 10;
  this.itemFiltroSig.set('');
  this.nombreFiltroSig.set('');
  try {
    await this.cargarCatalogoBase();
  } finally {
    this.catalogoCargandoSig.set(false);
  }
}

  seleccionarCatalogo(catalogoItem: any) {
    this.catalogoSeleccionado = catalogoItem;
    
    // ✅ Asignar item_catalogo desde el catálogo
    this.item_catalogo = parseInt(catalogoItem.item) || null;
    this.nombre = catalogoItem.nombre || '';
    this.descripcion = catalogoItem.descripcion || '';
    
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
  this.catalogoTotalSig.set(filtered.length);
  this.catalogoItemResultados = this.catalogoBaseSig().slice();
  this.catalogoNombreResultados = this.catalogoBaseSig().slice();
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
  if (this.catalogoResultadosSig().length >= this.catalogoTotalSig()) return;
  this.catalogoOffset += this.catalogoVisibleCount;
  const resp = await insumosService.buscarCatalogo(this.itemFiltro || this.nombreFiltro || '', this.catalogoVisibleCount, this.catalogoOffset);
  let nuevos: any[] = [];
  if (Array.isArray(resp)) {
    nuevos = resp;
  } else {
    nuevos = resp.rows || [];
  this.catalogoTotalSig.set(resp.total || this.catalogoTotalSig());
  }
  this.catalogoResultadosSig.set(this.catalogoResultadosSig().concat(nuevos));
}

 trackByCatalogo(index: number, catalogoItem: any) {
    return catalogoItem?.item || index;
  }

  // Click en tarjeta del catálogo: precargar datos y enfocar el formulario de crear insumo
  onCatalogCardClick(c: any) {
    try {
      const itemNum = parseInt(String(c?.item), 10);
      this.item_catalogo = Number.isNaN(itemNum) ? null : itemNum;
      this.nombre = c?.nombre || '';
      this.descripcion = c?.descripcion || '';
      this.mostrarDetalles = false;

      // Desplazar hasta el formulario y enfocar el campo Item catálogo
      this.scrollToInsumoForm();
    } catch (e) {
      console.error('Error al manejar click en tarjeta de catálogo', e);
    }
  }

  private scrollToInsumoForm() {
    try {
      // Retrasar para asegurar que el *ngIf renderizó el formulario
      setTimeout(() => {
        this.insumoFormSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Enfocar tras un pequeño delay para permitir el scroll/render
        setTimeout(() => {
          this.itemCatalogoInput?.nativeElement?.focus();
          // Seleccionar valor para facilitar sobreescritura si se desea
          const el = this.itemCatalogoInput?.nativeElement;
          if (el) {
            try { el.setSelectionRange(0, String(el.value || '').length); } catch {}
          }
        }, 200);
      }, 50);
    } catch {}
  }

  // ===== Inventario: desplegable en tarjetas =====
  isInsumoExpanded(i: any): boolean {
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return false;
    return this.expandedInsumos.has(id);
  }

  toggleInsumoCard(i: any) {
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return;
    if (this.expandedInsumos.has(id)) {
      this.expandedInsumos.delete(id);
    } else {
      this.expandedInsumos.add(id);
    }
  }

  onDeleteInsumo(i: any, ev: Event) {
    ev?.stopPropagation?.();
    const id = Number(i?.id);
    if (Number.isFinite(id)) {
      this.eliminarInsumo(id);
    }
  }

  // Porcentaje de existencia vs adquirida, clamped 0-100
  getExistentePct(i: any): number {
    try {
      const adq = Number(i?.cantidad_adquirida);
      const ex = Number(i?.cantidad_existente);
      if (!isFinite(adq) || adq <= 0 || !isFinite(ex) || ex < 0) return 0;
      const pct = (ex / adq) * 100;
      return Math.max(0, Math.min(100, Math.round(pct)));
    } catch {
      return 0;
    }
  }

  getExistenteClass(i: any): string {
    const pct = this.getExistentePct(i);
    if (pct < 20) return 'bad';
    if (pct < 50) return 'warn';
    return 'good';
  }

  // ===== Edición inline de 'cantidad_existente' =====
  isEditingExist(i: any): boolean {
    const id = Number(i?.id);
    return Number.isFinite(id) ? !!this.editExistMapSig()[id] : false;
  }

  startEditExist(i: any, ev?: Event) {
    ev?.stopPropagation?.();
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return;
    this.editExistMapSig.update(map => ({ ...map, [id]: true }));
    this.editExistVal[id] = String(i?.cantidad_existente ?? 0);
  }

  cancelEditExist(i: any, ev?: Event) {
    ev?.stopPropagation?.();
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return;
    this.editExistMapSig.update(map => {
      const next = { ...map } as Record<number, boolean>;
      delete next[id];
      return next;
    });
    delete this.editExistVal[id];
  }

  async saveEditExist(i: any, ev?: Event) {
    ev?.stopPropagation?.();
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return;
    if (this.editExistLoadingSig()[id]) return; // evitar doble click
    const raw = (this.editExistVal[id] ?? '').toString().trim();
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) {
      alert('Cantidad inválida (debe ser un número >= 0)');
      return;
    }
    try {
      this.editExistLoadingSig.update(map => ({ ...map, [id]: true }));
      const resp = await insumosService.ajustarExistencias(id, { cantidad: num });
      // Actualizar el modelo local
      const nuevo = Number(resp?.cantidad_existente);
      i.cantidad_existente = Number.isFinite(nuevo) ? nuevo : num;
      // Cerrar edición
      this.cancelEditExist(i);
      // Marcar guardado para feedback visual y limpiar luego
      this.savedExistMapSig.update(map => ({ ...map, [id]: true }));
      setTimeout(() => {
        this.savedExistMapSig.update(map => {
          const next = { ...map } as Record<number, boolean>;
          delete next[id];
          return next;
        });
      }, 1200);
    } catch (err: any) {
      console.error('Error guardando cantidad existente', err);
      alert(err?.message || 'Error actualizando cantidad existente');
    }
    finally {
      this.editExistLoadingSig.update(map => {
        const next = { ...map } as Record<number, boolean>;
        delete next[id];
        return next;
      });
    }
  }

  wasExistSaved(i: any): boolean {
    const id = Number(i?.id);
    return Number.isFinite(id) ? !!this.savedExistMapSig()[id] : false;
  }

  isLoadingExist(i: any): boolean {
    const id = Number(i?.id);
    return Number.isFinite(id) ? !!this.editExistLoadingSig()[id] : false;
  }

  isDeleteLoading(i: any): boolean {
    const id = Number(i?.id);
    return Number.isFinite(id) ? !!this.deleteLoadingSig()[id] : false;
  }






formatearFecha(fecha: string): string {
  if (!fecha) return '';
  const date = new Date(fecha);
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

mostrarDetallesInsumo(insumo: any) {
  this.insumoSeleccionado = insumo;
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

// Selección desde el catálogo
  onItemSeleccionado() {
    const catalogoItem = this.catalogoBaseSig().find(c => 
      String(c.item) === String(this.item_catalogo) 
    );
    if (!catalogoItem) return;
    
    this.catalogoSeleccionado = catalogoItem;
    this.nombre = catalogoItem.nombre || '';
    this.descripcion = catalogoItem.descripcion || '';
  }

onNombreSeleccionado() {
  const catalogoItem = this.catalogoBaseSig().find(c => (c.nombre || '') === (this.nombre || ''));
  if (!catalogoItem) return;
  this.catalogoSeleccionado = catalogoItem;
  this.item_catalogo = parseInt(catalogoItem.item) || null;            
  this.descripcion = catalogoItem.descripcion || '';
}

// Getters para mantener compatibilidad con el template existente
get catalogoResultados() { return this.catalogoResultadosSig(); }
get catalogoBase() { return this.catalogoBaseSig(); }

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

async crearCatalogo(e: Event) {
    e.preventDefault();
    this.catalogoMsg = '';
    
    const itemStr = (this.catItem ?? '').toString().trim();
    const nombreStr = (this.catNombre ?? '').toString().trim();
    if (!itemStr || !nombreStr) {
      this.catalogoMsg = 'Item y Nombre son requeridos';
      return;
    }
    // validar item numérico
    if (isNaN(Number(itemStr))) {
      this.catalogoMsg = 'El item debe ser numérico';
      return;
    }
    
    try {
      const form = new FormData();
      form.append('nombre', nombreStr);
      const descStr = (this.catDescripcion ?? '').toString().trim();
      if (descStr) form.append('descripcion', descStr);
      if (itemStr) form.append('item', itemStr);
      if (this.catImagen) form.append('imagen', this.catImagen);
      await insumosService.crearCatalogo(form);
      
      this.catalogoMsg = ' Catálogo creado correctamente';
      
      // Limpiar formulario
      this.catItem = '' as any;
      this.catNombre = '';
      this.catDescripcion = '';
      this.catImagen = null;
      
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
  this.insumoMsgSig.set(''); // limpiar mensaje
  try {
    const payload = {
      item_catalogo: this.item_catalogo,
      nombre: this.nombre.trim(),
      marca: this.marca.trim(),
      presentacion: this.presentacion?.trim() || null,
      referencia: this.referencia?.trim() || null,
      cantidad_adquirida: this.cantidad_adquirida,
      cantidad_existente: this.cantidad_existente,
      fecha_adquisicion: this.fecha_adquisicion,
      ubicacion: this.ubicacion.trim() || null,
      observaciones: this.observaciones.trim() || null,
      descripcion: this.descripcion.trim() || null,
    };

    await insumosService.crearInsumo(payload);
  this.insumoMsgSig.set('Insumo creado correctamente');

    await this.loadInsumos();
  } catch (err: any) {
    this.insumoMsgSig.set(err?.message || 'Error creando insumo');
  }
}


resetInsumoForm() {
  this.item_catalogo = null;
  this.nombre = '';
  this.marca = '';
  this.presentacion = '';
  this.referencia = '';
  this.cantidad_adquirida = null;
  this.cantidad_existente = null;
  this.fecha_adquisicion = '';
  this.ubicacion = '';
  this.observaciones = '';
  this.descripcion = '';


  this.insumoMsg = '';
}

  canDelete(): boolean {
    const user = authUser();
    // Solo Administrador y Superadmin pueden eliminar
    return user?.rol === 'Administrador' || user?.rol === 'Superadmin';
  }


async onItemInput() {
  const q = String(this.item_catalogo || '').trim();
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

  const qItem = normalizar(this.insumosItemQSig() || '');
  const qNom  = normalizar(this.insumosNombreQSig() || '');

  // Si no hay filtros, devolver copia completa
  if (!qItem && !qNom) {
    this.insumosFiltradosSig.set((this.insumosSig() || []).slice());
    return;
  }

  const filtrados = (this.insumosSig() || []).filter(i => {
    const itemStr  = normalizar(String(i.item_catalogo ?? ''));
    const nombre   = normalizar(String(i.nombre ?? ''));

    if (qItem && !itemStr.includes(qItem)) return false;
    if (qNom  && !nombre.includes(qNom))   return false;
    return true;
  });
  this.insumosFiltradosSig.set(filtrados);
}


async mostrarTodosInsumos() {
  this.insumosQ = '';
  await this.loadInsumos(); 
}

async eliminarInsumo(id: number) {  
  if (!confirm('¿Eliminar este insumo?')) return;
  
  try {
    // marcar botón eliminar en carga
    this.deleteLoadingSig.update(map => ({ ...map, [id]: true }));
    await insumosService.eliminarInsumo(id);
    await this.loadInsumos();
  } catch (err) {
    console.error('Error eliminando insumo', err);
    alert('Error al eliminar el insumo');
  }
  finally {
    this.deleteLoadingSig.update(map => {
      const next = { ...map } as Record<number, boolean>;
      delete next[id];
      return next;
    });
  }
}

logout() {
  authService.logout();
}

// Imagen catálogo helper
getCatalogoImagenUrl(item: number | string) {
  return insumosService.getCatalogoImagenUrl(item);
}

onCatImagenChange(ev: any) {
  const file = ev?.target?.files?.[0];
  this.catImagen = file || null;
}

onImgError(ev: any) {
  try {
    const img = ev?.target as HTMLImageElement;
    if (img) img.style.display = 'none';
  } catch {}
}


}
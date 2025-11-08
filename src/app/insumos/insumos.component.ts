import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SnackbarService } from '../shared/snackbar.service';
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

// (Listado de insumos eliminado: señales, filtros y edición inline removidos)

// Panel de catálogo dentro del formulario (autocompletar)
mostrarCatalogoFormPanel: boolean = false;


constructor(private sanitizer: DomSanitizer, private snack: SnackbarService) {}

async init() {
  try {

    // Cargar auxiliares y catálogo en paralelo para reducir tiempo de espera perceptual
    this.catalogoCargando = true;
    await Promise.all([
      this.loadAux(),
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

async loadInsumos(limit?: number) { /* listado de insumos eliminado */ }

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

  // ===== Inventario: funcionalidades de tarjetas eliminadas =====

// (Helpers de obtención de nombres eliminados al retirar vista de listado de insumos)

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
      this.snack.warn('Falta completar: Item y Nombre');
      return;
    }
    // validar item numérico
    if (isNaN(Number(itemStr))) {
      this.snack.warn('El item debe ser numérico');
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
      
  this.snack.success('Se creó el item de catálogo');
      
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
      this.snack.error(err?.message || 'Error al crear el item de catálogo');
    }
  }

async crearInsumo(e: Event) {
  e.preventDefault();
  this.insumoMsgSig.set(''); // limpiar mensaje
  // Validación mínima de campos requeridos
  if (!this.item_catalogo || !(this.nombre || '').trim()) {
    this.snack.warn('Faltan campos requeridos: Item catálogo y Nombre');
    return;
  }
  if (this.cantidad_adquirida == null || this.cantidad_existente == null) {
    this.snack.warn('Faltan las cantidades adquirida y existente');
    return;
  }
  if ((this.cantidad_adquirida as any) < 0 || (this.cantidad_existente as any) < 0) {
    this.snack.warn('Las cantidades deben ser números >= 0');
    return;
  }
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
    this.snack.success('Se creó el insumo');

    await this.loadInsumos();
  } catch (err: any) {
    this.snack.error(err?.message || 'Error al crear el insumo');
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
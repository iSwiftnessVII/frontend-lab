import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService, authUser } from '../services/auth.service';
import { insumosService } from '../services/insumos.service';

@Component({  
  standalone: true,
  selector: 'app-insumos',
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.css'],
  imports: [CommonModule, NgIf, FormsModule, RouterModule]
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

  // Catálogo form
  catItem = '';
  catNombre = '';
  catDescripcion = '';
  catImagen: File | null = null;
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

  // Insumo form (nuevo esquema)
  item_catalogo: number | null = null; // FK a catalogo_insumos.item

  nombre = '';
  marca = '';
  presentacion: string = '';
  referencia: string = '';
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
  // Estado de desplegables por tarjeta de insumo
  private expandedInsumos: Set<number> = new Set<number>();

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
  this.catalogoTotal = filtered.length;
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
  this.insumoMsg = ''; // usamos el mensaje correcto
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
    this.insumoMsg = 'Insumo creado correctamente';

    await this.loadInsumos();
  } catch (err: any) {
    this.insumoMsg = err?.message || 'Error creando insumo';
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

  const qItem = normalizar(this.insumosItemQ || '');
  const qNom  = normalizar(this.insumosNombreQ || '');

  // Si no hay filtros, devolver copia completa
  if (!qItem && !qNom) {
    this.insumosFiltrados = (this.insumos || []).slice();
    return;
  }

  this.insumosFiltrados = (this.insumos || []).filter(i => {
    const itemStr  = normalizar(String(i.item_catalogo ?? ''));
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
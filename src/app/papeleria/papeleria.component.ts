import { Component, OnInit, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { papeleriaService } from '../services/papeleria.service';
import { SnackbarService } from '../shared/snackbar.service';
import { authService, authUser } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-papeleria',
  templateUrl: './papeleria.component.html',
  styleUrls: ['./papeleria.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class PapeleriaComponent implements OnInit {
  @ViewChild('papFormSection') papFormSection?: ElementRef<HTMLElement>;
  @ViewChild('itemCatalogoInput') itemCatalogoInput?: ElementRef<HTMLInputElement>;
  // Formulario Catálogo
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

  // Lista catálogo
  catalogoResultadosSig = signal<Array<any>>([]);
  catalogoBaseSig = signal<Array<any>>([]);
  private catalogoCargandoSig = signal<boolean>(false);
  get catalogoCargando() { return this.catalogoCargandoSig(); }
  set catalogoCargando(v: boolean) { this.catalogoCargandoSig.set(!!v); }

  private itemFiltroSig = signal<string>('');
  get itemFiltro() { return this.itemFiltroSig(); }
  set itemFiltro(v: string) { this.itemFiltroSig.set(v ?? ''); }

  private nombreFiltroSig = signal<string>('');
  get nombreFiltro() { return this.nombreFiltroSig(); }
  set nombreFiltro(v: string) { this.nombreFiltroSig.set(v ?? ''); }

  catalogoVisibleCount = 10;
  catalogoOffset = 0;
  private catalogoTotalSig = signal<number>(0);
  get catalogoTotal() { return this.catalogoTotalSig(); }
  set catalogoTotal(v: number) { this.catalogoTotalSig.set(Number(v) || 0); }

  // Formulario Inventario Papelería
  private itemCatalogoSig = signal<number | null>(null);
  get item_catalogo() { return this.itemCatalogoSig(); }
  set item_catalogo(v: number | null) {
    const n = v as any;
    if (n === null || typeof n === 'undefined' || n === '') { this.itemCatalogoSig.set(null); return; }
    const num = Number(n); this.itemCatalogoSig.set(Number.isFinite(num) ? num : null);
  }

  private nombreSig = signal<string>('');
  get nombre() { return this.nombreSig(); }
  set nombre(v: string) { this.nombreSig.set((v ?? '').toString()); }

  private cantidadAdqSig = signal<number | null>(null);
  get cantidad_adquirida() { return this.cantidadAdqSig(); }
  set cantidad_adquirida(v: number | null) {
    const n = (v as any); if (n === null || typeof n === 'undefined' || n === '') { this.cantidadAdqSig.set(null); return; }
    const num = Number(n); this.cantidadAdqSig.set(Number.isFinite(num) ? num : null);
  }

  private cantidadExSig = signal<number | null>(null);
  get cantidad_existente() { return this.cantidadExSig(); }
  set cantidad_existente(v: number | null) {
    const n = (v as any); if (n === null || typeof n === 'undefined' || n === '') { this.cantidadExSig.set(null); return; }
    const num = Number(n); this.cantidadExSig.set(Number.isFinite(num) ? num : null);
  }

  private presentacionSig = signal<string>('');
  get presentacion() { return this.presentacionSig(); }
  set presentacion(v: string) { this.presentacionSig.set((v ?? '').toString()); }

  private marcaSig = signal<string>('');
  get marca() { return this.marcaSig(); }
  set marca(v: string) { this.marcaSig.set((v ?? '').toString()); }

  private descripcionSig = signal<string>('');
  get descripcion() { return this.descripcionSig(); }
  set descripcion(v: string) { this.descripcionSig.set((v ?? '').toString()); }

  private fechaAdqSig = signal<string>('');
  get fecha_adquisicion() { return this.fechaAdqSig(); }
  set fecha_adquisicion(v: string) { this.fechaAdqSig.set((v ?? '').toString()); }

  private ubicacionSig = signal<string>('');
  get ubicacion() { return this.ubicacionSig(); }
  set ubicacion(v: string) { this.ubicacionSig.set((v ?? '').toString()); }

  private observacionesSig = signal<string>('');
  get observaciones() { return this.observacionesSig(); }
  set observaciones(v: string) { this.observacionesSig.set((v ?? '').toString()); }

  private papMsgSig = signal<string>('');
  get papMsg() { return this.papMsgSig(); }
  set papMsg(v: string) { this.papMsgSig.set(v || ''); }

  // Inventario listado eliminado: señales y edición inline removidas
  // ===== Inventario de Papelería (tarjetas) =====
  private papeleriaListSig = signal<Array<any>>([]);
  private papeleriaCargandoSig = signal<boolean>(false);
  private papeleriaErrorSig = signal<string>('');
  get papeleriaList() { return this.papeleriaListSig(); }
  get papeleriaCargando() { return this.papeleriaCargandoSig(); }
  get papeleriaError() { return this.papeleriaErrorSig(); }
  skeletonPapeleria = Array.from({ length: 6 });

  // Filtros inventario Papelería
  private invItemFiltroSig = signal<string>('');
  get invItemFiltro() { return this.invItemFiltroSig(); }
  set invItemFiltro(v: string) { this.invItemFiltroSig.set(v ?? ''); }
  private invNombreFiltroSig = signal<string>('');
  get invNombreFiltro() { return this.invNombreFiltroSig(); }
  set invNombreFiltro(v: string) { this.invNombreFiltroSig.set(v ?? ''); }

  // Control de quitar cantidad por tarjeta (Inventario Papelería)
  private removeQtyMap: Record<number, number | null> = {};
  private busyIds = new Set<number>();
  private openItem: any | null = null;
  getRemoveQty(id: number): number | null { return this.removeQtyMap[id] ?? null; }
  setRemoveQty(id: number, v: any) {
    const num = Number(v);
    this.removeQtyMap[id] = Number.isFinite(num) ? num : null;
  }
  isBusy(id: number) { return this.busyIds.has(id); }
  isValidQty(v: any) { const n = Number(v); return Number.isFinite(n) && n > 0; }
  isOpen(item: any) { return this.openItem === item; }
  toggleOpen(item: any) { this.openItem = (this.openItem === item) ? null : item; }

  ngOnInit() { this.loadCatalogoInicial(); }

  // Cargar listado inicial de inventario de Papelería al montar
  ngAfterViewInit() { this.loadPapeleriaList(); }

  async loadCatalogoInicial() {
    this.catalogoOffset = 0; this.catalogoVisibleCount = 10; this.itemFiltro = ''; this.nombreFiltro = '';
    try {
      this.catalogoCargando = true;
      const resp = await papeleriaService.buscarCatalogo('', this.catalogoVisibleCount, this.catalogoOffset);
      let base: any[] = Array.isArray(resp) ? resp : (resp.rows || []);
      this.catalogoBaseSig.set(base);
      this.catalogoResultadosSig.set(base.slice());
      this.catalogoTotal = Array.isArray(resp) ? base.length : (resp.total || base.length);
    } finally {
      this.catalogoCargando = false;
    }
  }

  filtrarCatalogoPorCampos() {
    const codeQ = (this.itemFiltro || '').trim().toLowerCase();
    const nameQ = (this.nombreFiltro || '').trim().toLowerCase();
    const base = this.catalogoBaseSig();
    let filtered = base;
    if (codeQ) filtered = filtered.filter(c => String(c.item || '').toLowerCase().includes(codeQ));
    if (nameQ) filtered = filtered.filter(c => String(c.nombre || '').toLowerCase().includes(nameQ));
    this.catalogoResultadosSig.set(filtered);
  }

  // Mostrar más y reiniciar catálogo (paridad con Insumos)
  resetCatalogoPaginado() {
    this.catalogoVisibleCount = 10;
    this.catalogoOffset = 0;
    this.loadCatalogoInicial();
  }

  async cargarMasCatalogo() {
    if (this.catalogoResultadosSig().length >= this.catalogoTotal) return;
    this.catalogoOffset += this.catalogoVisibleCount;
    const resp = await papeleriaService.buscarCatalogo(this.itemFiltro || this.nombreFiltro || '', this.catalogoVisibleCount, this.catalogoOffset);
    let nuevos: any[] = [];
    if (Array.isArray(resp)) {
      nuevos = resp;
    } else {
      nuevos = resp.rows || [];
      this.catalogoTotal = resp.total || this.catalogoTotal;
    }
    this.catalogoResultadosSig.set(this.catalogoResultadosSig().concat(nuevos));
  }

  onCatImagenChange(ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const f = input?.files && input.files[0] ? input.files[0] : null;
    this.catImagen = f;
  }

  async crearCatalogo(ev: Event) {
    ev.preventDefault();
    // Validación mínima
    const itemStr = (this.catItem ?? '').toString().trim();
    const nombreStr = (this.catNombre ?? '').toString().trim();
    if (!itemStr || !nombreStr) { this.snack.warn('Faltan campos requeridos: Item y Nombre'); return; }
    if (isNaN(Number(itemStr))) { this.snack.warn('El item debe ser numérico'); return; }
    const fd = new FormData();
    fd.set('item', String(this.catItem || ''));
    fd.set('nombre', String(this.catNombre || ''));
    if (this.catDescripcion) fd.set('descripcion', this.catDescripcion);
    if (this.catImagen) fd.set('imagen', this.catImagen);
    try {
      await papeleriaService.crearCatalogo(fd);
      this.snack.success('Se creó el item de catálogo');
      // reset simple
      this.catItem = '';
      this.catNombre = '';
      this.catDescripcion = '';
      this.catImagen = null;
      await this.loadCatalogoInicial();
    } catch (e) {
      this.snack.error((e as any)?.message || 'Error al crear el item de catálogo');
    }
  }

  getCatalogoImagenUrl(item: number|string) { return papeleriaService.getCatalogoImagenUrl(item); }
  onImgError(ev: any) { try { const img = ev?.target as HTMLImageElement; if (img) img.style.display = 'none'; } catch {} }

  // Resaltar coincidencias en nombre del catálogo
  constructor(private sanitizer: DomSanitizer, private snack: SnackbarService) {}

  private normalizarTexto(s: string): string {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  highlightField(value: string, field: 'nombre' | 'item'): SafeHtml {
    if (!value) return '' as any;
    const hasCode = !!(this.itemFiltro || '').trim();
    const hasName = !!(this.nombreFiltro || '').trim();
    const exclusiveCode = hasCode && !hasName;
    const exclusiveName = hasName && !hasCode;

    let term: string | null = null;
    if (exclusiveCode && field === 'item') {
      term = this.normalizarTexto(this.itemFiltro);
    } else if (exclusiveName && field === 'nombre') {
      term = this.normalizarTexto(this.nombreFiltro);
    } else {
      return value as any;
    }
    if (!term) return value as any;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'ig');
    const html = value.replace(re, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Click en tarjeta de catálogo: precargar datos de formulario
  onCatalogCardClick(c: any) {
    try {
      const itemNum = parseInt(String(c?.item), 10);
      this.item_catalogo = Number.isNaN(itemNum) ? null : itemNum;
      this.nombre = c?.nombre || '';
      this.descripcion = c?.descripcion || '';
      this.scrollToPapForm();
    } catch {}
  }

  // ===== Menú contextual (click derecho) =====
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuTarget: any = null;

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    if (!this.contextMenuVisible) return;
    if (ev.button !== 0) return;
    this.closeContextMenu();
  }

  onCatalogContextMenu(ev: MouseEvent, item: any) {
    ev.preventDefault(); ev.stopPropagation();
    const { clientX, clientY } = ev;
    const viewportH = window.innerHeight;
    const menuHeight = 90;
    let y = clientY;
    if (clientY + menuHeight > viewportH - 8) { y = viewportH - menuHeight - 8; }
    this.contextMenuX = clientX; this.contextMenuY = y;
    this.contextMenuTarget = item; this.contextMenuVisible = true;
  }
  closeContextMenu() { this.contextMenuVisible = false; this.contextMenuTarget = null; }
  onGlobalClick(ev: any) {
    if (!this.contextMenuVisible) return;
    try { if (ev instanceof MouseEvent && ev.button !== 0) return; } catch {}
    this.closeContextMenu();
  }
  onContextMenuEliminar() {
    const target = this.contextMenuTarget; this.closeContextMenu(); if (!target) return;
    const isCatalogo = typeof target?.item !== 'undefined' && typeof target?.id === 'undefined';
    if (isCatalogo) {
      const codigo = target.item;
      if (!window.confirm(`¿Eliminar del catálogo el item "${target?.nombre || codigo}"?`)) return;
      papeleriaService.eliminarCatalogoPapeleria(codigo)
        .then((res: any) => {
          // Tras éxito, recargar desde backend para asegurar consistencia
          this.loadCatalogoInicial();
          const deleted = (res && typeof res.deleted !== 'undefined') ? Number(res.deleted) : 1;
          this.snack.success(deleted > 0 ? 'Item de catálogo eliminado' : 'Operación completada');
        })
        .catch((e: any) => {
          const status = e?.status;
          if (status === 401) {
            this.snack.error('Debes iniciar sesión para eliminar del catálogo');
          } else if (status === 403) {
            this.snack.error('No tienes permisos para eliminar del catálogo');
          } else if (status === 409) {
            this.snack.error('No se puede eliminar: hay registros que usan este item de catálogo');
          } else if (status === 404) {
            this.snack.error('El item no existe (ya fue eliminado)');
            // Refrescar para reflejar el estado real
            this.loadCatalogoInicial();
          } else {
            this.snack.error(e?.message || 'Error eliminando del catálogo');
          }
          console.error('Error eliminando catálogo papelería:', e);
        });
    } else {
      this.eliminar(target);
    }
  }

  private scrollToPapForm() {
    try {
      setTimeout(() => {
        this.papFormSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          this.itemCatalogoInput?.nativeElement?.focus();
        }, 200);
      }, 50);
    } catch {}
  }

  // Inventario visual eliminado: ya no se carga listado
  // ===== Métodos Inventario Papelería =====
  async loadPapeleriaList(limit?: number) {
    this.papeleriaErrorSig.set('');
    this.papeleriaCargandoSig.set(true);
    try {
      const resp = await papeleriaService.listar('', limit || 0);
      const rows = Array.isArray(resp) ? resp : (resp.rows || resp.data || []);
      this._papeleriaAll = rows;
      this.papeleriaListSig.set(rows);
    } catch (e) {
      console.error('Error cargando listado de papelería', e);
      this.papeleriaErrorSig.set('Error cargando papelería');
      this._papeleriaAll = [];
      this.papeleriaListSig.set([]);
    } finally {
      this.papeleriaCargandoSig.set(false);
    }
  }

  private _papeleriaAll: any[] = [];
  filtrarPapeleriaPorCampos() {
    const codeQ = (this.invItemFiltro || '').trim().toLowerCase();
    const nameQ = (this.invNombreFiltro || '').trim().toLowerCase();
    let filtered = this._papeleriaAll;
    if (codeQ) filtered = filtered.filter(x => String(x.item_catalogo || '').toLowerCase().includes(codeQ));
    if (nameQ) filtered = filtered.filter(x => String(x.nombre || '').toLowerCase().includes(nameQ));
    this.papeleriaListSig.set(filtered);
  }

  async quitar(item: any) {
    try {
      const id = Number(item?.id);
      const qty = this.getRemoveQty(id);
      if (!this.isValidQty(qty)) { this.snack.warn('Ingresa una cantidad válida (> 0)'); return; }
      this.busyIds.add(id);
      const delta = -Math.abs(Number(qty));
      const resp = await papeleriaService.ajustarExistencias(id, { delta });
      const nuevo = (resp as any)?.cantidad_existente;
      if (typeof nuevo !== 'undefined') {
        const updater = (arr: any[]) => arr.map(x => x.id === id ? { ...x, cantidad_existente: nuevo } : x);
        this._papeleriaAll = updater(this._papeleriaAll);
        this.papeleriaListSig.set(updater(this.papeleriaListSig()));
      }
      this.setRemoveQty(id, null);
      this.snack.success('Existencias actualizadas');
    } catch (e: any) {
      this.snack.error(e?.message || 'Error al ajustar existencias');
    } finally {
      try { const id = Number(item?.id); this.busyIds.delete(id); } catch {}
    }
  }

  async eliminar(item: any) {
    const id = Number(item?.id);
    if (!Number.isFinite(id)) { this.snack.warn('No se pudo determinar el ID'); return; }
    const ok = window.confirm(`¿Eliminar el registro de papelería "${item?.nombre || ''}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      this.busyIds.add(id);
      await papeleriaService.eliminar(id);
  this._papeleriaAll = this._papeleriaAll.filter(x => x.id !== id);
  const filtered = this.papeleriaListSig().filter(x => x.id !== id);
  this.papeleriaListSig.set(filtered);
      delete this.removeQtyMap[id];
      if (this.openItem === item) this.openItem = null;
      this.snack.success('Registro eliminado');
    } catch (e: any) {
      this.snack.error(e?.message || 'Error al eliminar');
    } finally {
      this.busyIds.delete(id);
    }
  }

  async crearPapeleria(ev: Event) {
    ev.preventDefault();
    this.papMsg = '';
    // Validación mínima
    if (!this.item_catalogo || !this.nombre || this.cantidad_adquirida == null || this.cantidad_existente == null) {
      this.snack.warn('Faltan campos requeridos del formulario');
      return;
    }
    if ((this.cantidad_adquirida as any) < 0 || (this.cantidad_existente as any) < 0) {
      this.snack.warn('Las cantidades deben ser números >= 0');
      return;
    }
    try {
      const payload = {
        item_catalogo: this.item_catalogo,
        nombre: (this.nombre || '').trim(),
        cantidad_adquirida: this.cantidad_adquirida,
        cantidad_existente: this.cantidad_existente,
        presentacion: (this.presentacion || '').trim() || null,
        marca: (this.marca || '').trim() || null,
        descripcion: (this.descripcion || '').trim() || null,
        fecha_adquisicion: this.fecha_adquisicion || null,
        ubicacion: (this.ubicacion || '').trim() || null,
        observaciones: (this.observaciones || '').trim() || null,
      };
      await papeleriaService.crear(payload);
      this.snack.success('Se creó el registro de papelería');
  // Inventario visual removido: no recargamos listado
    } catch (err: any) {
      this.snack.error(err?.message || 'Error al crear el registro de papelería');
    }
  }

}

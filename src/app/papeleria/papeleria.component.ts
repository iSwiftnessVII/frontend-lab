import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
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

  // Lista y filtros
  private papeleriaSig = signal<Array<any>>([]);
  get papeleriaLista() { return this.papeleriaSig(); }
  private papFiltradaSig = signal<Array<any>>([]);
  get papeleriaFiltrada() { return this.papFiltradaSig(); }
  private papItemQSig = signal<string>('');
  get papItemQ() { return this.papItemQSig(); }
  set papItemQ(v: string) { this.papItemQSig.set(v || ''); }
  private papNombreQSig = signal<string>('');
  get papNombreQ() { return this.papNombreQSig(); }
  set papNombreQ(v: string) { this.papNombreQSig.set(v || ''); }

  // Estado de tarjetas y edición inline (igual que Insumos)
  private expandedInsumos: Set<number> = new Set<number>();
  editExistMapSig = signal<Record<number, boolean>>({});
  editExistVal: Record<number, string> = {};
  savedExistMapSig = signal<Record<number, boolean>>({});
  editExistLoadingSig = signal<Record<number, boolean>>({});
  deleteLoadingSig = signal<Record<number, boolean>>({});

  ngOnInit() {
    this.loadCatalogoInicial();
    this.loadPapeleria(10);
  }

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

  // Inventario: cargar y filtrar
  async loadPapeleria(limit?: number) {
    const rows = await papeleriaService.listar('', limit);
    this.papeleriaSig.set(rows || []);
    this.aplicarFiltroPapeleria();
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
      await this.loadPapeleria();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error al crear el registro de papelería');
    }
  }

  async filtrarPapeleria() { this.aplicarFiltroPapeleria(); }
  private aplicarFiltroPapeleria() {
    const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const qItem = norm(this.papItemQ || '');
    const qNom = norm(this.papNombreQ || '');
    if (!qItem && !qNom) { this.papFiltradaSig.set((this.papeleriaSig() || []).slice()); return; }
    const filtrados = (this.papeleriaSig() || []).filter(i => {
      const itemStr = norm(String(i.item_catalogo ?? ''));
      const nombre = norm(String(i.nombre ?? ''));
      if (qItem && !itemStr.includes(qItem)) return false;
      if (qNom && !nombre.includes(qNom)) return false;
      return true;
    });
    this.papFiltradaSig.set(filtrados);
  }

  getExistentePct(i: any): number {
    try {
      const adq = Number(i?.cantidad_adquirida);
      const ex = Number(i?.cantidad_existente);
      if (!isFinite(adq) || adq <= 0 || !isFinite(ex) || ex < 0) return 0;
      const pct = (ex / adq) * 100;
      return Math.max(0, Math.min(100, Math.round(pct)));
    } catch { return 0; }
  }

  getExistenteClass(i: any): string {
    const pct = this.getExistentePct(i);
    if (pct < 20) return 'bad';
    if (pct < 50) return 'warn';
    return 'good';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha);
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  }

  // Expand/collapse cards
  isInsumoExpanded(i: any): boolean {
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return false;
    return this.expandedInsumos.has(id);
  }
  toggleInsumoCard(i: any) {
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return;
    if (this.expandedInsumos.has(id)) this.expandedInsumos.delete(id);
    else this.expandedInsumos.add(id);
  }

  // Inline edit cantidad_existente
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
    this.editExistMapSig.update(map => { const next = { ...map } as Record<number, boolean>; delete next[id]; return next; });
    delete this.editExistVal[id];
  }
  async saveEditExist(i: any, ev?: Event) {
    ev?.stopPropagation?.();
    const id = Number(i?.id);
    if (!Number.isFinite(id)) return;
    if (this.editExistLoadingSig()[id]) return;
    const raw = (this.editExistVal[id] ?? '').toString().trim();
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) { alert('Cantidad inválida (>= 0)'); return; }
    try {
      this.editExistLoadingSig.update(map => ({ ...map, [id]: true }));
      const resp = await papeleriaService.ajustarExistencias(id, { cantidad: num });
      const nuevo = Number(resp?.cantidad_existente);
      i.cantidad_existente = Number.isFinite(nuevo) ? nuevo : num;
      this.cancelEditExist(i);
      this.savedExistMapSig.update(map => ({ ...map, [id]: true }));
      setTimeout(() => {
        this.savedExistMapSig.update(map => { const next = { ...map } as Record<number, boolean>; delete next[id]; return next; });
      }, 1200);
    } catch (err: any) {
      console.error('Error guardando cantidad existente', err);
      alert(err?.message || 'Error actualizando cantidad existente');
    } finally {
      this.editExistLoadingSig.update(map => { const next = { ...map } as Record<number, boolean>; delete next[id]; return next; });
    }
  }
  wasExistSaved(i: any): boolean { const id = Number(i?.id); return Number.isFinite(id) ? !!this.savedExistMapSig()[id] : false; }
  isLoadingExist(i: any): boolean { const id = Number(i?.id); return Number.isFinite(id) ? !!this.editExistLoadingSig()[id] : false; }
  isDeleteLoading(i: any): boolean { const id = Number(i?.id); return Number.isFinite(id) ? !!this.deleteLoadingSig()[id] : false; }

  async eliminarPapeleria(id: number) {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      this.deleteLoadingSig.update(map => ({ ...map, [id]: true }));
      await papeleriaService.eliminar(id);
      await this.loadPapeleria();
    } catch (err) {
      console.error('Error eliminando registro', err);
      alert('Error al eliminar');
    } finally {
      this.deleteLoadingSig.update(map => { const next = { ...map } as Record<number, boolean>; delete next[id]; return next; });
    }
  }
  onDeleteInsumo(i: any, ev: Event) { ev?.stopPropagation?.(); const id = Number(i?.id); if (Number.isFinite(id)) this.eliminarPapeleria(id); }

  canDelete(): boolean { const user = authUser(); return user?.rol === 'Administrador' || user?.rol === 'Superadmin'; }

  onImgError(ev: any) { try { const img = ev?.target as HTMLImageElement; if (img) img.style.display = 'none'; } catch {}
  }
}

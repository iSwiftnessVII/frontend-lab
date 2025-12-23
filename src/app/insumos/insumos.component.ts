import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InsumoCreateInput, InsumoUpdateInput, insumosService } from '../services/insumos.service';
import { SnackbarService } from '../shared/snackbar.service';
import { authService, authUser } from '../services/auth.service';
import { logsService } from '../services/logs.service';

@Component({
  standalone: true,
  selector: 'app-insumos',
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class InsumosComponent implements OnInit, OnDestroy {
  readonly user = authUser;

  get esAuxiliar(): boolean {
    const u = this.user();
    return !!u && u.rol === 'Auxiliar';
  }

  canDelete(): boolean {
    const u = this.user();
    return u?.rol === 'Administrador' || u?.rol === 'Superadmin';
  }

  formularioActivo: 'crear' | null = null;
  detallesVisibles: Record<string, boolean> = {};

  cargando = signal(false);
  insumosSig = signal<any[]>([]);
  insumosQ = '';

  nombre = '';
  cantidad_adquirida: number | null = null;
  cantidad_existente: number | null = null;
  presentacion = '';
  marca = '';
  referencia = '';
  descripcion = '';
  fecha_adquisicion = '';
  ubicacion = '';
  observaciones = '';
  imagenFile: File | null = null;
  imagenPreviewUrl: string | null = null;

  private imagenBust: Record<string, string> = {};
  private insumoImageSrcByIdSig = signal<Record<string, string | null>>({});
  private insumoImageLoadingIds = new Set<string>();
  reduceCantidadByKey: Record<string, number | null> = {};
  private reducingKeys = new Set<string>();

  editInsumoModalOpen = false;
  editInsumoModalClosing = false;
  editInsumoId: number | null = null;
  editNombre = '';
  editCantidadAdquirida: number | null = null;
  editCantidadExistente: number | null = null;
  editPresentacion = '';
  editMarca = '';
  editReferencia = '';
  editDescripcion = '';
  editFechaAdquisicion = '';
  editUbicacion = '';
  editObservaciones = '';
  editImagenFile: File | null = null;
  editImagenPreviewUrl: string | null = null;

  insumosFiltrados = computed(() => {
    const q = (this.insumosQ || '').trim().toLowerCase();
    const rows = this.insumosSig() || [];
    if (!q) return rows;
    return rows.filter((r: any) => {
      const hay = [
        r?.nombre,
        r?.marca,
        r?.referencia,
        r?.ubicacion,
        r?.presentacion,
        r?.descripcion,
        r?.observaciones
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  });

  constructor(public snack: SnackbarService) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  ngOnDestroy(): void {
    const map = this.insumoImageSrcByIdSig();
    for (const url of Object.values(map)) {
      this.revokePreviewUrl(url ?? null);
    }
  }

  private revokePreviewUrl(url: string | null): void {
    if (url && url.startsWith('blob:')) {
      try { URL.revokeObjectURL(url); } catch { }
    }
  }

  toggleFormulario(kind: 'crear'): void {
    if (this.esAuxiliar) return;
    this.formularioActivo = this.formularioActivo === kind ? null : kind;
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const rows = await insumosService.listarInsumos('', 2000);
      this.insumosSig.set(rows);
    } catch (err: any) {
      this.insumosSig.set([]);
      this.snack.error(err?.message || 'Error cargando insumos');
    } finally {
      this.cargando.set(false);
    }
  }

  onImagenChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.imagenFile = file;
    this.revokePreviewUrl(this.imagenPreviewUrl);
    this.imagenPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  private insumoId(i: any): number | null {
    const id =
      i?.id ??
      i?.insumo_id ??
      i?.id_insumo ??
      i?.codigo ??
      i?.codigo_insumo ??
      null;
    const n = typeof id === 'number' ? id : parseInt(String(id || ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  insumoKey(i: any, index: number): string {
    const id =
      i?.id ??
      i?.insumo_id ??
      i?.id_insumo ??
      i?.codigo ??
      i?.codigo_insumo ??
      null;

    if (id !== null && id !== undefined && id !== '') return String(id);

    const nombre = (i?.nombre ?? '').toString().trim();
    const fecha = (i?.fecha_adquisicion ?? '').toString().trim();
    const marca = (i?.marca ?? '').toString().trim();
    const ubicacion = (i?.ubicacion ?? '').toString().trim();
    return [nombre, marca, ubicacion, fecha, String(index)].filter(Boolean).join('|');
  }

  toggleInsumoDetails(key: string): void {
    this.detallesVisibles[key] = !this.detallesVisibles[key];
  }

  isReduciendo(key: string): boolean {
    return this.reducingKeys.has(key);
  }

  private toDateInput(val: any): string {
    const s = this.limpiarFecha(val);
    return s === '—' ? '' : s;
  }

  async reducirExistencias(i: any, key: string, event?: Event): Promise<void> {
    if (event) event.stopPropagation();

    const id = this.insumoId(i);
    if (!id) {
      this.snack.warn('No se pudo identificar el registro');
      return;
    }

    const rawCantidad = this.reduceCantidadByKey[key];
    const cantidad = Number(rawCantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      this.snack.warn('Ingrese una cantidad válida para reducir');
      return;
    }

    const existente = Number(i?.cantidad_existente);
    if (!Number.isFinite(existente)) {
      this.snack.warn('La cantidad existente no es válida');
      return;
    }
    if (cantidad > existente) {
      this.snack.warn(`Cantidad insuficiente. Disponible: ${existente}`);
      return;
    }

    const adquirida = Number(i?.cantidad_adquirida);
    if (!Number.isFinite(adquirida) || adquirida < 0) {
      this.snack.warn('La cantidad adquirida no es válida');
      return;
    }

    const input: InsumoUpdateInput = {
      nombre: (i?.nombre || '').toString().trim(),
      cantidad_adquirida: adquirida,
      cantidad_existente: existente - cantidad,
      presentacion: (i?.presentacion || '').toString().trim() || null,
      marca: (i?.marca || '').toString().trim() || null,
      referencia: (i?.referencia || '').toString().trim() || null,
      descripcion: (i?.descripcion || '').toString().trim() || null,
      fecha_adquisicion: this.toDateInput(i?.fecha_adquisicion) || null,
      ubicacion: (i?.ubicacion || '').toString().trim() || null,
      observaciones: (i?.observaciones || '').toString().trim() || null
    };

    if (!input.nombre) {
      this.snack.warn('El nombre es obligatorio');
      return;
    }

    this.reducingKeys.add(key);
    try {
      await insumosService.actualizarInsumo(id, input, null);
      this.reduceCantidadByKey[key] = null;
      this.snack.success('Existencias actualizadas');
      logsService.crearLogAccion({
        modulo: 'INSUMOS',
        accion: 'CONSUMO',
        descripcion: `Consumo de existencias de insumo: ${id}`,
        detalle: {
          id,
          nombre: (i?.nombre || '').toString().trim() || null,
          key,
          cantidad_reducida: cantidad,
          cantidad_existente_anterior: existente,
          cantidad_existente_nueva: existente - cantidad
        }
      }).catch(console.error);
      await this.cargar();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error actualizando existencias');
    } finally {
      this.reducingKeys.delete(key);
    }
  }

  editInsumo(i: any): void {
    if (!this.canDelete()) return;
    const id = this.insumoId(i);
    if (!id) return;
    this.openEditInsumoModal(i, id);
  }

  async deleteInsumo(i: any): Promise<void> {
    if (!this.canDelete()) return;
    const id = this.insumoId(i);
    if (!id) return;
    const nombre = (i?.nombre || '').toString().trim();
    const ok = window.confirm(`¿Estás seguro de que quieres eliminar${nombre ? ` "${nombre}"` : ''}?`);
    if (!ok) return;
    try {
      await insumosService.eliminarInsumo(id);
      this.snack.success('Insumo eliminado');
      logsService.crearLogAccion({
        modulo: 'INSUMOS',
        accion: 'ELIMINAR',
        descripcion: `Eliminación de insumo: ${id}`,
        detalle: { id, nombre: nombre || null }
      }).catch(console.error);
      await this.cargar();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error eliminando insumo');
    }
  }

  private openEditInsumoModal(i: any, id: number): void {
    this.editInsumoModalClosing = false;
    this.editInsumoModalOpen = true;
    this.editInsumoId = id;
    this.editNombre = (i?.nombre || '').toString();
    this.editCantidadAdquirida = i?.cantidad_adquirida ?? null;
    this.editCantidadExistente = i?.cantidad_existente ?? null;
    this.editPresentacion = (i?.presentacion || '').toString();
    this.editMarca = (i?.marca || '').toString();
    this.editReferencia = (i?.referencia || '').toString();
    this.editDescripcion = (i?.descripcion || '').toString();
    this.editFechaAdquisicion = this.toDateInput(i?.fecha_adquisicion);
    this.editUbicacion = (i?.ubicacion || '').toString();
    this.editObservaciones = (i?.observaciones || '').toString();
    this.editImagenFile = null;
    this.revokePreviewUrl(this.editImagenPreviewUrl);
    this.editImagenPreviewUrl = null;
  }

  closeEditInsumoModal(): void {
    if (!this.editInsumoModalOpen || this.editInsumoModalClosing) return;
    this.editInsumoModalClosing = true;
    setTimeout(() => {
      this.editInsumoModalClosing = false;
      this.editInsumoModalOpen = false;
      this.editInsumoId = null;
      this.editNombre = '';
      this.editCantidadAdquirida = null;
      this.editCantidadExistente = null;
      this.editPresentacion = '';
      this.editMarca = '';
      this.editReferencia = '';
      this.editDescripcion = '';
      this.editFechaAdquisicion = '';
      this.editUbicacion = '';
      this.editObservaciones = '';
      this.editImagenFile = null;
      this.revokePreviewUrl(this.editImagenPreviewUrl);
      this.editImagenPreviewUrl = null;
    }, 220);
  }

  onEditImagenChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.editImagenFile = file;
    this.revokePreviewUrl(this.editImagenPreviewUrl);
    this.editImagenPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  async saveEditInsumo(): Promise<void> {
    if (!this.canDelete()) return;
    if (!this.editInsumoId) return;

    const cantidadExistenteNum = Number(this.editCantidadExistente);
    const input: InsumoUpdateInput = {
      nombre: (this.editNombre || '').trim(),
      cantidad_adquirida: Number(this.editCantidadAdquirida),
      cantidad_existente: Number.isFinite(cantidadExistenteNum) ? cantidadExistenteNum : undefined,
      presentacion: (this.editPresentacion || '').trim() || null,
      marca: (this.editMarca || '').trim() || null,
      referencia: (this.editReferencia || '').trim() || null,
      descripcion: (this.editDescripcion || '').trim() || null,
      fecha_adquisicion: this.editFechaAdquisicion || null,
      ubicacion: (this.editUbicacion || '').trim() || null,
      observaciones: (this.editObservaciones || '').trim() || null
    };

    if (!input.nombre) {
      this.snack.warn('El nombre es obligatorio');
      return;
    }
    if (!Number.isFinite(input.cantidad_adquirida) || input.cantidad_adquirida < 0) {
      this.snack.warn('La cantidad adquirida es obligatoria');
      return;
    }

    try {
      await insumosService.actualizarInsumo(this.editInsumoId, input, null);
      if (this.editImagenFile) {
        await insumosService.actualizarImagenInsumo(this.editInsumoId, this.editImagenFile);
      }
      this.imagenBust[String(this.editInsumoId)] = String(Date.now());
      this.clearCachedInsumoImage(this.editInsumoId);
      if (this.editImagenFile) {
        this.setCachedInsumoImageFromFile(this.editInsumoId, this.editImagenFile);
      }
      this.snack.success('Insumo actualizado');
      logsService.crearLogAccion({
        modulo: 'INSUMOS',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de insumo: ${this.editInsumoId}`,
        detalle: { id: this.editInsumoId, ...input, actualizo_imagen: !!this.editImagenFile }
      }).catch(console.error);
      this.closeEditInsumoModal();
      await this.cargar();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error actualizando insumo');
    }
  }

  limpiarFecha(val: any): string {
    if (val === null || val === undefined || val === '') return '—';
    const s = String(val);
    const m = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (m) {
      const y = m[1];
      const mo = m[2].padStart(2, '0');
      const d = m[3].padStart(2, '0');
      return `${y}-${mo}-${d}`;
    }
    const m2 = s.match(/(\d{4})(\d{2})(\d{2})/);
    if (m2) {
      return `${m2[1]}-${m2[2]}-${m2[3]}`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    }
    const digits = s.replace(/[^0-9]/g, '');
    if (digits.length >= 8) {
      const y = digits.slice(0, 4);
      const mo = digits.slice(4, 6);
      const da = digits.slice(6, 8);
      return `${y}-${mo}-${da}`;
    }
    return '—';
  }

  private withImageBust(url: string, id: number | null): string {
    if (!id) return url;
    const v = this.imagenBust[String(id)];
    if (!v) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${encodeURIComponent(v)}`;
  }

  private clearCachedInsumoImage(id: number): void {
    const key = String(id);
    const current = this.insumoImageSrcByIdSig();
    if (!Object.prototype.hasOwnProperty.call(current, key)) return;
    const prev = current[key] ?? null;
    this.revokePreviewUrl(prev);
    const next = { ...current };
    delete next[key];
    this.insumoImageSrcByIdSig.set(next);
  }

  private setCachedInsumoImageFromFile(id: number, file: File): void {
    const key = String(id);
    const url = URL.createObjectURL(file);
    const current = this.insumoImageSrcByIdSig();
    const prev = current[key] ?? null;
    this.revokePreviewUrl(prev);
    this.insumoImageSrcByIdSig.set({ ...current, [key]: url });
  }

  private async ensureInsumoImageLoaded(id: number): Promise<void> {
    const key = String(id);
    if (this.insumoImageLoadingIds.has(key)) return;
    const current = this.insumoImageSrcByIdSig();
    if (Object.prototype.hasOwnProperty.call(current, key)) return;
    this.insumoImageLoadingIds.add(key);
    try {
      const env = (window as any).__env || {};
      const apiBase = env.API_INSUMOS || 'http://localhost:4000/api/insumos';
      const token = authService.getToken?.() || localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const apiBaseNoTrail = String(apiBase).replace(/\/$/, '');
      let origin = 'http://localhost:4000';
      try {
        origin = new URL(apiBaseNoTrail).origin;
      } catch {
        origin = 'http://localhost:4000';
      }

      const urls = [
        `${apiBaseNoTrail}/${encodeURIComponent(String(id))}/imagen`,
        `${apiBaseNoTrail}/${encodeURIComponent(String(id))}/image`,
        `${origin}/api/insumos/${encodeURIComponent(String(id))}/imagen`,
        `${apiBaseNoTrail}/imagen?id=${encodeURIComponent(String(id))}`
      ];

      let blobUrl: string | null = null;
      for (const u of urls) {
        try {
          const res = await fetch(u, { headers });
          if (!res.ok) continue;
          const ct = (res.headers.get('content-type') || '').toLowerCase();
          if (!ct.startsWith('image/') && !ct.includes('octet-stream')) continue;
          const blob = await res.blob();
          blobUrl = URL.createObjectURL(blob);
          break;
        } catch {
          continue;
        }
      }

      this.insumoImageSrcByIdSig.set({ ...this.insumoImageSrcByIdSig(), [key]: blobUrl });
    } finally {
      this.insumoImageLoadingIds.delete(key);
    }
  }

  private async ensureInsumoImageLoadedFromUrl(id: number, url: string): Promise<void> {
    const key = String(id);
    if (this.insumoImageLoadingIds.has(key)) return;
    this.insumoImageLoadingIds.add(key);
    try {
      const token = authService.getToken?.() || localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) {
        this.insumoImageSrcByIdSig.set({ ...this.insumoImageSrcByIdSig(), [key]: null });
        return;
      }
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!ct.startsWith('image/') && !ct.includes('octet-stream')) {
        this.insumoImageSrcByIdSig.set({ ...this.insumoImageSrcByIdSig(), [key]: null });
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const current = this.insumoImageSrcByIdSig();
      const prev = current[key] ?? null;
      this.revokePreviewUrl(prev);
      this.insumoImageSrcByIdSig.set({ ...current, [key]: blobUrl });
    } catch {
      this.insumoImageSrcByIdSig.set({ ...this.insumoImageSrcByIdSig(), [key]: null });
    } finally {
      this.insumoImageLoadingIds.delete(key);
    }
  }

  onInsumoImgError(i: any, attemptedSrc: string): void {
    const id = this.insumoId(i);
    if (!id) return;
    if (!attemptedSrc) return;
    if (/^blob:/i.test(attemptedSrc)) return;

    const key = String(id);
    const map = this.insumoImageSrcByIdSig();
    if (Object.prototype.hasOwnProperty.call(map, key)) return;
    void this.ensureInsumoImageLoadedFromUrl(id, attemptedSrc);
  }

  resolveInsumoImageUrl(i: any): string | null {
    const env = (window as any).__env || {};
    const apiBase = env.API_INSUMOS || 'http://localhost:4000/api/insumos';
    let origin = 'http://localhost:4000';
    try {
      origin = new URL(String(apiBase)).origin;
    } catch {
      origin = 'http://localhost:4000';
    }

    const iid = this.insumoId(i);
    const raw =
      i?.imagen_url ??
      i?.url_imagen ??
      i?.imagen?.url ??
      i?.imagen?.path ??
      i?.imagen ??
      i?.imagen_path ??
      i?.ruta_imagen ??
      i?.url ??
      null;
    if (!raw) {
      const id =
        i?.id ??
        i?.insumo_id ??
        i?.id_insumo ??
        i?.codigo ??
        i?.codigo_insumo ??
        null;
      if (id === null || id === undefined || id === '') return null;
      const n = Number(id);
      if (Number.isFinite(n)) {
        void this.ensureInsumoImageLoaded(n);
        const map = this.insumoImageSrcByIdSig();
        const k = String(n);
        if (Object.prototype.hasOwnProperty.call(map, k)) return map[k] ?? null;
      }
      const apiBaseNoTrail = String(apiBase).replace(/\/$/, '');
      return this.withImageBust(`${apiBaseNoTrail}/${encodeURIComponent(String(id))}/imagen`, iid);
    }
    const s = String(raw).trim();
    if (!s) return null;
    if (/^(data:|blob:)/i.test(s)) return s;

    if (iid) {
      const map = this.insumoImageSrcByIdSig();
      const k = String(iid);
      if (Object.prototype.hasOwnProperty.call(map, k)) return map[k] ?? null;
    }

    if (/^https?:\/\//i.test(s)) return this.withImageBust(s, iid);
    if (s.startsWith('/')) return this.withImageBust(`${origin}${s}`, iid);
    return this.withImageBust(`${origin}/${s}`, iid);
  }

  async crearInsumo(event: Event): Promise<void> {
    event.preventDefault();
    if (this.esAuxiliar) return;

    const input: InsumoCreateInput = {
      nombre: (this.nombre || '').trim(),
      cantidad_adquirida: Number(this.cantidad_adquirida),
      cantidad_existente: Number(this.cantidad_existente),
      presentacion: (this.presentacion || '').trim() || null,
      marca: (this.marca || '').trim() || null,
      referencia: (this.referencia || '').trim() || null,
      descripcion: (this.descripcion || '').trim() || null,
      fecha_adquisicion: this.fecha_adquisicion || null,
      ubicacion: (this.ubicacion || '').trim() || null,
      observaciones: (this.observaciones || '').trim() || null
    };

    if (!input.nombre) {
      this.snack.warn('El nombre es obligatorio');
      return;
    }
    if (!Number.isFinite(input.cantidad_adquirida) || input.cantidad_adquirida < 0) {
      this.snack.warn('La cantidad adquirida es obligatoria');
      return;
    }
    if (!Number.isFinite(input.cantidad_existente) || input.cantidad_existente < 0) {
      this.snack.warn('La cantidad existente es obligatoria');
      return;
    }

    try {
      const created = await insumosService.crearInsumo(input, this.imagenFile);
      const createdId = this.insumoId(created);
      if (createdId && this.imagenFile) {
        this.setCachedInsumoImageFromFile(createdId, this.imagenFile);
      }
      this.snack.success('Insumo registrado');
      logsService.crearLogAccion({
        modulo: 'INSUMOS',
        accion: 'CREAR',
        descripcion: `Creación de insumo: ${createdId ?? input.nombre}`,
        detalle: { id: createdId ?? null, ...input, creo_imagen: !!this.imagenFile }
      }).catch(console.error);
      this.resetForm();
      this.formularioActivo = null;
      await this.cargar();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error registrando insumo');
    }
  }

  resetForm(): void {
    this.nombre = '';
    this.cantidad_adquirida = null;
    this.cantidad_existente = null;
    this.presentacion = '';
    this.marca = '';
    this.referencia = '';
    this.descripcion = '';
    this.fecha_adquisicion = '';
    this.ubicacion = '';
    this.observaciones = '';
    this.imagenFile = null;
    this.revokePreviewUrl(this.imagenPreviewUrl);
    this.imagenPreviewUrl = null;
  }
}

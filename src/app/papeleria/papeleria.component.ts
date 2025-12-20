import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SnackbarService } from '../shared/snackbar.service';
import { authUser } from '../services/auth.service';
import { PapeleriaCreateInput, PapeleriaPresentacion, PapeleriaService, PapeleriaUpdateInput } from '../services/papeleria.service';
import { logsService } from '../services/logs.service';

@Component({
  standalone: true,
  selector: 'app-papeleria',
  templateUrl: './papeleria.component.html',
  styleUrls: ['./papeleria.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class PapeleriaComponent implements OnInit {
  readonly user = authUser;

  get esAuxiliar(): boolean {
    const u = this.user();
    return !!u && u.rol === 'Auxiliar';
  }

  formularioActivo: 'crear' | null = null;
  detallesVisibles: Record<string, boolean> = {};

  nombre = '';
  cantidad_adquirida: number | null = null;
  cantidad_existente: number | null = null;
  presentacion: PapeleriaPresentacion | '' = '';
  marca = '';
  descripcion = '';
  fecha_adquisicion = '';
  ubicacion = '';
  observaciones = '';
  imagenFile: File | null = null;
  imagenPreviewUrl: string | null = null;

  private imagenBust: Record<string, string> = {};

  reduceCantidadByKey: Record<string, number | null> = {};
  private reducingKeys = new Set<string>();

  editPapeleriaModalOpen = false;
  editPapeleriaModalClosing = false;
  editPapeleriaId: number | null = null;
  editNombre = '';
  editCantidadAdquirida: number | null = null;
  editCantidadExistente: number | null = null;
  editPresentacion: PapeleriaPresentacion | '' = '';
  editMarca = '';
  editDescripcion = '';
  editFechaAdquisicion = '';
  editUbicacion = '';
  editObservaciones = '';
  editImagenFile: File | null = null;
  editImagenPreviewUrl: string | null = null;

  cargando = signal(false);
  papeleriaQ = '';
  papeleriaSig = signal<any[]>([]);

  papeleriaFiltrada = computed(() => {
    const q = (this.papeleriaQ || '').trim().toLowerCase();
    const rows = this.papeleriaSig() || [];
    if (!q) return rows;
    return rows.filter((r: any) => {
      const hay = [
        r?.nombre,
        r?.marca,
        r?.ubicacion,
        r?.presentacion,
        r?.descripcion,
        r?.observaciones
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  });

  readonly presentaciones: PapeleriaPresentacion[] = ['unidad', 'paquete', 'caja', 'cajas'];

  constructor(
    private papeleriaService: PapeleriaService,
    public snack: SnackbarService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarPapeleria();
  }

  toggleFormulario(kind: 'crear'): void {
    if (this.esAuxiliar) return;
    this.formularioActivo = this.formularioActivo === kind ? null : kind;
  }

  canDelete(): boolean {
    const u = this.user();
    return u?.rol === 'Administrador' || u?.rol === 'Superadmin';
  }

  async cargarPapeleria(): Promise<void> {
    this.cargando.set(true);
    try {
      const resp = await this.papeleriaService.listar('', 2000);
      const rows = Array.isArray(resp) ? resp : (resp?.rows || []);
      this.papeleriaSig.set(rows);
    } catch (err: any) {
      this.papeleriaSig.set([]);
      this.snack.error(err?.message || 'Error cargando papelería');
    } finally {
      this.cargando.set(false);
    }
  }

  private revokePreviewUrl(url: string | null): void {
    if (url && url.startsWith('blob:')) {
      try { URL.revokeObjectURL(url); } catch { }
    }
  }

  onImagenChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.imagenFile = file;
    this.revokePreviewUrl(this.imagenPreviewUrl);
    this.imagenPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  async submitPapeleria(event: Event): Promise<void> {
    event.preventDefault();
    if (this.esAuxiliar) return;

    const input: PapeleriaCreateInput = {
      nombre: (this.nombre || '').trim(),
      cantidad_adquirida: Number(this.cantidad_adquirida),
      cantidad_existente: Number(this.cantidad_existente),
      presentacion: this.presentacion as PapeleriaPresentacion,
      marca: (this.marca || '').trim() || null,
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
    if (!input.presentacion) {
      this.snack.warn('La presentación es obligatoria');
      return;
    }

    try {
      const created = await this.papeleriaService.crear(input, this.imagenFile);
      const createdId = this.papeleriaId(created);
      this.snack.success('Papelería registrada');
      logsService.crearLogAccion({
        modulo: 'PAPELERIA',
        accion: 'CREAR',
        descripcion: `Creación de papelería: ${createdId ?? input.nombre}`,
        detalle: { id: createdId ?? null, ...input, creo_imagen: !!this.imagenFile }
      }).catch(console.error);
      this.resetForm();
      this.formularioActivo = null;
      await this.cargarPapeleria();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error registrando papelería');
    }
  }

  resetForm(): void {
    this.nombre = '';
    this.cantidad_adquirida = null;
    this.cantidad_existente = null;
    this.presentacion = '';
    this.marca = '';
    this.descripcion = '';
    this.fecha_adquisicion = '';
    this.ubicacion = '';
    this.observaciones = '';
    this.imagenFile = null;
    this.revokePreviewUrl(this.imagenPreviewUrl);
    this.imagenPreviewUrl = null;
  }

  private papeleriaId(p: any): number | null {
    const id =
      p?.id ??
      p?.papeleria_id ??
      p?.id_papeleria ??
      p?.codigo ??
      p?.codigo_papeleria ??
      null;
    const n = typeof id === 'number' ? id : parseInt(String(id || ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  papeleriaKey(p: any, index: number): string {
    const id =
      p?.id ??
      p?.papeleria_id ??
      p?.id_papeleria ??
      p?.codigo ??
      p?.codigo_papeleria ??
      null;

    if (id !== null && id !== undefined && id !== '') return String(id);

    const nombre = (p?.nombre ?? '').toString().trim();
    const fecha = (p?.fecha_adquisicion ?? '').toString().trim();
    const marca = (p?.marca ?? '').toString().trim();
    const ubicacion = (p?.ubicacion ?? '').toString().trim();
    return [nombre, marca, ubicacion, fecha, String(index)].filter(Boolean).join('|');
  }

  togglePapeleriaDetails(key: string): void {
    this.detallesVisibles[key] = !this.detallesVisibles[key];
  }

  isReduciendo(key: string): boolean {
    return this.reducingKeys.has(key);
  }

  async reducirExistencias(p: any, key: string, event?: Event): Promise<void> {
    if (event) event.stopPropagation();

    const id = this.papeleriaId(p);
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

    const existente = Number(p?.cantidad_existente);
    if (!Number.isFinite(existente)) {
      this.snack.warn('La cantidad existente no es válida');
      return;
    }
    if (cantidad > existente) {
      this.snack.warn(`Cantidad insuficiente. Disponible: ${existente}`);
      return;
    }

    const adquirida = Number(p?.cantidad_adquirida);
    if (!Number.isFinite(adquirida) || adquirida < 0) {
      this.snack.warn('La cantidad adquirida no es válida');
      return;
    }

    const presentacion = (p?.presentacion || '').toString() as PapeleriaPresentacion;
    if (!presentacion) {
      this.snack.warn('La presentación no es válida');
      return;
    }

    const input: PapeleriaUpdateInput = {
      nombre: (p?.nombre || '').toString().trim(),
      cantidad_adquirida: adquirida,
      cantidad_existente: existente - cantidad,
      presentacion,
      marca: (p?.marca || '').toString().trim() || null,
      descripcion: (p?.descripcion || '').toString().trim() || null,
      fecha_adquisicion: this.toDateInput(p?.fecha_adquisicion) || null,
      ubicacion: (p?.ubicacion || '').toString().trim() || null,
      observaciones: (p?.observaciones || '').toString().trim() || null
    };

    if (!input.nombre) {
      this.snack.warn('El nombre es obligatorio');
      return;
    }

    this.reducingKeys.add(key);
    try {
      await this.papeleriaService.actualizar(id, input, null);
      this.reduceCantidadByKey[key] = null;
      this.snack.success('Existencias actualizadas');
      logsService.crearLogAccion({
        modulo: 'PAPELERIA',
        accion: 'CONSUMO',
        descripcion: `Consumo de existencias de papelería: ${id}`,
        detalle: {
          id,
          key,
          cantidad_reducida: cantidad,
          cantidad_existente_anterior: existente,
          cantidad_existente_nueva: existente - cantidad
        }
      }).catch(console.error);
      await this.cargarPapeleria();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error actualizando existencias');
    } finally {
      this.reducingKeys.delete(key);
    }
  }

  editPapeleria(p: any): void {
    if (!this.canDelete()) return;
    const id = this.papeleriaId(p);
    if (!id) return;
    this.openEditPapeleriaModal(p, id);
  }

  async deletePapeleria(p: any): Promise<void> {
    if (!this.canDelete()) return;
    const id = this.papeleriaId(p);
    if (!id) return;
    const nombre = (p?.nombre || '').toString().trim();
    const ok = window.confirm(`¿Estás seguro de que quieres eliminar${nombre ? ` "${nombre}"` : ''}?`);
    if (!ok) return;
    try {
      await this.papeleriaService.eliminar(id);
      this.snack.success('Papelería eliminada');
      logsService.crearLogAccion({
        modulo: 'PAPELERIA',
        accion: 'ELIMINAR',
        descripcion: `Eliminación de papelería: ${id}`,
        detalle: { id, nombre: nombre || null }
      }).catch(console.error);
      await this.cargarPapeleria();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error eliminando papelería');
    }
  }

  private toDateInput(val: any): string {
    const s = this.limpiarFecha(val);
    return s === '—' ? '' : s;
  }

  private openEditPapeleriaModal(p: any, id: number): void {
    this.editPapeleriaModalClosing = false;
    this.editPapeleriaModalOpen = true;
    this.editPapeleriaId = id;
    this.editNombre = (p?.nombre || '').toString();
    this.editCantidadAdquirida = p?.cantidad_adquirida ?? null;
    this.editCantidadExistente = p?.cantidad_existente ?? null;
    this.editPresentacion = (p?.presentacion || '') as any;
    this.editMarca = (p?.marca || '').toString();
    this.editDescripcion = (p?.descripcion || '').toString();
    this.editFechaAdquisicion = this.toDateInput(p?.fecha_adquisicion);
    this.editUbicacion = (p?.ubicacion || '').toString();
    this.editObservaciones = (p?.observaciones || '').toString();
    this.editImagenFile = null;
    this.revokePreviewUrl(this.editImagenPreviewUrl);
    this.editImagenPreviewUrl = null;
  }

  closeEditPapeleriaModal(): void {
    if (!this.editPapeleriaModalOpen || this.editPapeleriaModalClosing) return;
    this.editPapeleriaModalClosing = true;
    setTimeout(() => {
      this.editPapeleriaModalClosing = false;
      this.editPapeleriaModalOpen = false;
      this.editPapeleriaId = null;
      this.editNombre = '';
      this.editCantidadAdquirida = null;
      this.editCantidadExistente = null;
      this.editPresentacion = '';
      this.editMarca = '';
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

  async saveEditPapeleria(): Promise<void> {
    if (!this.canDelete()) return;
    if (!this.editPapeleriaId) return;

    const cantidadExistenteNum = Number(this.editCantidadExistente);
    const input: PapeleriaUpdateInput = {
      nombre: (this.editNombre || '').trim(),
      cantidad_adquirida: Number(this.editCantidadAdquirida),
      cantidad_existente: Number.isFinite(cantidadExistenteNum) ? cantidadExistenteNum : undefined,
      presentacion: this.editPresentacion as PapeleriaPresentacion,
      marca: (this.editMarca || '').trim() || null,
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
    if (!input.presentacion) {
      this.snack.warn('La presentación es obligatoria');
      return;
    }

    try {
      await this.papeleriaService.actualizar(this.editPapeleriaId, input, this.editImagenFile);
      this.imagenBust[String(this.editPapeleriaId)] = String(Date.now());
      this.snack.success('Papelería actualizada');
      logsService.crearLogAccion({
        modulo: 'PAPELERIA',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de papelería: ${this.editPapeleriaId}`,
        detalle: { id: this.editPapeleriaId, ...input, actualizo_imagen: !!this.editImagenFile }
      }).catch(console.error);
      this.closeEditPapeleriaModal();
      await this.cargarPapeleria();
    } catch (err: any) {
      this.snack.error(err?.message || 'Error actualizando papelería');
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

  resolvePapeleriaImageUrl(p: any): string | null {
    const env = (window as any).__env || {};
    const apiBase = env.API_BASE || env.API_PAPELERIA || 'http://localhost:4000/api/papeleria';
    let origin = 'http://localhost:4000';
    try {
      origin = new URL(String(apiBase)).origin;
    } catch {
      origin = 'http://localhost:4000';
    }

    const pid = this.papeleriaId(p);
    const raw =
      p?.imagen_url ??
      p?.url_imagen ??
      p?.imagen?.url ??
      p?.imagen?.path ??
      p?.imagen ??
      p?.imagen_path ??
      p?.ruta_imagen ??
      p?.url ??
      null;
    if (!raw) {
      const id =
        p?.id ??
        p?.papeleria_id ??
        p?.id_papeleria ??
        p?.codigo ??
        p?.codigo_papeleria ??
        null;
      if (id === null || id === undefined || id === '') return null;
      return this.withImageBust(`${origin}/api/papeleria/${encodeURIComponent(String(id))}/imagen`, pid);
    }
    const s = String(raw).trim();
    if (!s) return null;
    if (/^(data:|blob:)/i.test(s)) return s;
    if (/^https?:\/\//i.test(s)) return this.withImageBust(s, pid);

    if (s.startsWith('/')) return this.withImageBust(`${origin}${s}`, pid);
    return this.withImageBust(`${origin}/${s}`, pid);
  }
}

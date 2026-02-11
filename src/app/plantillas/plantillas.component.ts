import { Component, ElementRef, ViewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SnackbarService } from '../shared/snackbar.service';
import { authUser } from '../services/auth.service';
import { usuariosService } from '../services/usuarios.service';
import { SolicitudesService } from '../services/clientes/solicitudes.service';
import { ClientesService } from '../services/clientes/clientes.service';
import { equiposService } from '../services/equipos.service';
import { reactivosService } from '../services/reactivos.service';
import { VolumetricosService } from '../services/volumetricos.service';
import { ReferenciaService } from '../services/referencia.service';

type PlantillasSeccion = 'solicitudes' | 'reactivos' | 'equipos' | 'volumetricos' | 'referencia';
type HelpTab = 'reactivos' | 'solicitudes' | 'equipos' | 'volumetricos' | 'referencia' | 'tutoriales';
type HelpSubtabSolicitudes = 'solicitud' | 'cliente' | 'oferta' | 'revision' | 'seguimiento';
type HelpSubtabEquipos = 'equipo' | 'ficha' | 'historial' | 'intervalos';
type HelpSubtabVolumetricos = 'material' | 'historial' | 'intervalos';
type HelpSubtabReferencia = 'material' | 'historial' | 'intervalos';

@Component({
  standalone: true,
  selector: 'app-plantillas',
  templateUrl: './plantillas.component.html',
  styleUrls: ['./plantillas.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class PlantillasComponent {
  readonly user = authUser;

  helpTab: HelpTab = 'reactivos';
  helpSubtabSolicitudes: HelpSubtabSolicitudes = 'solicitud';
  helpSubtabEquipos: HelpSubtabEquipos = 'equipo';
  helpSubtabVolumetricos: HelpSubtabVolumetricos = 'material';
  helpSubtabReferencia: HelpSubtabReferencia = 'material';

  plantillasCanEdit = true;
  plantillasPermLoading = false;
  private lastPermUserId: number | null = null;

  // ====== Dropdowns (coincidencias tipo Ficha Técnica) ======
  showSolicitudDropdown = false;
  showReactivoDropdown = false;
  showEquipoDropdown = false;
  showVolDropdown = false;
  showRefDropdown = false;

  private solicitudBlurTimer?: ReturnType<typeof setTimeout>;
  private reactivoBlurTimer?: ReturnType<typeof setTimeout>;
  private equipoBlurTimer?: ReturnType<typeof setTimeout>;
  private volBlurTimer?: ReturnType<typeof setTimeout>;
  private refBlurTimer?: ReturnType<typeof setTimeout>;

  get esAuxiliar(): boolean {
    const u = authUser();
    return u?.rol === 'Auxiliar';
  }

  // ====== Sección activa ======
  seccionActiva: PlantillasSeccion = 'reactivos';

  // ====== Solicitudes / Clientes ======
  @ViewChild('tplSolicitudTemplateInput') private tplSolicitudTemplateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('helpDetails') private helpDetails?: ElementRef<HTMLDetailsElement>;

  // Selección (Solicitud)
  tplSolicitudFiltroTipo = 'todos';
  tplSolicitudBusqueda = '';
  tplSolicitudResultados: any[] = [];
  tplSolicitudSeleccionadoId: number | null = null;
  tplSolicitudSeleccionado: any = null;

  // Selección (Cliente)
  showClienteDropdown = false;
  private clienteBlurTimer?: ReturnType<typeof setTimeout>;
  tplClienteFiltroTipo = 'todos';
  tplClienteBusqueda = '';
  tplClienteResultados: any[] = [];
  tplClienteSeleccionadoId: number | null = null;
  tplClienteSeleccionado: any = null;

  tplSolicitudPlantillas = signal<any[]>([]);
  tplSolicitudPlantillaId: number | null = null;
  tplSolicitudNombrePlantilla = '';
  tplSolicitudTemplateFile: File | null = null;
  tplSolicitudMsg = '';
  tplSolicitudLoading = false;
  tplSolicitudListLoading = signal(false);
  tplSolicitudUploadLoading = false;
  tplSolicitudDeleteLoading: Set<number> = new Set<number>();

  // ====== Reactivos ======
  @ViewChild('tplReactivoTemplateInput') private tplReactivoTemplateInput?: ElementRef<HTMLInputElement>;

  tplReactivoFiltroTipo = 'todos';
  tplReactivoBusqueda = '';
  tplReactivoResultados: any[] = [];
  tplReactivoSeleccionadoLote: string | null = null;
  tplReactivoSeleccionado: any = null;
  private tplReactivoSearchSeq = 0;

  tplReactivoPlantillas = signal<any[]>([]);
  tplReactivoPlantillaId: number | null = null;
  tplReactivoNombrePlantilla = '';
  tplReactivoTemplateFile: File | null = null;
  tplReactivoMsg = '';
  tplReactivoLoading = false;
  tplReactivoListLoading = signal(false);
  tplReactivoUploadLoading = false;
  tplReactivoDeleteLoading: Set<number> = new Set<number>();

  // ====== Equipos ======
  @ViewChild('tplEquipoTemplateInput') private tplEquipoTemplateInput?: ElementRef<HTMLInputElement>;

  tplEquipoFiltroTipo = 'todos';
  tplEquipoBusqueda = '';
  tplEquipoResultados: any[] = [];
  tplEquipoSeleccionadoCodigo: string | null = null;
  tplEquipoSeleccionado: any = null;
  private equiposAll: any[] = [];

  tplEquipoPlantillas = signal<any[]>([]);
  tplEquipoPlantillaId: number | null = null;
  tplEquipoNombrePlantilla = '';
  tplEquipoTemplateFile: File | null = null;
  tplEquipoMsg = '';
  tplEquipoLoading = false;
  tplEquipoListLoading = signal(false);
  tplEquipoUploadLoading = false;
  tplEquipoDeleteLoading: Set<number> = new Set<number>();

  // ====== Volumétricos ======
  @ViewChild('tplVolTemplateInput') private tplVolTemplateInput?: ElementRef<HTMLInputElement>;

  tplVolFiltroTipo = 'todos';
  tplVolBusqueda = '';
  tplVolResultados: any[] = [];
  tplVolSeleccionadoCodigo: number | null = null;
  tplVolSeleccionado: any = null;
  private volAll: any[] = [];

  tplVolPlantillas = signal<any[]>([]);
  tplVolPlantillaId: number | null = null;
  tplVolNombrePlantilla = '';
  tplVolTemplateFile: File | null = null;
  tplVolMsg = '';
  tplVolLoading = false;
  tplVolListLoading = signal(false);
  tplVolUploadLoading = false;
  tplVolDeleteLoading: Set<number> = new Set<number>();

  // ====== Referencia ======
  @ViewChild('tplRefTemplateInput') private tplRefTemplateInput?: ElementRef<HTMLInputElement>;

  tplRefFiltroTipo = 'todos';
  tplRefBusqueda = '';
  tplRefResultados: any[] = [];
  tplRefSeleccionadoCodigo: number | null = null;
  tplRefSeleccionado: any = null;
  private refAll: any[] = [];

  tplRefPlantillas = signal<any[]>([]);
  tplRefPlantillaId: number | null = null;
  tplRefNombrePlantilla = '';
  tplRefTemplateFile: File | null = null;
  tplRefMsg = '';
  tplRefLoading = false;
  tplRefListLoading = signal(false);
  tplRefUploadLoading = false;
  tplRefDeleteLoading: Set<number> = new Set<number>();

  constructor(
    private snack: SnackbarService,
    private solicitudesService: SolicitudesService,
    private clientesService: ClientesService,
    private volumetricosService: VolumetricosService,
    private referenciaService: ReferenciaService
  ) {
    effect(() => {
      const u = this.user();
      const userId = Number(u?.id);
      if (!Number.isFinite(userId) || userId <= 0) return;
      if (this.lastPermUserId === userId) return;
      this.lastPermUserId = userId;
      void this.loadPlantillasPerm();
    });

    // Default section based on role
    if (!this.esAuxiliar) {
      // keep reactivos default
    } else {
      this.seccionActiva = 'reactivos';
    }

    // Preload the default section
    void this.activateSection(this.seccionActiva);
  }

  // ================================
  // Shared helpers
  // ================================

  private downloadBlob(blob: Blob, filename: string): void {
    const safeName = String(filename || 'documento').trim() || 'documento';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private resetMsgs(): void {
    this.tplSolicitudMsg = '';
    this.tplReactivoMsg = '';
    this.tplEquipoMsg = '';
    this.tplVolMsg = '';
    this.tplRefMsg = '';
  }

  canEditPlantillas(): boolean {
    return !this.esAuxiliar || this.plantillasCanEdit;
  }

  private async loadPlantillasPerm(): Promise<void> {
    if (!this.esAuxiliar) return;
    const u = this.user();
    const userId = Number(u?.id);
    if (!Number.isFinite(userId) || userId <= 0) return;

    this.plantillasPermLoading = true;
    try {
      const data = await usuariosService.getPermisosAuxiliares(userId);
      const perm = data?.permisos?.['plantillas'];
      this.plantillasCanEdit = perm !== false;
    } catch {
      this.plantillasCanEdit = true;
    } finally {
      this.plantillasPermLoading = false;
    }
  }

  canSeeSolicitudes(): boolean {
    const u = authUser();
    return u?.rol === 'Administrador' || u?.rol === 'Superadmin';
  }

  canSeeEquipos(): boolean {
    return !this.esAuxiliar;
  }

  canSeeVolumetricos(): boolean {
    return !this.esAuxiliar;
  }

  canSeeReferencia(): boolean {
    return !this.esAuxiliar;
  }

  // ================================
  // Navigation / section activation
  // ================================

  async activateSection(seccion: PlantillasSeccion): Promise<void> {
    this.resetMsgs();
    this.seccionActiva = seccion;

    try {
      if (seccion === 'solicitudes') {
        if (!this.canSeeSolicitudes()) return;
        await this.ensureSolicitudesDataLoaded();
        await this.cargarPlantillasSolicitud();
      }
      if (seccion === 'reactivos') {
        await this.cargarPlantillasReactivo();
      }
      if (seccion === 'equipos') {
        if (!this.canSeeEquipos()) return;
        await this.ensureEquiposLoaded();
        await this.cargarPlantillasEquipo();
      }
      if (seccion === 'volumetricos') {
        if (!this.canSeeVolumetricos()) return;
        await this.ensureVolumetricosLoaded();
        await this.cargarPlantillasVolumetrico();
      }
      if (seccion === 'referencia') {
        if (!this.canSeeReferencia()) return;
        await this.ensureReferenciaLoaded();
        await this.cargarPlantillasReferencia();
      }
    } catch (err: any) {
      this.snack.error(err?.message || 'Error cargando datos');
    }
  }

  setHelpTab(tab: HelpTab): void {
    this.helpTab = tab;
  }

  setHelpSubtabSolicitudes(tab: HelpSubtabSolicitudes): void {
    this.helpSubtabSolicitudes = tab;
  }

  setHelpSubtabEquipos(tab: HelpSubtabEquipos): void {
    this.helpSubtabEquipos = tab;
  }

  setHelpSubtabVolumetricos(tab: HelpSubtabVolumetricos): void {
    this.helpSubtabVolumetricos = tab;
  }

  setHelpSubtabReferencia(tab: HelpSubtabReferencia): void {
    this.helpSubtabReferencia = tab;
  }

  closeHelpPanel(): void {
    this.helpDetails?.nativeElement?.removeAttribute('open');
  }

  // ================================
  // Solicitudes section
  // ================================

  private async ensureSolicitudesDataLoaded(): Promise<void> {
    // Load solicitudes list
    try {
      if (!this.solicitudesService.solicitudes()?.length) {
        await this.solicitudesService.loadSolicitudes();
      }
    } catch {
      // ignore, handled by user actions
    }

    // Load clientes (selector independiente)
    try {
      if (!this.clientesService.clientes()?.length) {
        await this.clientesService.loadClientes();
      }
    } catch {
      // ignore
    }
  }

  onTplSolicitudSearchFocus(): void {
    this.showSolicitudDropdown = true;
    if (this.solicitudBlurTimer) clearTimeout(this.solicitudBlurTimer);
  }

  onTplSolicitudSearchBlur(): void {
    if (this.solicitudBlurTimer) clearTimeout(this.solicitudBlurTimer);
    this.solicitudBlurTimer = setTimeout(() => {
      this.showSolicitudDropdown = false;
    }, 150);
  }

  onTplSolicitudSearchInput(): void {
    this.showSolicitudDropdown = true;
    this.filtrarTplSolicitudResultados();
  }

  selectTplSolicitud(item: any): void {
    const rawId = item?.solicitud_id ?? item?.id_solicitud;
    const id = rawId != null ? Number(rawId) : null;
    this.tplSolicitudSeleccionadoId = id;
    this.tplSolicitudSeleccionado = item || null;
    this.tplSolicitudBusqueda = this.formatSolicitudSelectedLabel(item);
    this.tplSolicitudResultados = [];
    this.showSolicitudDropdown = false;
  }

  private formatSolicitudSelectedLabel(item: any): string {
    if (!item) return '';
    const numero = String(item?.numero ?? '').trim();
    const sid = String(item?.solicitud_id ?? item?.id_solicitud ?? '').trim();
    const solicitante = String(item?.nombre_solicitante ?? '').trim();
    const left = numero || (sid ? `Solicitud ${sid}` : 'Solicitud');
    return solicitante ? `${left} - ${solicitante}` : left;
  }

  private formatClienteSelectedLabel(item: any): string {
    if (!item) return '';
    const nombre = String(item?.nombre_solicitante ?? item?.nombre ?? item?.nombre_cliente ?? 'Cliente').trim();
    const razon = String(item?.razon_social ?? '').trim();
    return razon ? `${nombre} - ${razon}` : nombre;
  }

  filtrarTplSolicitudResultados(): void {
    const q = (this.tplSolicitudBusqueda || '').toLowerCase().trim();
    if (!q) {
      this.tplSolicitudResultados = [];
      return;
    }

    const filtro = this.tplSolicitudFiltroTipo;
    const src = this.solicitudesService.solicitudes?.() || [];
    this.tplSolicitudResultados = src.filter((s: any) => this.matchSolicitud(s, filtro, q)).slice(0, 50);
  }

  onTplClienteSearchFocus(): void {
    this.showClienteDropdown = true;
    if (this.clienteBlurTimer) clearTimeout(this.clienteBlurTimer);
  }

  onTplClienteSearchBlur(): void {
    if (this.clienteBlurTimer) clearTimeout(this.clienteBlurTimer);
    this.clienteBlurTimer = setTimeout(() => {
      this.showClienteDropdown = false;
    }, 150);
  }

  onTplClienteSearchInput(): void {
    this.showClienteDropdown = true;
    this.filtrarTplClienteResultados();
  }

  selectTplCliente(item: any): void {
    const rawId = item?.id_cliente ?? item?.cliente_id;
    const id = rawId != null ? Number(rawId) : null;
    this.tplClienteSeleccionadoId = id;
    this.tplClienteSeleccionado = item || null;
    this.tplClienteBusqueda = this.formatClienteSelectedLabel(item);
    this.tplClienteResultados = [];
    this.showClienteDropdown = false;
  }

  filtrarTplClienteResultados(): void {
    const q = (this.tplClienteBusqueda || '').toLowerCase().trim();
    if (!q) {
      this.tplClienteResultados = [];
      return;
    }

    const filtro = this.tplClienteFiltroTipo;
    const src = this.clientesService.clientes?.() || [];
    this.tplClienteResultados = src.filter((c: any) => this.matchCliente(c, filtro, q)).slice(0, 50);
  }

  private matchSolicitud(s: any, filtro: string, q: string): boolean {
    const sid = String(s?.solicitud_id ?? s?.id_solicitud ?? '').toLowerCase();
    const numero = String(s?.numero ?? '').toLowerCase();
    const solicitante = String(s?.nombre_solicitante ?? '').toLowerCase();
    const muestra = String(s?.nombre_muestra ?? '').toLowerCase();
    const analisis = String(s?.analisis_requerido ?? s?.req_analisis ?? '').toLowerCase();
    const lote = String(s?.lote_producto ?? '').toLowerCase();

    if (filtro === 'id') return sid.includes(q);
    if (filtro === 'numero_front') return numero.includes(q);
    if (filtro === 'solicitante') return solicitante.includes(q);
    if (filtro === 'muestra') return muestra.includes(q);
    if (filtro === 'analisis') return analisis.includes(q);
    if (filtro === 'lote') return lote.includes(q);

    // todos
    return [sid, numero, solicitante, muestra, analisis, lote].some((v) => v.includes(q));
  }

  private matchCliente(c: any, filtro: string, q: string): boolean {
    const id = String(c?.id_cliente ?? c?.cliente_id ?? '').toLowerCase();
    const nombre = String(c?.nombre_solicitante ?? c?.nombre ?? c?.nombre_cliente ?? '').toLowerCase();
    const razon = String(c?.razon_social ?? '').toLowerCase();
    const ident = String(c?.identificacion ?? c?.nit ?? '').toLowerCase();
    const correo = String(c?.correo ?? c?.email ?? '').toLowerCase();

    if (filtro === 'nombre') return nombre.includes(q);
    if (filtro === 'razon_social') return razon.includes(q);
    if (filtro === 'identificacion') return ident.includes(q);
    if (filtro === 'correo') return correo.includes(q);

    return [id, nombre, razon, ident, correo].some((v) => v.includes(q));
  }

  onTplSolicitudSeleccionadoIdChanged(id: number | null): void {
    if (!id) {
      this.tplSolicitudSeleccionado = null;
      return;
    }

    const src = this.solicitudesService.solicitudes?.() || [];
    const selected = src.find((x: any) => Number(x?.solicitud_id ?? x?.id_solicitud) === Number(id));
    this.tplSolicitudSeleccionado = selected || null;
    this.tplSolicitudResultados = [];
    this.showSolicitudDropdown = false;
  }

  onTplClienteSeleccionadoIdChanged(id: number | null): void {
    if (!id) {
      this.tplClienteSeleccionado = null;
      return;
    }
    const src = this.clientesService.clientes?.() || [];
    const selected = src.find((x: any) => Number(x?.id_cliente ?? x?.cliente_id) === Number(id));
    this.tplClienteSeleccionado = selected || null;
    this.tplClienteResultados = [];
    this.showClienteDropdown = false;
  }

  onTplSolicitudTemplateSelected(event: any): void {
    const f = event?.target?.files?.[0] as File | undefined;
    if (f) {
      this.tplSolicitudTemplateFile = f;
      this.tplSolicitudMsg = '';
    } else {
      this.tplSolicitudTemplateFile = null;
    }
  }

  async cargarPlantillasSolicitud(): Promise<void> {
    if (this.tplSolicitudListLoading()) return;
    this.tplSolicitudListLoading.set(true);
    this.tplSolicitudMsg = '';
    try {
      const rows = await this.solicitudesService.listarPlantillasDocumentoSolicitud();
      this.tplSolicitudPlantillas.set(Array.isArray(rows) ? rows : []);
      if (this.tplSolicitudPlantillaId != null) {
        const exists = this.tplSolicitudPlantillas().some((t) => Number(t?.id) === Number(this.tplSolicitudPlantillaId));
        if (!exists) this.tplSolicitudPlantillaId = null;
      }
    } catch (err: any) {
      this.tplSolicitudMsg = err?.message || 'Error listando plantillas';
      this.snack.error(this.tplSolicitudMsg);
    } finally {
      this.tplSolicitudListLoading.set(false);
    }
  }

  async subirPlantillaSolicitud(): Promise<void> {
    if (this.tplSolicitudUploadLoading) return;
    if (!this.tplSolicitudTemplateFile) {
      this.tplSolicitudMsg = 'Selecciona una plantilla .xlsx o .docx';
      this.snack.warn(this.tplSolicitudMsg);
      return;
    }

    this.tplSolicitudUploadLoading = true;
    this.tplSolicitudMsg = '';
    try {
      const created = await this.solicitudesService.subirPlantillaDocumentoSolicitud({
        template: this.tplSolicitudTemplateFile,
        nombre: this.tplSolicitudNombrePlantilla || undefined
      });
      await this.cargarPlantillasSolicitud();
      const id = Number(created?.id);
      if (Number.isFinite(id) && id > 0) this.tplSolicitudPlantillaId = id;
      this.tplSolicitudNombrePlantilla = '';
      this.tplSolicitudTemplateFile = null;
      try {
        const el = this.tplSolicitudTemplateInput?.nativeElement;
        if (el) el.value = '';
      } catch {}
      this.snack.success('Plantilla guardada');
    } catch (err: any) {
      this.tplSolicitudMsg = err?.message || 'Error subiendo plantilla';
      this.snack.error(this.tplSolicitudMsg);
    } finally {
      this.tplSolicitudUploadLoading = false;
    }
  }

  async eliminarPlantillaSolicitud(): Promise<void> {
    const id = this.tplSolicitudPlantillaId;
    if (!id) {
      this.tplSolicitudMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplSolicitudMsg);
      return;
    }

    if (this.tplSolicitudDeleteLoading.has(id)) return;
    this.tplSolicitudDeleteLoading.add(id);
    this.tplSolicitudMsg = '';
    try {
      await this.solicitudesService.eliminarPlantillaDocumentoSolicitud(id);
      await this.cargarPlantillasSolicitud();
      this.tplSolicitudPlantillaId = null;
      this.snack.success('Plantilla eliminada');
    } catch (err: any) {
      this.tplSolicitudMsg = err?.message || 'Error eliminando plantilla';
      this.snack.error(this.tplSolicitudMsg);
    } finally {
      this.tplSolicitudDeleteLoading.delete(id);
    }
  }

  async generarDocumentoSolicitud(): Promise<void> {
    if (this.tplSolicitudLoading) return;
    const templateId = this.tplSolicitudPlantillaId;
    if (!templateId) {
      this.tplSolicitudMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplSolicitudMsg);
      return;
    }

    let solicitud_id: number | undefined = undefined;
    let id_cliente: number | undefined = undefined;

    const solicitudRaw = this.tplSolicitudSeleccionado?.solicitud_id ?? this.tplSolicitudSeleccionado?.id_solicitud;
    const solicitudN = Number(solicitudRaw);
    if (Number.isFinite(solicitudN) && solicitudN > 0) solicitud_id = solicitudN;

    const clienteRaw = this.tplClienteSeleccionado?.id_cliente ?? this.tplClienteSeleccionado?.cliente_id;
    const clienteN = Number(clienteRaw);
    if (Number.isFinite(clienteN) && clienteN > 0) id_cliente = clienteN;

    const entidad = solicitud_id ? 'solicitud' : (id_cliente ? 'cliente' : 'solicitud');

    this.tplSolicitudLoading = true;
    this.tplSolicitudMsg = '';
    try {
      const selectedTpl = this.tplSolicitudPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'documento';

      const { blob, filename } = await this.solicitudesService.generarDocumentoDesdePlantilla({
        templateId,
        solicitud_id,
        id_cliente,
        entidad
      });

      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplSolicitudMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplSolicitudMsg);
    } finally {
      this.tplSolicitudLoading = false;
    }
  }

  async generarDocumentoSolicitudLoop(): Promise<void> {
    if (this.tplSolicitudLoading) return;
    const templateId = this.tplSolicitudPlantillaId;
    if (!templateId) {
      this.tplSolicitudMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplSolicitudMsg);
      return;
    }

    this.tplSolicitudLoading = true;
    this.tplSolicitudMsg = '';
    try {
      const selectedTpl = this.tplSolicitudPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'solicitudes';

      const { blob, filename } = await this.solicitudesService.generarDocumentoDesdePlantilla({
        templateId,
        todos: true
      });

      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplSolicitudMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplSolicitudMsg);
    } finally {
      this.tplSolicitudLoading = false;
    }
  }

  // ================================
  // Reactivos section
  // ================================

  async filtrarTplReactivoResultados(): Promise<void> {
    const q = (this.tplReactivoBusqueda || '').trim();
    if (!q || q.length < 2) {
      this.tplReactivoResultados = [];
      return;
    }

    const seq = ++this.tplReactivoSearchSeq;

    try {
      const res: any = await reactivosService.listarReactivos(q, 50, 0);
      if (seq !== this.tplReactivoSearchSeq) return;

      const rows = Array.isArray(res) ? res : (Array.isArray(res?.rows) ? res.rows : []);
      const filtro = (this.tplReactivoFiltroTipo || 'todos').toLowerCase();
      const ql = q.toLowerCase();

      const filtered = rows.filter((r: any) => {
        const codigo = String(r?.codigo ?? '').toLowerCase();
        const nombre = String(r?.nombre ?? '').toLowerCase();
        const lote = String(r?.lote ?? '').toLowerCase();
        const cas = String(r?.cas ?? '').toLowerCase();
        if (filtro === 'codigo') return codigo.includes(ql);
        if (filtro === 'nombre') return nombre.includes(ql);
        if (filtro === 'lote') return lote.includes(ql);
        if (filtro === 'cas') return cas.includes(ql);
        return [codigo, nombre, lote, cas].some((v) => v.includes(ql));
      });

      this.tplReactivoResultados = filtered.slice(0, 50);
    } catch (err: any) {
      if (seq !== this.tplReactivoSearchSeq) return;
      this.tplReactivoMsg = err?.message || 'Error buscando reactivos';
      this.snack.error(this.tplReactivoMsg);
      this.tplReactivoResultados = [];
    }
  }

  onTplReactivoSearchFocus(): void {
    this.showReactivoDropdown = true;
    if (this.reactivoBlurTimer) clearTimeout(this.reactivoBlurTimer);
  }

  onTplReactivoSearchBlur(): void {
    if (this.reactivoBlurTimer) clearTimeout(this.reactivoBlurTimer);
    this.reactivoBlurTimer = setTimeout(() => {
      this.showReactivoDropdown = false;
    }, 150);
  }

  onTplReactivoSearchInput(): void {
    this.showReactivoDropdown = true;
    void this.filtrarTplReactivoResultados();
  }

  selectTplReactivo(item: any): void {
    this.tplReactivoSeleccionado = item || null;
    const lote = item?.lote != null ? String(item.lote) : null;
    this.tplReactivoSeleccionadoLote = lote;
    const codigo = String(item?.codigo ?? '').trim();
    const nombre = String(item?.nombre ?? '').trim();
    const label = [codigo, nombre].filter(Boolean).join(' - ');
    this.tplReactivoBusqueda = lote ? `${label} (${lote})` : label;
    this.tplReactivoResultados = [];
    this.showReactivoDropdown = false;
  }

  onTplReactivoSeleccionadoChanged(lote: string | null): void {
    if (!lote) {
      this.tplReactivoSeleccionado = null;
      return;
    }
    const sel = this.tplReactivoResultados.find((r: any) => String(r?.lote) === String(lote));
    this.tplReactivoSeleccionado = sel || null;
  }

  onTplReactivoTemplateSelected(event: any): void {
    const f = event?.target?.files?.[0] as File | undefined;
    if (f) {
      this.tplReactivoTemplateFile = f;
      this.tplReactivoMsg = '';
    } else {
      this.tplReactivoTemplateFile = null;
    }
  }

  async cargarPlantillasReactivo(): Promise<void> {
    if (this.tplReactivoListLoading()) return;
    this.tplReactivoListLoading.set(true);
    this.tplReactivoMsg = '';
    try {
      const rows = await reactivosService.listarPlantillasDocumentoReactivo();
      this.tplReactivoPlantillas.set(Array.isArray(rows) ? rows : []);
      if (this.tplReactivoPlantillaId != null) {
        const exists = this.tplReactivoPlantillas().some((t) => Number(t?.id) === Number(this.tplReactivoPlantillaId));
        if (!exists) this.tplReactivoPlantillaId = null;
      }
    } catch (err: any) {
      this.tplReactivoMsg = err?.message || 'Error listando plantillas';
      this.snack.error(this.tplReactivoMsg);
    } finally {
      this.tplReactivoListLoading.set(false);
    }
  }

  async subirPlantillaReactivo(): Promise<void> {
    if (this.tplReactivoUploadLoading) return;
    if (!this.tplReactivoTemplateFile) {
      this.tplReactivoMsg = 'Selecciona una plantilla .xlsx o .docx';
      this.snack.warn(this.tplReactivoMsg);
      return;
    }

    this.tplReactivoUploadLoading = true;
    this.tplReactivoMsg = '';
    try {
      const created = await reactivosService.subirPlantillaDocumentoReactivo({
        template: this.tplReactivoTemplateFile,
        nombre: this.tplReactivoNombrePlantilla || undefined
      });
      await this.cargarPlantillasReactivo();
      const id = Number(created?.id);
      if (Number.isFinite(id) && id > 0) this.tplReactivoPlantillaId = id;
      this.tplReactivoNombrePlantilla = '';
      this.tplReactivoTemplateFile = null;
      try {
        const el = this.tplReactivoTemplateInput?.nativeElement;
        if (el) el.value = '';
      } catch {}
      this.snack.success('Plantilla guardada');
    } catch (err: any) {
      this.tplReactivoMsg = err?.message || 'Error subiendo plantilla';
      this.snack.error(this.tplReactivoMsg);
    } finally {
      this.tplReactivoUploadLoading = false;
    }
  }

  async eliminarPlantillaReactivo(): Promise<void> {
    const id = this.tplReactivoPlantillaId;
    if (!id) {
      this.tplReactivoMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplReactivoMsg);
      return;
    }

    if (this.tplReactivoDeleteLoading.has(id)) return;
    this.tplReactivoDeleteLoading.add(id);
    this.tplReactivoMsg = '';
    try {
      await reactivosService.eliminarPlantillaDocumentoReactivo(id);
      await this.cargarPlantillasReactivo();
      this.tplReactivoPlantillaId = null;
      this.snack.success('Plantilla eliminada');
    } catch (err: any) {
      this.tplReactivoMsg = err?.message || 'Error eliminando plantilla';
      this.snack.error(this.tplReactivoMsg);
    } finally {
      this.tplReactivoDeleteLoading.delete(id);
    }
  }

  async generarDocumentoReactivo(): Promise<void> {
    if (this.tplReactivoLoading) return;
    const templateId = this.tplReactivoPlantillaId;
    if (!templateId) {
      this.tplReactivoMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplReactivoMsg);
      return;
    }

    if (!this.tplReactivoSeleccionado) {
      this.tplReactivoMsg = 'Seleccione un reactivo de la lista';
      this.snack.warn(this.tplReactivoMsg);
      return;
    }

    const codigo = String(this.tplReactivoSeleccionado?.codigo ?? '').trim();
    const lote = String(this.tplReactivoSeleccionado?.lote ?? '').trim();

    if (!codigo && !lote) {
      this.tplReactivoMsg = 'Seleccione un reactivo válido';
      this.snack.warn(this.tplReactivoMsg);
      return;
    }

    this.tplReactivoLoading = true;
    this.tplReactivoMsg = '';
    try {
      const selectedTpl = this.tplReactivoPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'documento_reactivo';

      const { blob, filename } = await reactivosService.generarDocumentoReactivoDesdePlantilla({
        templateId,
        codigo: codigo || undefined,
        lote: lote || undefined
      });

      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplReactivoMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplReactivoMsg);
    } finally {
      this.tplReactivoLoading = false;
    }
  }

  async generarDocumentoReactivoLoop(): Promise<void> {
    if (this.tplReactivoLoading) return;
    const templateId = this.tplReactivoPlantillaId;
    if (!templateId) {
      this.tplReactivoMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplReactivoMsg);
      return;
    }

    this.tplReactivoLoading = true;
    this.tplReactivoMsg = '';
    try {
      const selectedTpl = this.tplReactivoPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'reactivos';

      if (selectedTpl?.nombre_archivo && !/\.xlsx$/i.test(String(selectedTpl.nombre_archivo))) {
        this.snack.warn('La plantilla no es .xlsx; se generará en su formato original');
      }

      const { blob, filename } = await reactivosService.generarDocumentoReactivoDesdePlantilla({
        templateId,
        todos: true
      });

      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplReactivoMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplReactivoMsg);
    } finally {
      this.tplReactivoLoading = false;
    }
  }

  // ================================
  // Equipos section
  // ================================

  private async ensureEquiposLoaded(): Promise<void> {
    if (this.equiposAll.length) return;
    try {
      this.equiposAll = await equiposService.listarEquipos();
    } catch (err: any) {
      this.equiposAll = [];
      throw err;
    }
  }

  filtrarTplEquipoResultados(): void {
    const q = (this.tplEquipoBusqueda || '').toLowerCase().trim();
    if (!q) {
      this.tplEquipoResultados = [];
      return;
    }

    const filtro = (this.tplEquipoFiltroTipo || 'todos').toLowerCase();
    const filtered = this.equiposAll.filter((e: any) => {
      const codigo = String(e?.codigo_identificacion ?? '').toLowerCase();
      const nombre = String(e?.nombre ?? '').toLowerCase();
      const marca = String(e?.marca ?? '').toLowerCase();
      const modelo = String(e?.modelo ?? '').toLowerCase();

      if (filtro === 'codigo') return codigo.includes(q);
      if (filtro === 'nombre') return nombre.includes(q);
      if (filtro === 'marca') return marca.includes(q);
      if (filtro === 'modelo') return modelo.includes(q);
      return [codigo, nombre, marca, modelo].some((v) => v.includes(q));
    });

    this.tplEquipoResultados = filtered.slice(0, 50);
  }

  onTplEquipoSearchFocus(): void {
    this.showEquipoDropdown = true;
    if (this.equipoBlurTimer) clearTimeout(this.equipoBlurTimer);
  }

  onTplEquipoSearchBlur(): void {
    if (this.equipoBlurTimer) clearTimeout(this.equipoBlurTimer);
    this.equipoBlurTimer = setTimeout(() => {
      this.showEquipoDropdown = false;
    }, 150);
  }

  onTplEquipoSearchInput(): void {
    this.showEquipoDropdown = true;
    this.filtrarTplEquipoResultados();
  }

  selectTplEquipo(item: any): void {
    this.tplEquipoSeleccionado = item || null;
    const codigo = item?.codigo_identificacion != null ? String(item.codigo_identificacion) : null;
    this.tplEquipoSeleccionadoCodigo = codigo;
    const nombre = String(item?.nombre ?? '').trim();
    this.tplEquipoBusqueda = [codigo, nombre].filter(Boolean).join(' - ');
    this.tplEquipoResultados = [];
    this.showEquipoDropdown = false;
  }

  onTplEquipoSeleccionadoChanged(codigo: string | null): void {
    if (!codigo) {
      this.tplEquipoSeleccionado = null;
      return;
    }
    const sel = this.tplEquipoResultados.find((e: any) => String(e?.codigo_identificacion) === String(codigo));
    this.tplEquipoSeleccionado = sel || null;
  }

  onTplEquipoTemplateSelected(event: any): void {
    const f = event?.target?.files?.[0] as File | undefined;
    if (f) {
      this.tplEquipoTemplateFile = f;
      this.tplEquipoMsg = '';
    } else {
      this.tplEquipoTemplateFile = null;
    }
  }

  async cargarPlantillasEquipo(): Promise<void> {
    if (this.tplEquipoListLoading()) return;
    this.tplEquipoListLoading.set(true);
    this.tplEquipoMsg = '';
    try {
      const rows = await equiposService.listarPlantillasDocumentoEquipo();
      this.tplEquipoPlantillas.set(Array.isArray(rows) ? rows : []);
      if (this.tplEquipoPlantillaId != null) {
        const exists = this.tplEquipoPlantillas().some((t) => Number(t?.id) === Number(this.tplEquipoPlantillaId));
        if (!exists) this.tplEquipoPlantillaId = null;
      }
    } catch (err: any) {
      this.tplEquipoMsg = err?.message || 'Error listando plantillas';
      this.snack.error(this.tplEquipoMsg);
    } finally {
      this.tplEquipoListLoading.set(false);
    }
  }

  async subirPlantillaEquipo(): Promise<void> {
    if (this.tplEquipoUploadLoading) return;
    if (!this.tplEquipoTemplateFile) {
      this.tplEquipoMsg = 'Selecciona una plantilla .xlsx o .docx';
      this.snack.warn(this.tplEquipoMsg);
      return;
    }

    this.tplEquipoUploadLoading = true;
    this.tplEquipoMsg = '';
    try {
      const created = await equiposService.subirPlantillaDocumentoEquipo({
        template: this.tplEquipoTemplateFile,
        nombre: this.tplEquipoNombrePlantilla || undefined
      });
      await this.cargarPlantillasEquipo();
      const id = Number(created?.id);
      if (Number.isFinite(id) && id > 0) this.tplEquipoPlantillaId = id;
      this.tplEquipoNombrePlantilla = '';
      this.tplEquipoTemplateFile = null;
      try {
        const el = this.tplEquipoTemplateInput?.nativeElement;
        if (el) el.value = '';
      } catch {}
      this.snack.success('Plantilla guardada');
    } catch (err: any) {
      this.tplEquipoMsg = err?.message || 'Error subiendo plantilla';
      this.snack.error(this.tplEquipoMsg);
    } finally {
      this.tplEquipoUploadLoading = false;
    }
  }

  async eliminarPlantillaEquipo(): Promise<void> {
    const id = this.tplEquipoPlantillaId;
    if (!id) {
      this.tplEquipoMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplEquipoMsg);
      return;
    }

    if (this.tplEquipoDeleteLoading.has(id)) return;
    this.tplEquipoDeleteLoading.add(id);
    this.tplEquipoMsg = '';
    try {
      await equiposService.eliminarPlantillaDocumentoEquipo(id);
      await this.cargarPlantillasEquipo();
      this.tplEquipoPlantillaId = null;
      this.snack.success('Plantilla eliminada');
    } catch (err: any) {
      this.tplEquipoMsg = err?.message || 'Error eliminando plantilla';
      this.snack.error(this.tplEquipoMsg);
    } finally {
      this.tplEquipoDeleteLoading.delete(id);
    }
  }

  async generarDocumentoEquipo(): Promise<void> {
    if (this.tplEquipoLoading) return;
    const templateId = this.tplEquipoPlantillaId;
    if (!templateId) {
      this.tplEquipoMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplEquipoMsg);
      return;
    }

    const codigo = String(this.tplEquipoSeleccionado?.codigo_identificacion ?? '').trim();
    if (!codigo) {
      this.tplEquipoMsg = 'Debe seleccionar un equipo';
      this.snack.warn(this.tplEquipoMsg);
      return;
    }

    this.tplEquipoLoading = true;
    this.tplEquipoMsg = '';
    try {
      const selectedTpl = this.tplEquipoPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'documento_equipo';

      const { blob, filename } = await equiposService.generarDocumentoEquipoDesdePlantilla({ id: templateId, codigo });
      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplEquipoMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplEquipoMsg);
    } finally {
      this.tplEquipoLoading = false;
    }
  }

  async generarDocumentoEquipoLoop(): Promise<void> {
    if (this.tplEquipoLoading) return;
    const templateId = this.tplEquipoPlantillaId;
    if (!templateId) {
      this.tplEquipoMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplEquipoMsg);
      return;
    }

    this.tplEquipoLoading = true;
    this.tplEquipoMsg = '';
    try {
      const selectedTpl = this.tplEquipoPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'equipos';

      const { blob, filename } = await equiposService.generarDocumentoEquipoDesdePlantilla({
        id: templateId,
        todos: true
      });

      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplEquipoMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplEquipoMsg);
    } finally {
      this.tplEquipoLoading = false;
    }
  }

  // ================================
  // Volumétricos section
  // ================================

  private async ensureVolumetricosLoaded(): Promise<void> {
    if (this.volAll.length) return;
    this.volAll = await this.volumetricosService.listarMateriales();
  }

  filtrarTplVolResultados(): void {
    const q = (this.tplVolBusqueda || '').toLowerCase().trim();
    if (!q) {
      this.tplVolResultados = [];
      return;
    }

    const filtro = (this.tplVolFiltroTipo || 'todos').toLowerCase();
    const filtered = this.volAll.filter((m: any) => {
      const codigo = String(m?.codigo_id ?? '').toLowerCase();
      const nombre = String(m?.nombre_material ?? '').toLowerCase();
      const marca = String(m?.marca ?? '').toLowerCase();
      const modelo = String(m?.modelo ?? '').toLowerCase();

      if (filtro === 'codigo') return codigo.includes(q);
      if (filtro === 'nombre') return nombre.includes(q);
      if (filtro === 'marca') return marca.includes(q);
      if (filtro === 'modelo') return modelo.includes(q);
      return [codigo, nombre, marca, modelo].some((v) => v.includes(q));
    });

    this.tplVolResultados = filtered.slice(0, 50);
  }

  onTplVolSearchFocus(): void {
    this.showVolDropdown = true;
    if (this.volBlurTimer) clearTimeout(this.volBlurTimer);
  }

  onTplVolSearchBlur(): void {
    if (this.volBlurTimer) clearTimeout(this.volBlurTimer);
    this.volBlurTimer = setTimeout(() => {
      this.showVolDropdown = false;
    }, 150);
  }

  onTplVolSearchInput(): void {
    this.showVolDropdown = true;
    this.filtrarTplVolResultados();
  }

  selectTplVol(item: any): void {
    this.tplVolSeleccionado = item || null;
    const codigo = item?.codigo_id != null ? Number(item.codigo_id) : null;
    this.tplVolSeleccionadoCodigo = codigo;
    const nombre = String(item?.nombre_material ?? '').trim();
    this.tplVolBusqueda = [codigo != null ? String(codigo) : '', nombre].filter(Boolean).join(' - ');
    this.tplVolResultados = [];
    this.showVolDropdown = false;
  }

  onTplVolSeleccionadoChanged(codigo: number | null): void {
    if (!codigo) {
      this.tplVolSeleccionado = null;
      return;
    }
    const sel = this.tplVolResultados.find((m: any) => Number(m?.codigo_id) === Number(codigo));
    this.tplVolSeleccionado = sel || null;
  }

  onTplVolTemplateSelected(event: any): void {
    const f = event?.target?.files?.[0] as File | undefined;
    if (f) {
      this.tplVolTemplateFile = f;
      this.tplVolMsg = '';
    } else {
      this.tplVolTemplateFile = null;
    }
  }

  async cargarPlantillasVolumetrico(): Promise<void> {
    if (this.tplVolListLoading()) return;
    this.tplVolListLoading.set(true);
    this.tplVolMsg = '';
    try {
      const rows = await this.volumetricosService.listarPlantillasDocumentoVolumetrico();
      this.tplVolPlantillas.set(Array.isArray(rows) ? rows : []);
      if (this.tplVolPlantillaId != null) {
        const exists = this.tplVolPlantillas().some((t) => Number(t?.id) === Number(this.tplVolPlantillaId));
        if (!exists) this.tplVolPlantillaId = null;
      }
    } catch (err: any) {
      this.tplVolMsg = err?.message || 'Error listando plantillas';
      this.snack.error(this.tplVolMsg);
    } finally {
      this.tplVolListLoading.set(false);
    }
  }

  async subirPlantillaVolumetrico(): Promise<void> {
    if (this.tplVolUploadLoading) return;
    if (!this.tplVolTemplateFile) {
      this.tplVolMsg = 'Selecciona una plantilla .xlsx o .docx';
      this.snack.warn(this.tplVolMsg);
      return;
    }

    this.tplVolUploadLoading = true;
    this.tplVolMsg = '';
    try {
      const created = await this.volumetricosService.subirPlantillaDocumentoVolumetrico({
        template: this.tplVolTemplateFile,
        nombre: this.tplVolNombrePlantilla || undefined
      });
      await this.cargarPlantillasVolumetrico();
      const id = Number(created?.id);
      if (Number.isFinite(id) && id > 0) this.tplVolPlantillaId = id;
      this.tplVolNombrePlantilla = '';
      this.tplVolTemplateFile = null;
      try {
        const el = this.tplVolTemplateInput?.nativeElement;
        if (el) el.value = '';
      } catch {}
      this.snack.success('Plantilla guardada');
    } catch (err: any) {
      this.tplVolMsg = err?.message || 'Error subiendo plantilla';
      this.snack.error(this.tplVolMsg);
    } finally {
      this.tplVolUploadLoading = false;
    }
  }

  async eliminarPlantillaVolumetrico(): Promise<void> {
    const id = this.tplVolPlantillaId;
    if (!id) {
      this.tplVolMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplVolMsg);
      return;
    }

    if (this.tplVolDeleteLoading.has(id)) return;
    this.tplVolDeleteLoading.add(id);
    this.tplVolMsg = '';
    try {
      await this.volumetricosService.eliminarPlantillaDocumentoVolumetrico(id);
      await this.cargarPlantillasVolumetrico();
      this.tplVolPlantillaId = null;
      this.snack.success('Plantilla eliminada');
    } catch (err: any) {
      this.tplVolMsg = err?.message || 'Error eliminando plantilla';
      this.snack.error(this.tplVolMsg);
    } finally {
      this.tplVolDeleteLoading.delete(id);
    }
  }

  async generarDocumentoVolumetrico(): Promise<void> {
    if (this.tplVolLoading) return;
    const templateId = this.tplVolPlantillaId;
    if (!templateId) {
      this.tplVolMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplVolMsg);
      return;
    }

    const codigo = Number(this.tplVolSeleccionado?.codigo_id);
    if (!Number.isFinite(codigo) || codigo <= 0) {
      this.tplVolMsg = 'Debe seleccionar un material';
      this.snack.warn(this.tplVolMsg);
      return;
    }

    this.tplVolLoading = true;
    this.tplVolMsg = '';
    try {
      const selectedTpl = this.tplVolPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'documento_volumetrico';

      const { blob, filename } = await this.volumetricosService.generarDocumentoVolumetricoDesdePlantilla({ id: templateId, codigo });
      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplVolMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplVolMsg);
    } finally {
      this.tplVolLoading = false;
    }
  }

  async generarDocumentoVolumetricoLoop(): Promise<void> {
    if (this.tplVolLoading) return;
    const templateId = this.tplVolPlantillaId;
    if (!templateId) {
      this.tplVolMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplVolMsg);
      return;
    }

    this.tplVolLoading = true;
    this.tplVolMsg = '';
    try {
      const selectedTpl = this.tplVolPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'volumetricos';

      const { blob, filename } = await this.volumetricosService.generarDocumentoVolumetricoDesdePlantilla({
        id: templateId,
        todos: true
      });

      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplVolMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplVolMsg);
    } finally {
      this.tplVolLoading = false;
    }
  }

  // ================================
  // Referencia section
  // ================================

  private async ensureReferenciaLoaded(): Promise<void> {
    if (this.refAll.length) return;
    this.refAll = await this.referenciaService.listarMateriales();
  }

  filtrarTplRefResultados(): void {
    const q = (this.tplRefBusqueda || '').toLowerCase().trim();
    if (!q) {
      this.tplRefResultados = [];
      return;
    }

    const filtro = (this.tplRefFiltroTipo || 'todos').toLowerCase();
    const filtered = this.refAll.filter((m: any) => {
      const codigo = String(m?.codigo_id ?? '').toLowerCase();
      const nombre = String(m?.nombre_material ?? '').toLowerCase();
      const marca = String(m?.marca ?? '').toLowerCase();
      const serie = String(m?.serie ?? '').toLowerCase();

      if (filtro === 'codigo') return codigo.includes(q);
      if (filtro === 'nombre') return nombre.includes(q);
      if (filtro === 'marca') return marca.includes(q);
      if (filtro === 'serie') return serie.includes(q);
      return [codigo, nombre, marca, serie].some((v) => v.includes(q));
    });

    this.tplRefResultados = filtered.slice(0, 50);
  }

  onTplRefSearchFocus(): void {
    this.showRefDropdown = true;
    if (this.refBlurTimer) clearTimeout(this.refBlurTimer);
  }

  onTplRefSearchBlur(): void {
    if (this.refBlurTimer) clearTimeout(this.refBlurTimer);
    this.refBlurTimer = setTimeout(() => {
      this.showRefDropdown = false;
    }, 150);
  }

  onTplRefSearchInput(): void {
    this.showRefDropdown = true;
    this.filtrarTplRefResultados();
  }

  selectTplRef(item: any): void {
    this.tplRefSeleccionado = item || null;
    const codigo = item?.codigo_id != null ? Number(item.codigo_id) : null;
    this.tplRefSeleccionadoCodigo = codigo;
    const nombre = String(item?.nombre_material ?? '').trim();
    this.tplRefBusqueda = [codigo != null ? String(codigo) : '', nombre].filter(Boolean).join(' - ');
    this.tplRefResultados = [];
    this.showRefDropdown = false;
  }

  onTplRefSeleccionadoChanged(codigo: number | null): void {
    if (!codigo) {
      this.tplRefSeleccionado = null;
      return;
    }
    const sel = this.tplRefResultados.find((m: any) => Number(m?.codigo_id) === Number(codigo));
    this.tplRefSeleccionado = sel || null;
  }

  onTplRefTemplateSelected(event: any): void {
    const f = event?.target?.files?.[0] as File | undefined;
    if (f) {
      this.tplRefTemplateFile = f;
      this.tplRefMsg = '';
    } else {
      this.tplRefTemplateFile = null;
    }
  }

  async cargarPlantillasReferencia(): Promise<void> {
    if (this.tplRefListLoading()) return;
    this.tplRefListLoading.set(true);
    this.tplRefMsg = '';
    try {
      const rows = await this.referenciaService.listarPlantillasDocumentoReferencia();
      this.tplRefPlantillas.set(Array.isArray(rows) ? rows : []);
      if (this.tplRefPlantillaId != null) {
        const exists = this.tplRefPlantillas().some((t) => Number(t?.id) === Number(this.tplRefPlantillaId));
        if (!exists) this.tplRefPlantillaId = null;
      }
    } catch (err: any) {
      this.tplRefMsg = err?.message || 'Error listando plantillas';
      this.snack.error(this.tplRefMsg);
    } finally {
      this.tplRefListLoading.set(false);
    }
  }

  async subirPlantillaReferencia(): Promise<void> {
    if (this.tplRefUploadLoading) return;
    if (!this.tplRefTemplateFile) {
      this.tplRefMsg = 'Selecciona una plantilla .xlsx o .docx';
      this.snack.warn(this.tplRefMsg);
      return;
    }

    this.tplRefUploadLoading = true;
    this.tplRefMsg = '';
    try {
      const created = await this.referenciaService.subirPlantillaDocumentoReferencia({
        template: this.tplRefTemplateFile,
        nombre: this.tplRefNombrePlantilla || undefined
      });
      await this.cargarPlantillasReferencia();
      const id = Number((created as any)?.id);
      if (Number.isFinite(id) && id > 0) this.tplRefPlantillaId = id;
      this.tplRefNombrePlantilla = '';
      this.tplRefTemplateFile = null;
      try {
        const el = this.tplRefTemplateInput?.nativeElement;
        if (el) el.value = '';
      } catch {}
      this.snack.success('Plantilla guardada');
    } catch (err: any) {
      this.tplRefMsg = err?.message || 'Error subiendo plantilla';
      this.snack.error(this.tplRefMsg);
    } finally {
      this.tplRefUploadLoading = false;
    }
  }

  async eliminarPlantillaReferencia(): Promise<void> {
    const id = this.tplRefPlantillaId;
    if (!id) {
      this.tplRefMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplRefMsg);
      return;
    }

    if (this.tplRefDeleteLoading.has(id)) return;
    this.tplRefDeleteLoading.add(id);
    this.tplRefMsg = '';
    try {
      await this.referenciaService.eliminarPlantillaDocumentoReferencia(id);
      await this.cargarPlantillasReferencia();
      this.tplRefPlantillaId = null;
      this.snack.success('Plantilla eliminada');
    } catch (err: any) {
      this.tplRefMsg = err?.message || 'Error eliminando plantilla';
      this.snack.error(this.tplRefMsg);
    } finally {
      this.tplRefDeleteLoading.delete(id);
    }
  }

  async generarDocumentoReferencia(): Promise<void> {
    if (this.tplRefLoading) return;
    const templateId = this.tplRefPlantillaId;
    if (!templateId) {
      this.tplRefMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplRefMsg);
      return;
    }

    const codigo = Number(this.tplRefSeleccionado?.codigo_id);
    if (!Number.isFinite(codigo) || codigo <= 0) {
      this.tplRefMsg = 'Debe seleccionar un material';
      this.snack.warn(this.tplRefMsg);
      return;
    }

    this.tplRefLoading = true;
    this.tplRefMsg = '';
    try {
      const selectedTpl = this.tplRefPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'documento_referencia';

      const { blob, filename } = await this.referenciaService.generarDocumentoReferenciaDesdePlantilla({ id: templateId, codigo });
      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplRefMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplRefMsg);
    } finally {
      this.tplRefLoading = false;
    }
  }

  async generarDocumentoReferenciaLoop(): Promise<void> {
    if (this.tplRefLoading) return;
    const templateId = this.tplRefPlantillaId;
    if (!templateId) {
      this.tplRefMsg = 'Seleccione una plantilla';
      this.snack.warn(this.tplRefMsg);
      return;
    }

    this.tplRefLoading = true;
    this.tplRefMsg = '';
    try {
      const selectedTpl = this.tplRefPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selectedTpl?.nombre_archivo || selectedTpl?.nombre || 'referencias';

      const { blob, filename } = await this.referenciaService.generarDocumentoReferenciaDesdePlantilla({
        id: templateId,
        todos: true
      });

      this.downloadBlob(blob, filename || fallbackName);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.tplRefMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.tplRefMsg);
    } finally {
      this.tplRefLoading = false;
    }
  }
}

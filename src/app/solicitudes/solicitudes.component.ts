import { Component, signal, effect, EffectRef, OnDestroy, OnInit, ViewEncapsulation, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientesService } from '../services/clientes/clientes.service';
import { SolicitudesService } from '../services/clientes/solicitudes.service';
import { LocationsService } from '../services/clientes/locations.service';
import { UtilsService } from '../services/clientes/utils.service';
import { SnackbarService } from '../shared/snackbar.service';
import { authService, authUser } from '../services/auth.service';
import { logsService } from '../services/logs.service';
import { usuariosService } from '../services/usuarios.service';
import { NumbersOnlyDirective } from '../directives/numbers-only.directive';
import { LettersOnlyDirective } from '../directives/letters-only.directive';
import { AlphaNumericDirective } from '../directives/alpha-numeric.directive';
import { AlphaNumericSpacesDirective } from '../directives/alpha-numeric-spaces.directive';
import { ConfirmService } from '../shared/confirm.service';

interface EstadoLike {
  id_estado?: any;
  nombre_estado?: any;
  nombre?: any;
}

interface UsuarioLike {
  id_usuario?: any;
  email?: any;
  rol_nombre?: any;
  rol?: any;
  activo?: any;
}

interface ClienteLike {
  id_cliente?: any;
  cliente_id?: any;
  id?: any;
  activo?: any;
  estado?: any;
  nombre_solicitante?: any;
  correo_electronico?: any;
  celular?: any;
  telefono?: any;
  direccion?: any;
  id_departamento?: any;
  departamento_codigo?: any;
  id_ciudad?: any;
  ciudad_codigo?: any;
  razon_social?: any;
  nit?: any;
  tipo_usuario?: any;
  tipo_identificacion?: any;
  numero_identificacion?: any;
  sexo?: any;
  tipo_poblacion?: any;
  fecha_vinculacion?: any;
  tipo_vinculacion?: any;
  registro_realizado_por?: any;
  observaciones?: any;
  numero_cliente_front?: any;
  [key: string]: any;
}

interface SolicitudLike {
  solicitud_id?: any;
  id_solicitud?: any;
  id?: any;
  id_cliente?: any;
  id_estado?: any;
  nombre_estado?: any;
  id_admin?: any;
  admin_email?: any;
  numero_solicitud_front?: any;
  tipo_solicitud?: any;
  id_tipo_af?: any;
  fecha_solicitud?: any;
  nombre_solicitante?: any;
  nombre_muestra?: any;
  analisis_requerido?: any;
  lote_producto?: any;
  fecha_vencimiento_muestra?: any;
  tipo_muestra?: any;
  tipo_empaque?: any;
  req_analisis?: any;
  cant_muestras?: any;
  fecha_estimada_entrega?: any;
  puede_suministrar?: any;
  servicio_es_viable?: any;
  solicitud_recibida_por?: any;
  recibe_muestra_personal?: any;
  cargo_personal?: any;
  observaciones?: any;
  genero_cotizacion?: any;
  valor_cotizacion?: any;
  fecha_envio_oferta?: any;
  realizo_seguimiento_oferta?: any;
  observacion_oferta?: any;
  fecha_limite_entrega?: any;
  tipo_muestra_especificado?: any;
  ensayos_requeridos_claros?: any;
  equipos_calibrados?: any;
  personal_competente?: any;
  infraestructura_adecuada?: any;
  insumos_vigentes?: any;
  cumple_tiempos_entrega?: any;
  normas_metodos_especificados?: any;
  metodo_validado_verificado?: any;
  metodo_adecuado?: any;
  observaciones_tecnicas?: any;
  concepto_final?: any;
  fecha_encuesta?: any;
  fecha_realizacion_encuesta?: any;
  comentarios?: any;
  recomendaria_servicio?: any;
  cliente_respondio?: any;
  solicito_nueva_encuesta?: any;
  [key: string]: any;
}

@Component({
  standalone: true,
  selector: 'app-solicitudes',
  imports: [CommonModule, FormsModule, RouterModule, NumbersOnlyDirective, LettersOnlyDirective, AlphaNumericDirective, AlphaNumericSpacesDirective],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SolicitudesComponent implements OnInit, OnDestroy {
  // Inyectar servicios
  private clientesService = inject(ClientesService);
  private solicitudesService = inject(SolicitudesService);
  private locationsService = inject(LocationsService);
  private utilsService = inject(UtilsService);
  private snackbarService = inject(SnackbarService);
  private confirm = inject(ConfirmService);

  // Signals desde servicios
  clientes = this.clientesService.clientes;
  solicitudes = this.solicitudesService.solicitudes;
  departamentos = this.locationsService.departamentos;
  ciudades = this.locationsService.ciudades;
  readonly user = authUser;

  // Signals locales
  clientesFiltrados = signal<ClienteLike[]>([]);
  solicitudesFiltradas = signal<SolicitudLike[]>([]);
  // Selected items as signals for reactive templates and auto-fill
  selectedCliente = signal<ClienteLike | null>(null);
  selectedSolicitud = signal<SolicitudLike | null>(null);

  // Variables de estado para errores de validación
  clienteErrors: Record<string, string> = {};
  solicitudErrors: Record<string, string> = {};
  ofertaErrors: Record<string, string> = {};
  resultadoErrors: Record<string, string> = {};
  encuestaErrors: Record<string, string> = {};

  @ViewChild('tplSolicitudDocTemplateInput') private tplSolicitudDocTemplateInput?: ElementRef<HTMLInputElement>;

  clientesDocumentos: ClienteLike[] = [];

  solicitudesDocumentos: SolicitudLike[] = [];

  tplSolicitudDocFiltroTipo = 'todos';
  tplSolicitudDocBusqueda = '';
  tplSolicitudDocResultados: (ClienteLike | SolicitudLike)[] = [];
  tplSolicitudDocSeleccionado: ClienteLike | SolicitudLike | null = null;
  tplSolicitudDocPlantillas = signal<any[]>([]);
  tplSolicitudDocPlantillaId: number | null = null;
  tplSolicitudDocNombrePlantilla = '';
  tplSolicitudDocTemplateFile: File | null = null;
  tplSolicitudDocMsg = '';
  tplSolicitudDocLoading = false;
  tplSolicitudDocListLoading = signal(false);
  tplSolicitudDocUploadLoading = false;
  tplSolicitudDocDeleteLoading: Set<number> = new Set<number>();
  tplSolicitudDocEntidad: 'solicitud' | 'cliente' = 'solicitud';
  tplSolicitudDocGenerarTodos = false;

  opcionesFiltroSolicitudesTplDocs = [
    { valor: 'todos', texto: 'Todos los campos' },
    { valor: 'id', texto: 'ID' },
    { valor: 'numero_front', texto: 'Consecutivo' },
    { valor: 'solicitante', texto: 'Solicitante' },
    { valor: 'muestra', texto: 'Muestra' },
    { valor: 'analisis', texto: 'Análisis' },
    { valor: 'lote', texto: 'Lote' }
  ];

  opcionesFiltroClientesTplDocs = [
    { valor: 'todos', texto: 'Todos los campos' },
    { valor: 'nombre', texto: 'Nombre' },
    { valor: 'razon_social', texto: 'Razón social' },
    { valor: 'identificacion', texto: 'Identificación' },
    { valor: 'correo', texto: 'Correo' },
    { valor: 'numero', texto: 'Consecutivo' }
  ];

  // Variables de formulario
  clienteNombre = '';
  clienteIdNum = '';
  clienteEmail = '';
  clienteNumero: number | null = null;
  clienteFechaVinc = '';
  clienteTipoUsuario = '';
  clienteRazonSocial = '';
  clienteNit = '';
  clienteTipoId = '';
  clienteSexo = '';
  clienteTipoPobl = '';
  clienteTipoPoblCustomOptions: string[] = [];
  showTipoPoblModal = false;
  modalTipoPoblText = '';
  clienteDireccion = '';
  clienteIdCiudad = '';
  clienteIdDepartamento = '';
  clienteCelular = '';
  clienteTelefono = '';
  clienteTipoVinc = '';
  clienteRegistroPor = '';
  clienteObservaciones = '';
  clientesQ = '';
  descargandoClientesExcel = false;
  descargandoClientesSolicitudesExcel = false;
  descargandoSolicitudesExcel = false;
  solicitudesQ = '';
  solicitudesFiltroViabilidad: 'todos' | 'viable' | 'viable_observaciones' | 'no_viable' = 'todos';
  solicitudesFiltroEstado: 'todos' | 'espera' | 'evaluacion' | 'evaluada' = 'todos';

  solicitudClienteId: number | '' = '';
  solicitudNombre = '';
  solicitudTipo = '';
  solicitudTipoAfId: number | null = null;
  solicitudLote = '';
  solicitudFechaVenc = '';
  solicitudFechaSolicitud = '';
  solicitudNumeroFrontPreview = '';
  solicitudTipoMuestra = '';
  solicitudCondEmpaque = '';
  solicitudTipoEmpaqueCustomOptions: string[] = [];
  showTipoEmpaqueModal = false;
  modalTipoEmpaqueText = '';
  solicitudTipoAnalisis = '';
  solicitudTipoAnalisisCustomOptions: string[] = [];
  showTipoAnalisisModal = false;
  modalTipoAnalisisText = '';
  solicitudRequiereVarios: boolean | null = null;
  solicitudCantidad: number | null = null;
  solicitudFechaEstimada = '';
  solicitudPuedeSuministrar: boolean | '' = '';
  solicitudServicioViable = false;
  solicitudRecibida = '';
  solicitudRecibePersonal = '';
  solicitudCargoPersonal = '';
  solicitudObservaciones = '';
  solicitudConsecutivo: number | null = null;
  solicitudAdminId: number | null = null;

  estadosSolicitud: EstadoLike[] = [];
  adminUsuarios: UsuarioLike[] = [];
  adminUsuariosLoading = false;

  ofertaSolicitudId: number | null = null;
  ofertaGeneroCotizacion: boolean | null = null;
  ofertaValor: number | null = null;
  ofertaFechaEnvio = '';
  ofertaRealizoSeguimiento: boolean | null = null;
  ofertaObservacion = '';

  resultadoSolicitudId: number | null = null;
  resultadoFechaLimite = '';
  resultadoServicioViable: boolean | null = null;
  resultadoTipoMuestraEspecificado: string | null = null;
  resultadoEnsayosClaros: boolean | null = null;
  resultadoEquiposCalibrados: boolean | null = null;
  resultadoPersonalCompetente: boolean | null = null;
  resultadoInfraestructuraAdecuada: boolean | null = null;
  resultadoInsumosVigentes: boolean | null = null;
  resultadoCumpleTiempos: boolean | null = null;
  resultadoNormasMetodos: boolean | null = null;
  resultadoMetodoValidado: boolean | null = null;
  resultadoMetodoAdecuado: boolean | null = null;
  resultadoObservacionesTecnicas = '';
  resultadoConceptoFinal: string | null = null;

  encuestaSolicitudId: number | null = null;
  encuestaFecha = '';
  encuestaFechaRealizacion = ''; 
  encuestaPuntuacion: number | null = null;
  encuestaComentarios = '';
  // encuestaRecomendaria: any = '';
  encuestaClienteRespondio: boolean | null = null;
  encuestaSolicitoNueva: boolean | null = null;

  // Formulario alterno: actualizar viabilidad
  viableSolicitudId: number | '' = '';
  viableEstado: number | '' = '';

  // Estado UI
  detallesVisibles: Record<number, boolean> = {};
  solicitudExpandida: number | null = null;
  lastCopiedMessage: string | null = null;
  
  // Tabs para tarjetas de solicitudes
  solicitudTabs = [
    { key: 'detalle', label: 'Detalle' },
    { key: 'revision', label: 'Revisión' },
    { key: 'oferta', label: 'Oferta' },
    { key: 'encuesta', label: 'Encuesta' }
  ];
  activeSolicitudTab: Record<number, string> = {};

  // Estado de carga local (para mostrar skeletons)
  cargando = signal<boolean>(true);

  // Oferta: display string for formatted input
  ofertaValorDisplay = '';
  // Keep the last valid raw display to restore when input exceeds limits
  private ofertaValorPrevDisplay = '';
  // Error message to show under the oferta valor input
  ofertaValorError = '';

  // Efectos (disponibles para limpiar en ngOnDestroy)
  private clientesEffectStop?: EffectRef;
  private solicitudesEffectStop?: EffectRef;

  constructor() {
    // Create effects inside the constructor to ensure we are in an
    // injection context (avoids NG0203 runtime error).
    this.clientesEffectStop = effect(() => {
      this.clientes(); // subscribe to signal
      this.filtrarClientes();
    });

    this.solicitudesEffectStop = effect(() => {
      this.solicitudes(); // subscribe to signal
      this.filtrarSolicitudes();
      try { this.computeNextSolicitudConsecutivo(); } catch (e) { console.warn('computeNextSolicitudConsecutivo effect error', e); }
    });
  }

  // Opciones para selects
  tiposCliente = [
    'Emprendedor',
    'Persona Natural', 
    'Persona Jurídica',
    'Aprendiz SENA',
    'Instructor SENA',
    'Centros SENA'
  ];

  tiposIdentificacion = [
    { value: 'CC', label: 'CC - Cédula de Ciudadanía' },
    { value: 'TI', label: 'TI - Tarjeta de Identidad' },
    { value: 'CE', label: 'CE - Cédula de Extranjería' },
    { value: 'NIT', label: 'NIT - Número de Identificación Tributaria' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'OTRO', label: 'Otro' }
  ];

  opcionesSexo = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'Otro', label: 'Otro' }
  ];

  tiposComunidad = [
    'Campesino',
    'Economía Popular',
    'Madre Cabeza de Familia',
    'Egresado SENA',
    'Indígena',
    'Afrocolombiano',
    'Ninguna',
    'Otras'
  ];

  tiposSolicitud = [
    { value: 'AF', label: 'AF - Apoyo Formación' },
    { value: 'EN', label: 'EN - Ensayos' },
    { value: 'UI', label: 'UI - Uso Infraestructura' },
    { value: 'IA', label: 'IA - Investigación Aplicada' }
  ];

  tiposAf = [
    { id: 1, nombre: 'Portafolio de servicios' },
    { id: 2, nombre: 'Talleres' },
    { id: 3, nombre: 'Visitas técnicas' }
  ];

  tiposEmpaque = [
    'Sellado al vacío',
    'Tetrabrik (Tetra Pak)',
    'Envase plástico',
    'Envase de vidrio',
    'Envase metálico',
    'Otras'
  ];

  tiposAnalisis = [
    'BT-Extracción de ADN',
    'MB-Bacterias productoras de ácido láctico-Recuento',
    'MB-Coliformes totales-Recuento-Método horizontal',
    'MB-E. Coli-Recuento-Método horizontal',
    'MB-Hongos y levaduras-Enumeración-Método horizontal',
    'MB-Salmonella-Presencia-Ausencia',
    'QA-Acidez en aderezos',
    'QA-Conductividad en agua',
    'QA-Contenido de Ácido Acético-Ácido Láctico-Etanol-UHPLC',
    'QA-Contenido de Ácido Ascórbico-UHPLC',
    'QA-Contenido de alcohol por hidrometría en bebidas alcohólicas',
    'QA-Extracto seco',
    'QA-Humedad',
    'QA-pH en agua',
    'QA-pH en bebidas alcohólicas',
    'QA-Proteinas por el método de Bradford',
    'QA-Sacarosa-Fructosa-Glucosa-UHPLC',
    'Otro'
  ];

  tipoMuestraEspecificadoOptions = [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
    { value: 'NO_APLICA', label: 'No aplica' }
  ];

  conceptoFinalOptions = [
    { value: 'SOLICITUD_VIABLE', label: 'Solicitud viable' },
    { value: 'SOLICITUD_VIABLE_CON_OBSERVACIONES', label: 'Viable con observaciones' },
    { value: 'SOLICITUD_NO_VIABLE', label: 'Solicitud no viable' }
  ];

  clienteFields = [
    { key: 'nombre_solicitante', label: 'Nombre solicitante', copyable: true },
    { key: 'razon_social', label: 'Razón social', copyable: true },
    { key: 'fecha_vinculacion', label: 'Fecha vinculación', copyable: true },
    { key: 'tipo_identificacion', label: 'Tipo identificación', copyable: true },
    { key: 'sexo', label: 'Sexo', copyable: false },
    { key: 'tipo_poblacion', label: 'Población', copyable: false },
    { key: 'direccion', label: 'Dirección', copyable: true },
    { key: 'ciudad_departamento', label: 'Ciudad / Departamento', copyable: true, fullWidth: false },
    { key: 'telefono_celular', label: 'Teléfono / Celular', copyable: true, fullWidth: false },
    { key: 'correo_electronico', label: 'Correo', copyable: true },
    { key: 'tipo_vinculacion', label: 'Tipo vinculación', copyable: true },
    { key: 'observaciones', label: 'Observaciones', copyable: true, fullWidth: true },
    { key: 'registro_realizado_por', label: 'Registro por', copyable: true, small: true },
    { key: 'created_at', label: 'Creado', copyable: true, small: true },
    { key: 'updated_at', label: 'Actualizado', copyable: true, small: true }
  ];

  ngOnInit() {
    console.log('🎯 Solicitudes component: Iniciando...');
    this.loadInitialData();
    this.filtrarClientes();
    this.filtrarSolicitudes();
    const u = this.user();
    if (u?.rol === 'Administrador') {
      this.formularioActivo = 'revision';
    }
  }

  ngOnDestroy() {
    console.log('🔴 Solicitudes component: Destruyendo...');
    try { if (this.clientesEffectStop) this.clientesEffectStop.destroy(); } catch { void 0; }
    try { if (this.solicitudesEffectStop) this.solicitudesEffectStop.destroy(); } catch { void 0; }
  }

  private async loadInitialData(): Promise<void> {
    console.log('🔄 Cargando datos iniciales...');
    try {
      await this.locationsService.loadDepartamentos();
      console.log('✅ Departamentos cargados:', this.departamentos().length);
      await this.loadClientes();
      console.log('✅ Clientes cargados:', this.clientes().length);

      await this.loadEstadosSolicitud();
      await this.loadAdminUsuarios();

      // If no solicitud cliente selected, default to first cliente for new solicitudes
      const firstClient = (this.clientes() || [])[0];
      if (firstClient) {
        // Keep selectedCliente for autofill helpers, but do NOT preselect the client in the "Agregar solicitud" form.
        // The placeholder should be shown instead of forcing the first client selection.
        this.selectedCliente.set(firstClient);
      }

      // Preload ciudades for all departamentos present among clients
      const clientesList = this.clientes() || [];
      const depCodes = Array.from(new Set(
        clientesList
          .map(c => c.id_departamento || c.departamento_codigo)
          .filter(Boolean)
          .map(x => String(x))
      ));
      for (const depCode of depCodes) {
        try {
          await this.locationsService.loadCiudades(depCode);
        } catch (e) {
          console.warn('No se pudieron cargar ciudades para departamento', depCode, e);
        }
      }

      this.computeNextClienteNumero();
      await this.loadSolicitudes();
      console.log('✅ Solicitudes cargadas:', this.solicitudes().length);

      // Default selected solicitud when possible
      const firstSolicitud = (this.solicitudes() || [])[0];
      if (firstSolicitud) {
        this.selectedSolicitud.set(firstSolicitud);
      }
      this.computeNextSolicitudConsecutivo();
    } catch (err) {
      console.error('❌ Error cargando datos iniciales:', err);
      this.manejarError(err, 'cargar datos iniciales');
    } finally {
      // Marcar carga inicial como finalizada (muestra listas o mensajes)
      try { this.cargando.set(false); } catch { void 0; }
    }
  }

  // Método para obtener fecha actual en formato YYYY-MM-DD
getTodayDate(): string {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

// Método para obtener fecha de mañana en formato YYYY-MM-DD
getTomorrowDate(): string {
  const mañana = new Date();
  mañana.setDate(mañana.getDate() + 1); // Sumar 1 día
  
  const año = mañana.getFullYear();
  const mes = String(mañana.getMonth() + 1).padStart(2, '0');
  const dia = String(mañana.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

  // Calcula el siguiente consecutivo para solicitud
  computeNextSolicitudConsecutivo(): void {
    try {
      const items = this.solicitudes() || [];
      let maxId = 0;
      for (const s of items) {
        const n = Number(s.solicitud_id || s.id_solicitud || 0);
        if (!isNaN(n) && n > maxId) maxId = n;
      }
      const siguiente = maxId + 1;
      // Siempre actualizar el consecutivo para reflejar el estado actual de la base de datos.
      // Esto evita que el contador se quede en un valor anterior cuando se borran todas las solicitudes.
      this.solicitudConsecutivo = siguiente;
    } catch (err) {
      console.warn('computeNextSolicitudConsecutivo error', err);
    }
  }

  // Calcula el siguiente valor para el campo "Consecutivo" del cliente
  computeNextClienteNumero(): void {
    try {
      const clientes = this.clientes() || [];
      let maxNum = 0;
      for (const c of clientes) {
        const n = Number(c.numero || c.numero_cliente || 0);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
      const siguiente = maxNum + 1;
      if (!this.clienteNumero || Number(this.clienteNumero) < siguiente) {
        this.clienteNumero = siguiente;
      }
    } catch (err) {
      console.warn('computeNextClienteNumero error', err);
    }
  }

  // Maneja el cambio del select de tipo de población / comunidad
  handleTipoPoblChange(value: string): void {
    if (value === 'Otras') {
      this.modalTipoPoblText = '';
      this.showTipoPoblModal = true;
      this.clienteTipoPobl = '';
    } else {
      this.clienteTipoPobl = value;
    }
  }

  confirmTipoPoblModal(): void {
    const text = (this.modalTipoPoblText || '').trim();
    if (!text) {
      this.snackbarService.warn('Por favor escribe la descripción de la comunidad');
      return;
    }

    if (!this.clienteTipoPoblCustomOptions.includes(text)) {
      this.clienteTipoPoblCustomOptions.push(text);
    }

    this.clienteTipoPobl = text;
    this.showTipoPoblModal = false;
    this.modalTipoPoblText = '';
  }

  cancelTipoPoblModal(): void {
    this.showTipoPoblModal = false;
    this.modalTipoPoblText = '';
    this.clienteTipoPobl = '';
  }

  // Maneja el cambio del select de Tipo de análisis
  handleTipoAnalisisChange(value: string): void {
    if (value === 'Otro') {
      this.modalTipoAnalisisText = '';
      this.showTipoAnalisisModal = true;
      this.solicitudTipoAnalisis = '';
    } else {
      this.solicitudTipoAnalisis = value;
    }
  }

  // Maneja el cambio del select de Tipo de empaque
  handleTipoEmpaqueChange(value: string): void {
    if (value === 'Otras') {
      this.modalTipoEmpaqueText = '';
      this.showTipoEmpaqueModal = true;
      this.solicitudCondEmpaque = '';
    } else {
      this.solicitudCondEmpaque = value;
    }
  }

  onSolicitudTipoChange(value: string): void {
    this.solicitudTipo = value;
    if (value !== 'AF') {
      this.solicitudTipoAfId = null;
      this.solicitudErrors['tipoAF'] = '';
    }
    this.computeNumeroFrontPreview();
  }

  onEditSolicitudTipoChange(value: string): void {
    this.editSolicitudTipo = value;
    if (value !== 'AF') {
      this.editSolicitudTipoAfId = null;
    }
  }

  confirmTipoEmpaqueModal(): void {
    const text = (this.modalTipoEmpaqueText || '').trim();
    if (!text) {
      this.snackbarService.warn('Por favor escribe la descripción del tipo de empaque');
      return;
    }
    if (!this.solicitudTipoEmpaqueCustomOptions.includes(text)) {
      this.solicitudTipoEmpaqueCustomOptions.push(text);
    }
    this.solicitudCondEmpaque = text;
    this.showTipoEmpaqueModal = false;
    this.modalTipoEmpaqueText = '';
  }

  cancelTipoEmpaqueModal(): void {
    this.showTipoEmpaqueModal = false;
    this.modalTipoEmpaqueText = '';
    this.solicitudCondEmpaque = '';
  }

  confirmTipoAnalisisModal(): void {
    const text = (this.modalTipoAnalisisText || '').trim();
    if (!text) {
      this.snackbarService.warn('Por favor escribe la descripción del análisis');
      return;
    }
    if (!this.solicitudTipoAnalisisCustomOptions.includes(text)) {
      this.solicitudTipoAnalisisCustomOptions.push(text);
    }
    this.solicitudTipoAnalisis = text;
    this.showTipoAnalisisModal = false;
    this.modalTipoAnalisisText = '';
  }

  cancelTipoAnalisisModal(): void {
    this.showTipoAnalisisModal = false;
    this.modalTipoAnalisisText = '';
    this.solicitudTipoAnalisis = '';
  }

  // Recalcula el preview del código tipo-año-consecutivo
  computeNumeroFrontPreview(): void {
    const tipo = (this.solicitudTipo || '').trim();
    if (!tipo) { 
      this.solicitudNumeroFrontPreview = ''; 
      return; 
    }
    
    const fecha = this.solicitudFechaSolicitud ? new Date(this.solicitudFechaSolicitud) : new Date();
    const year = fecha.getFullYear();
    let count = 0;
    
    for (const s of (this.solicitudes() || [])) {
      const t = String(s?.tipo_solicitud ?? '').trim();
      const y = s?.fecha_solicitud ? new Date(String(s.fecha_solicitud)).getFullYear() : new Date().getFullYear();
      if (t === tipo && y === year) count++;
    }
    
    const next = count + 1;
    const cc = String(next).padStart(2, '0');
    this.solicitudNumeroFrontPreview = `${tipo}-${year}-${cc}`;
  }

  // ========== MÉTODOS DE CARGA ==========
  async loadClientes(): Promise<void> {
    try {
      await this.clientesService.loadClientes();
      this.filtrarClientes();
    } catch (err: any) {
      this.manejarError(err, 'cargar clientes');
    }
  }

  async loadSolicitudes(): Promise<void> {
    try {
      await this.solicitudesService.loadSolicitudes();
      this.filtrarSolicitudes();
      this.computeNumeroFrontPreview();
    } catch (err: any) {
      this.manejarError(err, 'cargar solicitudes');
    }
  }

  async loadEstadosSolicitud(): Promise<void> {
    try {
      const rows = await this.solicitudesService.listarEstadosSolicitud();
      this.estadosSolicitud = Array.isArray(rows) ? (rows as EstadoLike[]) : [];
      this.filtrarSolicitudes();
    } catch (err: any) {
      console.warn('Error cargando estados de solicitud:', err);
      this.estadosSolicitud = [];
    }
  }

  async loadAdminUsuarios(): Promise<void> {
    if (!this.canEditSolicitudEstado()) return;
    if (this.adminUsuariosLoading) return;
    this.adminUsuariosLoading = true;
    try {
      const rows = await usuariosService.listarUsuarios();
      const list = Array.isArray(rows) ? rows : [];
      this.adminUsuarios = list.filter((u: any) => {
        const rol = String(u?.rol_nombre || u?.rol || '').toLowerCase();
        return rol === 'administrador' || rol === 'superadmin';
      });
    } catch (err: any) {
      console.warn('Error cargando administradores:', err);
      this.adminUsuarios = [];
    } finally {
      this.adminUsuariosLoading = false;
    }
  }

  onDepartamentoChange(eventOrCodigo?: Event | string): void {
    const codigo = typeof eventOrCodigo === 'string'
      ? eventOrCodigo
      : String((eventOrCodigo?.target as HTMLSelectElement | null)?.value ?? this.clienteIdDepartamento ?? '').trim();

    this.clienteIdDepartamento = codigo;
    this.clienteIdCiudad = '';
    this.locationsService.clearCiudades();

    if (!codigo) {
      return;
    }

    (async () => {
      try {
        await this.locationsService.loadCiudades(codigo);
        const count = this.ciudades().length;
        if (count === 0) {
          this.snackbarService.warn('No se encontraron ciudades para el departamento seleccionado');
        }
      } catch {
        this.snackbarService.error('Error cargando ciudades. Verifica la conexión.');
      }
    })();
  }

  // ========== FILTRADO ==========
  filtrarClientes(): void {
    const clientes = this.clientes();
    
    if (!this.clientesQ.trim()) {
      this.clientesFiltrados.set(clientes);
      return;
    }
    
    const filtro = this.clientesQ.toLowerCase().trim();
    const clientesFiltrados = clientes.filter(cliente => {
      const nombre = (cliente.nombre_solicitante || '').toLowerCase();
      const correo = (cliente.correo_electronico || '').toLowerCase();
      const identificacion = (cliente.numero_identificacion || '').toLowerCase();
      const ciudad = (this.resolveCiudad(cliente) || '').toLowerCase();
      const departamento = (this.resolveDepartamento(cliente) || '').toLowerCase();
      const celular = (cliente.celular || '').toLowerCase();
      const telefono = (cliente.telefono || '').toLowerCase();
      const tipoUsuario = (cliente.tipo_usuario || '').toLowerCase();
      
      return nombre.includes(filtro) || correo.includes(filtro) ||
             identificacion.includes(filtro) || ciudad.includes(filtro) ||
             departamento.includes(filtro) || celular.includes(filtro) ||
             telefono.includes(filtro) || tipoUsuario.includes(filtro);
    });
    
    this.clientesFiltrados.set(clientesFiltrados);
  }

  async descargarClientesExcel(): Promise<void> {
    if (this.descargandoClientesExcel) return;
    this.descargandoClientesExcel = true;
    try {
      const { blob, filename } = await this.solicitudesService.exportarClientesExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'clientes.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.snackbarService.success('Excel de clientes descargado');
    } catch (err: any) {
      this.snackbarService.error(err?.message || 'No se pudo descargar el Excel de clientes');
    } finally {
      this.descargandoClientesExcel = false;
    }
  }

  async descargarClientesSolicitudesExcel(): Promise<void> {
    if (this.descargandoClientesSolicitudesExcel) return;
    this.descargandoClientesSolicitudesExcel = true;
    try {
      const { blob, filename } = await this.solicitudesService.exportarClientesSolicitudesExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'solicitudes_clientes.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.snackbarService.success('Excel de solicitudes y clientes descargado');
    } catch (err: any) {
      this.snackbarService.error(err?.message || 'No se pudo descargar el Excel de solicitudes y clientes');
    } finally {
      this.descargandoClientesSolicitudesExcel = false;
    }
  }

  async descargarSolicitudesExcel(): Promise<void> {
    if (this.descargandoSolicitudesExcel) return;
    this.descargandoSolicitudesExcel = true;
    try {
      const { blob, filename } = await this.solicitudesService.exportarSolicitudesExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'solicitudes.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.snackbarService.success('Excel de solicitudes descargado');
    } catch (err: any) {
      this.snackbarService.error(err?.message || 'No se pudo descargar el Excel de solicitudes');
    } finally {
      this.descargandoSolicitudesExcel = false;
    }
  }

  private esActivoCliente(item: any): boolean {
    const v = item?.activo;
    if (v === undefined || v === null) return true;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    const s = String(v).trim().toLowerCase();
    return s === '1' || s === 'true' || s === 't' || s === 'yes' || s === 'y';
  }

  async cargarClientesDocumentos(): Promise<void> {
    try {
      if (!(this.clientes() || []).length) {
        await this.clientesService.loadClientes();
      }
      const rows = this.clientes() || [];
      this.clientesDocumentos = rows.filter((c: any) => this.esActivoCliente(c));
    } catch (e) {
      console.error('Error cargando clientes para documentos', e);
      this.clientesDocumentos = [];
    }
  }

  async cargarSolicitudesDocumentos(): Promise<void> {
    try {
      if (!(this.solicitudes() || []).length) {
        await this.solicitudesService.loadSolicitudes();
      }
      this.solicitudesDocumentos = this.solicitudes() || [];
    } catch (e) {
      console.error('Error cargando solicitudes para documentos', e);
      this.solicitudesDocumentos = [];
    }
  }

  filtrarSolicitudesPlantillaDocumentos(): void {
    const q = (this.tplSolicitudDocBusqueda || '').toLowerCase().trim();
    if (!q) {
      this.tplSolicitudDocResultados = [];
      return;
    }

    if (this.tplSolicitudDocEntidad === 'cliente') {
      this.tplSolicitudDocResultados = this.clientesDocumentos.filter((c) => {
        const nombre = (c?.nombre_solicitante || '').toLowerCase();
        const razon = (c?.razon_social || '').toLowerCase();
        const ident = (c?.numero_identificacion || '').toLowerCase();
        const correo = (c?.correo_electronico || '').toLowerCase();
        const numero = String(c?.['numero'] ?? '').toLowerCase();
        const ciudad = (this.resolveCiudad(c) || '').toLowerCase();
        const departamento = (this.resolveDepartamento(c) || '').toLowerCase();

        if (this.tplSolicitudDocFiltroTipo === 'todos') {
          return (
            nombre.includes(q) ||
            razon.includes(q) ||
            ident.includes(q) ||
            correo.includes(q) ||
            numero.includes(q) ||
            ciudad.includes(q) ||
            departamento.includes(q)
          );
        } else if (this.tplSolicitudDocFiltroTipo === 'nombre') {
          return nombre.includes(q);
        } else if (this.tplSolicitudDocFiltroTipo === 'razon_social') {
          return razon.includes(q);
        } else if (this.tplSolicitudDocFiltroTipo === 'identificacion') {
          return ident.includes(q);
        } else if (this.tplSolicitudDocFiltroTipo === 'correo') {
          return correo.includes(q);
        } else if (this.tplSolicitudDocFiltroTipo === 'numero') {
          return numero.includes(q);
        }
        return false;
      });
      return;
    }

    this.tplSolicitudDocResultados = this.solicitudesDocumentos.filter((s) => {
      const id = String(s?.solicitud_id ?? s?.id_solicitud ?? '').toLowerCase();
      const tipo = (s?.tipo_solicitud || '').toLowerCase();
      const numeroFront = (s?.numero_solicitud_front || '').toLowerCase();
      const solicitante = (s?.nombre_solicitante || '').toLowerCase();
      const muestra = (s?.nombre_muestra || '').toLowerCase();
      const analisis = (s?.analisis_requerido || '').toLowerCase();
      const lote = (s?.lote_producto || '').toLowerCase();

      if (this.tplSolicitudDocFiltroTipo === 'todos') {
        return (
          id.includes(q) ||
          tipo.includes(q) ||
          numeroFront.includes(q) ||
          solicitante.includes(q) ||
          muestra.includes(q) ||
          analisis.includes(q) ||
          lote.includes(q)
        );
      } else if (this.tplSolicitudDocFiltroTipo === 'id') {
        return id.includes(q);
      } else if (this.tplSolicitudDocFiltroTipo === 'numero_front') {
        return numeroFront.includes(q);
      } else if (this.tplSolicitudDocFiltroTipo === 'solicitante') {
        return solicitante.includes(q);
      } else if (this.tplSolicitudDocFiltroTipo === 'muestra') {
        return muestra.includes(q);
      } else if (this.tplSolicitudDocFiltroTipo === 'analisis') {
        return analisis.includes(q);
      } else if (this.tplSolicitudDocFiltroTipo === 'lote') {
        return lote.includes(q);
      }
      return false;
    });
  }

  seleccionarSolicitudPlantillaDocumento(item: any): void {
    this.tplSolicitudDocSeleccionado = item;
    this.tplSolicitudDocResultados = [];
    this.tplSolicitudDocBusqueda = '';
    this.tplSolicitudDocMsg = '';
  }

  onTplSolicitudDocEntidadChanged(): void {
    this.tplSolicitudDocFiltroTipo = 'todos';
    this.tplSolicitudDocBusqueda = '';
    this.tplSolicitudDocResultados = [];
    this.tplSolicitudDocSeleccionado = null;
    this.tplSolicitudDocMsg = '';
  }

  onTplSolicitudDocGenerarTodosChanged(): void {
    if (this.tplSolicitudDocGenerarTodos) {
      this.tplSolicitudDocBusqueda = '';
      this.tplSolicitudDocResultados = [];
      this.tplSolicitudDocSeleccionado = null;
      this.tplSolicitudDocMsg = '';
    }
  }

  limpiarSeleccionSolicitudPlantillaDocumento(): void {
    this.tplSolicitudDocFiltroTipo = 'todos';
    this.tplSolicitudDocBusqueda = '';
    this.tplSolicitudDocResultados = [];
    this.tplSolicitudDocSeleccionado = null;
    this.tplSolicitudDocPlantillaId = null;
    this.tplSolicitudDocNombrePlantilla = '';
    this.tplSolicitudDocTemplateFile = null;
    this.tplSolicitudDocMsg = '';
    this.tplSolicitudDocLoading = false;
    this.tplSolicitudDocUploadLoading = false;
    try {
      const el = this.tplSolicitudDocTemplateInput?.nativeElement;
      if (el) el.value = '';
    } catch {
      void 0;
    }
  }

  onTplSolicitudDocTemplateSelected(event: any): void {
    try {
      const f = event?.target?.files?.[0] || null;
      this.tplSolicitudDocTemplateFile = f;
      this.tplSolicitudDocMsg = '';
    } catch {
      this.tplSolicitudDocTemplateFile = null;
    }
  }

  async cargarPlantillasDocumentoSolicitud(): Promise<void> {
    if (this.tplSolicitudDocListLoading()) return;
    this.tplSolicitudDocListLoading.set(true);
    this.tplSolicitudDocMsg = '';
    try {
      const rows = await this.solicitudesService.listarPlantillasDocumentoSolicitud();
      this.tplSolicitudDocPlantillas.set(Array.isArray(rows) ? rows : []);
      if (this.tplSolicitudDocPlantillaId != null) {
        const exists = this.tplSolicitudDocPlantillas().some(
          (t) => Number(t?.id) === Number(this.tplSolicitudDocPlantillaId)
        );
        if (!exists) this.tplSolicitudDocPlantillaId = null;
      }
    } catch (err: any) {
      this.tplSolicitudDocMsg = err?.message || 'Error listando plantillas';
      this.snackbarService.error(this.tplSolicitudDocMsg);
    } finally {
      this.tplSolicitudDocListLoading.set(false);
    }
  }

  async subirPlantillaDocumentoSolicitud(): Promise<void> {
    if (this.tplSolicitudDocUploadLoading) return;
    if (!this.tplSolicitudDocTemplateFile) {
      this.tplSolicitudDocMsg = 'Selecciona una plantilla .xlsx o .docx';
      this.snackbarService.warn(this.tplSolicitudDocMsg);
      return;
    }

    this.tplSolicitudDocUploadLoading = true;
    this.tplSolicitudDocMsg = '';
    try {
      const created = await this.solicitudesService.subirPlantillaDocumentoSolicitud({
        template: this.tplSolicitudDocTemplateFile,
        nombre: this.tplSolicitudDocNombrePlantilla || undefined
      });
      await this.cargarPlantillasDocumentoSolicitud();
      const id = Number(created?.id);
      if (Number.isFinite(id) && id > 0) this.tplSolicitudDocPlantillaId = id;
      this.tplSolicitudDocNombrePlantilla = '';
      this.tplSolicitudDocTemplateFile = null;
      try {
        const el = this.tplSolicitudDocTemplateInput?.nativeElement;
        if (el) el.value = '';
      } catch {
        void 0;
      }
      this.snackbarService.success('Plantilla guardada');
    } catch (err: any) {
      this.tplSolicitudDocMsg = err?.message || 'Error subiendo plantilla';
      this.snackbarService.error(this.tplSolicitudDocMsg);
    } finally {
      this.tplSolicitudDocUploadLoading = false;
    }
  }

  async eliminarPlantillaDocumentoSolicitud(): Promise<void> {
    const id = this.tplSolicitudDocPlantillaId;
    if (!id) {
      this.tplSolicitudDocMsg = 'Seleccione una plantilla';
      this.snackbarService.warn(this.tplSolicitudDocMsg);
      return;
    }
    if (this.tplSolicitudDocDeleteLoading.has(id)) return;

    this.tplSolicitudDocDeleteLoading.add(id);
    this.tplSolicitudDocMsg = '';
    try {
      await this.solicitudesService.eliminarPlantillaDocumentoSolicitud(id);
      await this.cargarPlantillasDocumentoSolicitud();
      this.tplSolicitudDocPlantillaId = null;
      this.snackbarService.success('Plantilla eliminada');
    } catch (err: any) {
      this.tplSolicitudDocMsg = err?.message || 'Error eliminando plantilla';
      this.snackbarService.error(this.tplSolicitudDocMsg);
    } finally {
      this.tplSolicitudDocDeleteLoading.delete(id);
    }
  }

  async generarDocumentoSolicitudDesdePlantilla(): Promise<void> {
    if (this.tplSolicitudDocLoading) return;
    const templateId = this.tplSolicitudDocPlantillaId;
    if (!templateId) {
      this.tplSolicitudDocMsg = 'Seleccione una plantilla';
      this.snackbarService.warn(this.tplSolicitudDocMsg);
      return;
    }

    this.tplSolicitudDocLoading = true;
    this.tplSolicitudDocMsg = '';
    try {
      const selected = this.tplSolicitudDocPlantillas().find((t) => Number(t?.id) === Number(templateId));
      const fallbackName = selected?.nombre_archivo || selected?.nombre || null;
      const solicitud_id =
        this.tplSolicitudDocEntidad === 'solicitud'
          ? Number(this.tplSolicitudDocSeleccionado?.solicitud_id ?? this.tplSolicitudDocSeleccionado?.id_solicitud)
          : undefined;
      const id_cliente =
        this.tplSolicitudDocEntidad === 'cliente'
          ? Number(this.tplSolicitudDocSeleccionado?.id_cliente)
          : Number(this.tplSolicitudDocSeleccionado?.id_cliente ?? this.tplSolicitudDocSeleccionado?.cliente_id);
      if (!this.tplSolicitudDocGenerarTodos) {
        if (this.tplSolicitudDocEntidad === 'solicitud') {
          if (!Number.isFinite(solicitud_id) || (solicitud_id as number) <= 0) throw new Error('Debe seleccionar una solicitud');
        } else {
          if (!Number.isFinite(id_cliente) || (id_cliente as number) <= 0) throw new Error('Debe seleccionar un cliente');
        }
      }

      const { blob, filename } = await this.solicitudesService.generarDocumentoDesdePlantilla({
        templateId,
        solicitud_id: this.tplSolicitudDocGenerarTodos ? undefined : solicitud_id,
        id_cliente: this.tplSolicitudDocGenerarTodos ? undefined : id_cliente,
        todos: this.tplSolicitudDocGenerarTodos,
        entidad: this.tplSolicitudDocEntidad
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || fallbackName || 'documento';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.snackbarService.success('Documento generado');
      } catch (err: any) {
        this.tplSolicitudDocMsg = err?.message || 'No se pudo generar el documento';
        this.snackbarService.error(this.tplSolicitudDocMsg);
      } finally {
        this.tplSolicitudDocLoading = false;
      }
  }

  filtrarSolicitudes(): void {
    const base = [...this.solicitudes()];
    
    // Ordenar por fecha y luego por id
    const arr = base.sort((a, b) => {
      const da = a?.fecha_solicitud ? new Date(String(a.fecha_solicitud)).getTime() : 0;
      const db = b?.fecha_solicitud ? new Date(String(b.fecha_solicitud)).getTime() : 0;
      if (da !== db) return da - db;
      return Number(a?.solicitud_id ?? a?.id_solicitud ?? 0) - Number(b?.solicitud_id ?? b?.id_solicitud ?? 0);
    });

    // Normalizar campos
    const normalized = arr.map((s) => {
      const id = s?.solicitud_id ?? s?.id_solicitud ?? s?.solicitudId ?? null;
      const tipo = (s?.tipo_solicitud ?? s?.tipo ?? '').toString().trim();
      const fecha = s?.fecha_solicitud ?? s?.created_at ?? s?.fecha ?? null;
      const nombreSolicitante = s?.nombre_solicitante ?? s?.cliente_nombre ?? s?.nombre_cliente ?? (s?.cliente?.nombre) ?? '';
      const nombreMuestra = s?.nombre_muestra ?? s?.muestra_nombre ?? s?.producto_nombre ?? '';
      const rawEstado = s?.id_estado ?? null;
      let idEstado = rawEstado === null || rawEstado === undefined || rawEstado === ''
        ? null
        : Number(rawEstado);
      if (!Number.isFinite(idEstado)) idEstado = null;
      const estadosList = this.estadosSolicitud || [];
      if (idEstado !== null && estadosList.length) {
        const exists = estadosList.some((e: any) => Number(e?.id_estado) === Number(idEstado));
        if (!exists) idEstado = null;
      }
      const estadoNombre = String(s?.nombre_estado ?? '').trim().toLowerCase();
      if (estadosList.length && estadoNombre) {
        const match = estadosList.find((e: any) => {
          const nombre = String(e?.nombre_estado || e?.nombre || '').trim().toLowerCase();
          return nombre && nombre === estadoNombre;
        });
        if (match && Number.isFinite(Number(match?.id_estado))) {
          const matchId = Number(match.id_estado);
          if (idEstado === null || Number(idEstado) !== matchId) {
            idEstado = matchId;
          }
        }
      }
      const rawAdmin = s?.id_admin ?? null;
      let idAdmin = rawAdmin === null || rawAdmin === undefined || rawAdmin === ''
        ? null
        : Number(rawAdmin);
      if (!Number.isFinite(idAdmin)) idAdmin = null;
      
      return {
        ...s,
        id_solicitud: id,
        solicitud_id: id,
        tipo_solicitud: tipo,
        fecha_solicitud: fecha,
        nombre_solicitante: nombreSolicitante,
        nombre_muestra: nombreMuestra,
        id_estado: idEstado,
        id_admin: idAdmin
      };
    });

    const solicitudes = normalized.map((s) => {
      return {
        ...s,
        numero_solicitud_front: this.getNumeroSolicitudFrontValue(s)
      };
    });

    let solicitudesFiltradas = solicitudes;
    if (this.solicitudesFiltroViabilidad !== 'todos') {
      solicitudesFiltradas = solicitudesFiltradas.filter((s) => {
        const concepto = this.getConceptoFinalValue(s);
        if (!concepto) return false;
        if (this.solicitudesFiltroViabilidad === 'viable') return concepto === 'SOLICITUD_VIABLE';
        if (this.solicitudesFiltroViabilidad === 'viable_observaciones')
          return concepto === 'SOLICITUD_VIABLE_CON_OBSERVACIONES';
        if (this.solicitudesFiltroViabilidad === 'no_viable') return concepto === 'SOLICITUD_NO_VIABLE';
        return true;
      });
    }

    if (this.solicitudesFiltroEstado !== 'todos') {
      solicitudesFiltradas = solicitudesFiltradas.filter((s) => {
        return this.getEstadoFiltroValue(s) === this.solicitudesFiltroEstado;
      });
    }

    if (!this.solicitudesQ.trim()) {
      this.solicitudesFiltradas.set(solicitudesFiltradas);
      return;
    }

    const filtro = this.solicitudesQ.toLowerCase().trim();
    solicitudesFiltradas = solicitudesFiltradas.filter(solicitud => {
      const id = String(solicitud?.solicitud_id ?? solicitud?.id_solicitud ?? '');
      const tipo = String(solicitud?.tipo_solicitud ?? '').toLowerCase();
      const numeroFront = String(solicitud?.numero_solicitud_front ?? '').toLowerCase();
      const nombreSolicitante = String(solicitud?.nombre_solicitante ?? '').toLowerCase();
      const nombreMuestra = String(solicitud?.nombre_muestra ?? '').toLowerCase();
      const tipoMuestra = String(solicitud?.tipo_muestra ?? '').toLowerCase();
      const tipoAnalisis = String(solicitud?.analisis_requerido ?? '').toLowerCase();
      const lote = String(solicitud?.lote_producto ?? '').toLowerCase();
      
      return id.includes(filtro) || tipo.includes(filtro) ||
             numeroFront.includes(filtro) || nombreSolicitante.includes(filtro) ||
             nombreMuestra.includes(filtro) || tipoMuestra.includes(filtro) ||
             tipoAnalisis.includes(filtro) || lote.includes(filtro);
    });

    this.solicitudesFiltradas.set(solicitudesFiltradas);
  }

  getNumeroSolicitudFrontValue(s: any): string {
    const existing = String(s?.numero_solicitud_front ?? s?.numero_solicitud ?? s?.numero ?? '').trim();
    if (existing) return existing;
    const tipoVal = String(s?.tipo_solicitud ?? s?.tipo ?? '').trim();
    if (!tipoVal) return 'N/A';
    const fecha = s?.fecha_solicitud ?? s?.created_at ?? s?.fecha ?? null;
    let fechaDate = fecha ? new Date(fecha) : new Date();
    if (isNaN(fechaDate.getTime())) fechaDate = new Date();
    const year = fechaDate.getFullYear();
    const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? s?.id);
    if (!Number.isFinite(sid) || sid <= 0) {
      return `${tipoVal}-${year}-00`;
    }
    return `${tipoVal}-${year}-${String(sid).padStart(2, '0')}`;
  }

  // ========== VALIDACIONES ==========
 validarCliente(): boolean {
  // Validar todos los campos dinámicamente
  this.validarCampoClienteEnTiempoReal('nombre');
  this.validarCampoClienteEnTiempoReal('numero');
  this.validarCampoClienteEnTiempoReal('fechaVinc');
  this.validarCampoClienteEnTiempoReal('tipoUsuario');
  this.validarCampoClienteEnTiempoReal('razonSocial');
  this.validarCampoClienteEnTiempoReal('nit');
  this.validarCampoClienteEnTiempoReal('tipoId');
  this.validarCampoClienteEnTiempoReal('idNum');
  this.validarCampoClienteEnTiempoReal('sexo');
  this.validarCampoClienteEnTiempoReal('tipoPobl');
  this.validarCampoClienteEnTiempoReal('direccion');
  this.validarCampoClienteEnTiempoReal('departamento');
  this.validarCampoClienteEnTiempoReal('ciudad');
  this.validarCampoClienteEnTiempoReal('celular');
  this.validarCampoClienteEnTiempoReal('telefono');
  this.validarCampoClienteEnTiempoReal('email');
  this.validarCampoClienteEnTiempoReal('tipoVinc');
  this.validarCampoClienteEnTiempoReal('registroPor');
  this.validarCampoClienteEnTiempoReal('observaciones');
  
  // Verificar si hay errores
  return Object.values(this.clienteErrors).every(error => !error);
}

  validarSolicitud(): boolean {
  // Validar todos los campos dinámicamente
  this.validarCampoSolicitudEnTiempoReal('consecutivo');
  this.validarCampoSolicitudEnTiempoReal('clienteId');
  this.validarCampoSolicitudEnTiempoReal('tipo');
  this.validarCampoSolicitudEnTiempoReal('nombre');
  this.validarCampoSolicitudEnTiempoReal('lote');
  this.validarCampoSolicitudEnTiempoReal('fechaSolicitud');
  this.validarCampoSolicitudEnTiempoReal('fechaVenc');
  this.validarCampoSolicitudEnTiempoReal('tipoMuestra');
  this.validarCampoSolicitudEnTiempoReal('condEmpaque');
  this.validarCampoSolicitudEnTiempoReal('tipoAnalisis');
  this.validarCampoSolicitudEnTiempoReal('cantidad');
  this.validarCampoSolicitudEnTiempoReal('fechaEstimada');
  this.validarCampoSolicitudEnTiempoReal('requiereVarios');
  this.validarCampoSolicitudEnTiempoReal('solicitudRecibida');
  this.validarCampoSolicitudEnTiempoReal('recibePersonal');
  this.validarCampoSolicitudEnTiempoReal('cargoPersonal');
  this.validarCampoSolicitudEnTiempoReal('observaciones');
  if ((this.solicitudTipo || '').trim() === 'AF') {
    this.validarCampoSolicitudEnTiempoReal('tipoAF');
  } else {
    this.solicitudErrors['tipoAF'] = '';
  }
  
  // Verificar si hay errores
  return Object.values(this.solicitudErrors).every(error => !error);
}

 validarOferta(): boolean {
  // Validar todos los campos dinámicamente
  this.validarCampoOfertaEnTiempoReal('solicitudId');
  this.validarCampoOfertaEnTiempoReal('valor');
  this.validarCampoOfertaEnTiempoReal('fechaEnvio');
  this.validarCampoOfertaEnTiempoReal('generoCotizacion');
  this.validarCampoOfertaEnTiempoReal('realizoSeguimiento');
  this.validarCampoOfertaEnTiempoReal('observacion');
  
  // Verificar si hay errores
  return Object.values(this.ofertaErrors).every(error => !error);
}

 validarResultado(): boolean {
  // Validar todos los campos dinámicamente
  this.validarCampoResultadoEnTiempoReal('solicitudId');
    this.validarCampoResultadoEnTiempoReal('fechaLimite');
  
  // Verificar si hay errores
  return Object.values(this.resultadoErrors).every(error => !error);
}

validarEncuesta(): boolean {
  // Validar todos los campos dinámicamente
  this.validarCampoEncuestaEnTiempoReal('solicitudId');
  this.validarCampoEncuestaEnTiempoReal('fecha');
  this.validarCampoEncuestaEnTiempoReal('clienteRespondio');
  
  // Validar fechaRealizacion solo si clienteRespondio es true
  if (this.encuestaClienteRespondio === true) {
    this.validarCampoEncuestaEnTiempoReal('fechaRealizacion');
  }
  
  this.validarCampoEncuestaEnTiempoReal('solicitoNueva');
  this.validarCampoEncuestaEnTiempoReal('comentarios');
  
  // Verificar si hay errores
  return Object.values(this.encuestaErrors).every(error => !error);
}

// ===== VALIDACIÓN DINÁMICA PARA CLIENTE =====
validarCampoClienteEnTiempoReal(campo: string, event?: Event): void {
  void event;
  const valor = this.getValorCliente(campo);
  this.clienteErrors[campo] = this.validarCampoClienteIndividual(campo, valor);
}

private getValorCliente(campo: string): any {
  switch (campo) {
    case 'nombre': return this.clienteNombre;
    case 'numero': return this.clienteNumero;
    case 'fechaVinc': return this.clienteFechaVinc;
    case 'tipoUsuario': return this.clienteTipoUsuario;
    case 'razonSocial': return this.clienteRazonSocial;
    case 'nit': return this.clienteNit;
    case 'tipoId': return this.clienteTipoId;
    case 'idNum': return this.clienteIdNum;
    case 'sexo': return this.clienteSexo;
    case 'tipoPobl': return this.clienteTipoPobl;
    case 'direccion': return this.clienteDireccion;
    case 'departamento': return this.clienteIdDepartamento;
    case 'ciudad': return this.clienteIdCiudad;
    case 'celular': return this.clienteCelular;
    case 'telefono': return this.clienteTelefono;
    case 'email': return this.clienteEmail;
    case 'tipoVinc': return this.clienteTipoVinc;
    case 'registroPor': return this.clienteRegistroPor;
    case 'observaciones': return this.clienteObservaciones;
    default: return '';
  }
}

private validarCampoClienteIndividual(campo: string, valor: any): string {
  switch (campo) {
    case 'nombre': {
      const nombreStr = (valor ?? '').toString().trim();
      if (!nombreStr) return 'El nombre del solicitante es obligatorio';
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.-]{2,100}$/.test(nombreStr))
        return 'El nombre debe contener solo letras, espacios y puntos (2-100 caracteres)';
      return '';
    }
      
    case 'numero':
      if (!valor) return 'El número consecutivo es obligatorio';
      if (Number(valor) < 1 || Number(valor) > 9999)
        return 'El consecutivo debe estar entre 1 y 9999';
      return '';
      
    case 'fechaVinc': {
      if (!valor) return 'La fecha de vinculación es obligatoria';
      const fecha = new Date(valor);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      if (fecha > hoy) return 'La fecha de vinculación no puede ser futura';
      return '';
    }
      
    case 'tipoUsuario':
      if (!valor) return 'Debe seleccionar el tipo de cliente';
      return '';
      
    case 'razonSocial': {
      const razonSocialStr = (valor ?? '').toString().trim();
      if (!razonSocialStr) return 'La razón social es obligatoria';
      if (razonSocialStr.length > 200) return 'La razón social no puede exceder 200 caracteres';
      return '';
    }
      
    case 'nit': {
      // Permitir digitar el NIT sin restringir formato durante la creación.
      // Solo validamos que exista y que no sea excesivamente largo.
      const nitStr = (valor ?? '').toString().trim();
      if (!nitStr) return 'El NIT es obligatorio';
      if (nitStr.length > 60) return 'El NIT no puede exceder 60 caracteres';
      return '';
    }
      
    case 'tipoId':
      if (!valor) return 'Debe seleccionar el tipo de identificación';
      return '';
      
    case 'idNum': {
      const idNumStr = (valor ?? '').toString().trim();
      if (!idNumStr) return 'El número de identificación es obligatorio';
      if (!/^[0-9A-Za-z]{5,20}$/.test(idNumStr))
        return 'Número de identificación inválido (5-20 caracteres alfanuméricos)';
      return '';
    }
      
    case 'sexo':
      if (!valor) return 'Debe seleccionar el sexo';
      if (!['M', 'F', 'Otro'].includes(valor))
        return 'Seleccione una opción válida para sexo';
      return '';
      
    case 'tipoPobl': {
      const tipoPoblStr = (valor ?? '').toString().trim();
      if (!tipoPoblStr) return 'El tipo de comunidad es obligatorio';
      if (tipoPoblStr.length > 50) return 'El tipo de comunidad no puede exceder 50 caracteres';
      return '';
    }
      
    case 'direccion': {
      const direccionStr = (valor ?? '').toString().trim();
      if (!direccionStr) return 'La dirección es obligatoria';
      if (!/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s#.,-]{5,200}$/.test(direccionStr))
        return 'La dirección contiene caracteres inválidos (máx 200 caracteres)';
      return '';
    }
      
    case 'departamento':
      if (!valor) return 'Debe seleccionar un departamento';
      return '';
      
    case 'ciudad':
      if (!valor) return 'Debe seleccionar una ciudad';
      return '';
      
    case 'celular': {
      const celularStr = (valor ?? '').toString().trim();
      if (!celularStr) return 'El celular es obligatorio';
      if (!/^3[0-9]{9}$/.test(celularStr.replace(/\s/g, '')))
        return 'Formato de celular inválido (ej: 3001234567)';
      return '';
    }
      
    case 'telefono':
      if (valor && !/^[0-9]{7,15}$/.test(valor.toString().replace(/\s/g, '')))
        return 'Formato de teléfono inválido (7-15 dígitos)';
      return '';
      
    case 'email': {
      const emailStr = (valor ?? '').toString().trim();
      if (!emailStr) return 'El correo electrónico es obligatorio';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr))
        return 'Formato de correo electrónico inválido';
      return '';
    }
      
    case 'tipoVinc': {
      const tipoVincStr = (valor ?? '').toString().trim();
      if (!tipoVincStr) return 'El tipo de vinculación es obligatorio';
      if (tipoVincStr.length > 50) return 'El tipo de vinculación no puede exceder 50 caracteres';
      return '';
    }
      
    case 'registroPor': {
      const registroPorStr = (valor ?? '').toString().trim();
      if (!registroPorStr) return 'El registro realizado por es obligatorio';
      if (registroPorStr.length > 100) return 'El registro realizado por no puede exceder 100 caracteres';
      return '';
    }
      
    case 'observaciones':
      if (valor && !/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s#.,()-]{0,500}$/.test(valor.toString()))
        return 'Las observaciones exceden el límite de 500 caracteres';
      return '';
      
    default:
      return '';
  }
}

// ===== VALIDACIÓN DINÁMICA PARA SOLICITUD =====
validarCampoSolicitudEnTiempoReal(campo: string, event?: Event): void {
  void event;
  const valor = this.getValorSolicitud(campo);
  this.solicitudErrors[campo] = this.validarCampoSolicitudIndividual(campo, valor);
}

private getValorSolicitud(campo: string): any {
  switch (campo) {
    case 'consecutivo': return this.solicitudConsecutivo;
    case 'clienteId': return this.solicitudClienteId;
    case 'tipo': return this.solicitudTipo;
    case 'tipoAF': return this.solicitudTipoAfId;
    case 'nombre': return this.solicitudNombre;
    case 'lote': return this.solicitudLote;
    case 'fechaSolicitud': return this.solicitudFechaSolicitud;
    case 'fechaVenc': return this.solicitudFechaVenc;
    case 'tipoMuestra': return this.solicitudTipoMuestra;
    case 'condEmpaque': return this.solicitudCondEmpaque;
    case 'tipoAnalisis': return this.solicitudTipoAnalisis;
    case 'cantidad': return this.solicitudCantidad;
    case 'fechaEstimada': return this.solicitudFechaEstimada;
    case 'requiereVarios': return this.solicitudRequiereVarios;
    case 'solicitudRecibida': return this.solicitudRecibida;
    case 'recibePersonal': return this.solicitudRecibePersonal;
    case 'cargoPersonal': return this.solicitudCargoPersonal;
    case 'observaciones': return this.solicitudObservaciones;
    default: return '';
  }
}

private validarCampoSolicitudIndividual(campo: string, valor: any): string {
  switch (campo) {
    case 'consecutivo':
      if (!valor) return 'El consecutivo es obligatorio';
      return '';
      
    case 'clienteId':
      if (!valor) return 'Debe seleccionar un cliente';
      return '';
      
    case 'tipo':
      if (!valor) return 'Debe seleccionar el tipo de solicitud';
      return '';

    case 'tipoAF':
      if ((this.solicitudTipo || '').trim() !== 'AF') return '';
      if (!valor) return 'Debe seleccionar el tipo AF';
      return '';

    case 'nombre': {
      const nombreStr = (valor ?? '').toString().trim();
      if (!nombreStr) return 'El nombre de la muestra es obligatorio';
      if (!/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.-]{2,100}$/.test(nombreStr))
        return 'Nombre de muestra inválido (2-100 caracteres alfanuméricos)';
      return '';
    }

    case 'lote': {
      const loteStr = (valor ?? '').toString().trim();
      if (!loteStr) return 'El lote del producto es obligatorio';

      // Mismo patrón que la directiva (letras básicas, números, espacios y guiones)
      if (!/^[A-Za-z0-9 -]{3,20}$/.test(loteStr))
        return 'Formato de lote inválido (3-20 caracteres: letras, números, espacios y guiones)';
      return '';
    }

    case 'fechaSolicitud': {
      if (!valor) return 'La fecha de solicitud es obligatoria';
      const fechaSolicitud = new Date(valor);
      if (isNaN(fechaSolicitud.getTime())) return 'Fecha de solicitud inválida';
      const hoySolicitud = new Date();
      hoySolicitud.setHours(23, 59, 59, 999);
      if (fechaSolicitud > hoySolicitud) return 'La fecha de solicitud no puede ser futura';
      return '';
    }

    case 'fechaVenc': {
      if (!valor) return 'La fecha de vencimiento es obligatoria';
      const fechaVenc = new Date(valor);
      const hoyVenc = new Date();
      hoyVenc.setHours(0, 0, 0, 0);
      fechaVenc.setHours(0, 0, 0, 0);
      if (fechaVenc < hoyVenc) return 'La fecha de vencimiento no puede ser una fecha pasada';
      return '';
    }

    case 'tipoMuestra': {
      const tipoMuestraStr = (valor ?? '').toString().trim();
      if (!tipoMuestraStr) return 'El tipo de muestra es obligatorio';
      if (tipoMuestraStr.length > 50) return 'El tipo de muestra no puede exceder 50 caracteres';
      return '';
    }

    case 'condEmpaque': {
      const condEmpaqueStr = (valor ?? '').toString().trim();
      if (!condEmpaqueStr) return 'El tipo de empaque es obligatorio';
      if (condEmpaqueStr.length > 100) return 'El tipo de empaque no puede exceder 100 caracteres';
      return '';
    }
      
    case 'tipoAnalisis': {
      const tipoAnalisisStr = (valor ?? '').toString().trim();
      if (!tipoAnalisisStr) return 'El tipo de análisis requerido es obligatorio';
      if (tipoAnalisisStr.length > 100) return 'El tipo de análisis no puede exceder 100 caracteres';
      return '';
    }
      
    case 'cantidad':
      if (!valor && valor !== 0) return 'La cantidad de muestras es obligatoria';
      if (Number(valor) < 1 || Number(valor) > 1000)
        return 'La cantidad debe estar entre 1 y 1000 muestras';
      return '';

    case 'fechaEstimada': {
      if (!valor) return 'La fecha estimada de entrega es obligatoria';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return 'Formato de fecha inválido (AAAA-MM-DD)';
      }
      const partes = valor.split('-');
      const añoEstimado = parseInt(partes[0], 10);
      const mesEstimado = parseInt(partes[1], 10) - 1;
      const diaEstimado = parseInt(partes[2], 10);
      const fechaEstimada = new Date(añoEstimado, mesEstimado, diaEstimado);
      const hoy = new Date();
      const añoHoy = hoy.getFullYear();
      const mesHoy = hoy.getMonth();
      const diaHoy = hoy.getDate();
      const hoyMedianoche = new Date(añoHoy, mesHoy, diaHoy);
      if (fechaEstimada.getTime() < hoyMedianoche.getTime()) {
        return 'La fecha estimada no puede ser anterior a hoy';
      }
      const maxFecha = new Date(añoHoy + 1, mesHoy, diaHoy);
      if (fechaEstimada.getTime() > maxFecha.getTime()) {
        return 'La fecha estimada no puede ser mayor a 1 año';
      }
      return '';
    }
      
    case 'requiereVarios':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si requiere varios análisis';
      return '';
      
    case 'solicitudRecibida': {
      const solicitudRecibidaStr = (valor ?? '').toString().trim();
      if (!solicitudRecibidaStr) return 'Debe indicar cómo se recibió la solicitud';
      if (solicitudRecibidaStr.length > 255) return 'Máximo 255 caracteres';
      return '';
    }
      
    case 'recibePersonal': {
      const recibePersonalStr = (valor ?? '').toString().trim();
      if (!recibePersonalStr) return 'Debe indicar quién recibe la solicitud';
      if (recibePersonalStr.length > 255) return 'Máximo 255 caracteres';
      return '';
    }
      
    case 'cargoPersonal': {
      const cargoPersonalStr = (valor ?? '').toString().trim();
      if (!cargoPersonalStr) return 'Debe indicar el cargo del personal';
      if (cargoPersonalStr.length > 100) return 'Máximo 100 caracteres';
      return '';
    }
      
    case 'observaciones':
      if (valor && valor.toString().length > 5000)
        return 'Observaciones demasiado largas';
      return '';
      
    default:
      return '';
  }
}

// ===== VALIDACIÓN DINÁMICA PARA OFERTA =====
validarCampoOfertaEnTiempoReal(campo: string, event?: Event): void {
  void event;
  const valor = this.getValorOferta(campo);
  this.ofertaErrors[campo] = this.validarCampoOfertaIndividual(campo, valor);
}

private getValorOferta(campo: string): any {
  switch (campo) {
    case 'solicitudId': return this.ofertaSolicitudId;
    case 'valor': return this.ofertaValor;
    case 'fechaEnvio': return this.ofertaFechaEnvio;
    case 'generoCotizacion': return this.ofertaGeneroCotizacion;
    case 'realizoSeguimiento': return this.ofertaRealizoSeguimiento;
    case 'observacion': return this.ofertaObservacion;
    default: return '';
  }
}

private validarCampoOfertaIndividual(campo: string, valor: any): string {
  switch (campo) {
    case 'solicitudId':
      if (!valor) return 'Debe seleccionar una solicitud';
      return '';
      
    case 'valor':
      if (!valor && valor !== 0) return 'El valor de la oferta es obligatorio';
      if (Number(valor) <= 0) return 'El valor debe ser mayor a 0';
      if (Number(valor) > 1000000000) return 'El valor no puede exceder $1.000.000.000';
      return '';
      
    case 'fechaEnvio': {
      if (!valor) return 'La fecha de envío es obligatoria';
      const fechaEnvio = new Date(valor);
      const hoyEnvio = new Date();
      hoyEnvio.setHours(0, 0, 0, 0);
      if (fechaEnvio > hoyEnvio) return 'La fecha de envío no puede ser futura';
      return '';
    }
      
    case 'generoCotizacion':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si se generó cotización';
      return '';
      
    case 'realizoSeguimiento':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si se realizó seguimiento';
      return '';
      
    case 'observacion':
      if (valor && valor.toString().length > 200)
        return 'La observación no puede exceder 200 caracteres';
      return '';
      
    default:
      return '';
  }
}

// ===== VALIDACIÓN DINÁMICA PARA RESULTADO/REVISIÓN =====
  validarCampoResultadoEnTiempoReal(campo: string, event?: Event): void {
    void event;
    const valor = this.getValorResultado(campo);
    this.resultadoErrors[campo] = this.validarCampoResultadoIndividual(campo, valor);
  }

private getValorResultado(campo: string): any {
  switch (campo) {
    case 'solicitudId': return this.resultadoSolicitudId;
    case 'fechaLimite': return this.resultadoFechaLimite;
    case 'tipoMuestraEspecificado': return this.resultadoTipoMuestraEspecificado;
    case 'ensayosClaros': return this.resultadoEnsayosClaros;
    case 'equiposCalibrados': return this.resultadoEquiposCalibrados;
    case 'personalCompetente': return this.resultadoPersonalCompetente;
    case 'infraestructuraAdecuada': return this.resultadoInfraestructuraAdecuada;
    case 'insumosVigentes': return this.resultadoInsumosVigentes;
    case 'cumpleTiempos': return this.resultadoCumpleTiempos;
    case 'normasMetodos': return this.resultadoNormasMetodos;
    case 'metodoValidado': return this.resultadoMetodoValidado;
    case 'metodoAdecuado': return this.resultadoMetodoAdecuado;
    case 'observacionesTecnicas': return this.resultadoObservacionesTecnicas;
    case 'conceptoFinal': return this.resultadoConceptoFinal;
    default: return '';
  }
}

private validarCampoResultadoIndividual(campo: string, valor: any): string {
  switch (campo) {
    case 'solicitudId':
      if (!valor) return 'Debe seleccionar una solicitud';
      return '';
      
    case 'fechaLimite': {
      // Solo es obligatoria si la solicitud es viable
      if (this.resultadoConceptoFinal !== 'SOLICITUD_VIABLE' && this.resultadoConceptoFinal !== 'SOLICITUD_VIABLE_CON_OBSERVACIONES') return '';
      
      if (!valor) return 'La fecha límite es obligatoria';
      const fechaLimite = new Date(valor);
      const hoyLimite = new Date();
      hoyLimite.setHours(0, 0, 0, 0);
      if (fechaLimite < hoyLimite) return 'La fecha límite no puede ser anterior a hoy';
      return '';
    }
      
    case 'tipoMuestraEspecificado':
      if (!valor) return 'Debe indicar si el tipo de muestra fue especificado';
      return '';

    case 'ensayosClaros':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si los ensayos requeridos son claros';
      return '';

    case 'equiposCalibrados':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si los equipos están calibrados';
      return '';

    case 'personalCompetente':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si el personal es competente';
      return '';

    case 'infraestructuraAdecuada':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si la infraestructura es adecuada';
      return '';

    case 'insumosVigentes':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si los insumos están vigentes';
      return '';

    case 'cumpleTiempos':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si se cumplen los tiempos de entrega';
      return '';

    case 'normasMetodos':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si las normas y métodos están especificados';
      return '';

    case 'metodoValidado':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si el método fue validado/verificado';
      return '';

    case 'metodoAdecuado':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si el método es adecuado';
      return '';

    case 'observacionesTecnicas':
      if (valor && valor.toString().length > 1000)
        return 'Las observaciones no pueden exceder 1000 caracteres';
      return '';

    case 'conceptoFinal':
      if (!valor) return 'Debe seleccionar el concepto final';
      return '';
      
    default:
      return '';
  }
}

// ===== VALIDACIÓN DINÁMICA PARA ENCUESTA =====
validarCampoEncuestaEnTiempoReal(campo: string, event?: Event): void {
  void event;
  const valor = this.getValorEncuesta(campo);
  this.encuestaErrors[campo] = this.validarCampoEncuestaIndividual(campo, valor);
}

private getValorEncuesta(campo: string): any {
    switch (campo) {
      case 'solicitudId': return this.encuestaSolicitudId;
      case 'fecha': return this.encuestaFecha;
      // case 'recomendaria': return this.encuestaRecomendaria;
      case 'fechaRealizacion': return this.encuestaFechaRealizacion;
      case 'clienteRespondio': return this.encuestaClienteRespondio;
      case 'solicitoNueva': return this.encuestaSolicitoNueva;
      case 'comentarios': return this.encuestaComentarios;
      default: return '';
    }
  }

  private validarCampoEncuestaIndividual(campo: string, valor: any): string {
    switch (campo) {

      case 'fechaRealizacion': {
        // Solo obligatorio si clienteRespondio es true
        if (this.encuestaClienteRespondio !== true) {
          return ''; // No es obligatorio si el cliente no respondió
        }

        if (!valor) {
          return 'La fecha de realización es obligatoria cuando el cliente respondió';
        }

        // Validar formato básico
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
          return 'Formato de fecha inválido (AAAA-MM-DD)';
        }

        // Validar que sea una fecha válida
        const fechaRealizacion = new Date(valor);
        if (isNaN(fechaRealizacion.getTime())) {
          return 'Fecha inválida';
        }

        return '';
      }


      case 'solicitudId':
        if (!valor) return 'Debe seleccionar una solicitud';
        return '';

      case 'fecha': {
        if (!valor) return 'La fecha de la encuesta es obligatoria';

  // Validar formato
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor))
          return 'Formato de fecha inválido (AAAA-MM-DD)';

        const fechaEncuesta = new Date(valor);
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        mañana.setHours(0, 0, 0, 0);

        fechaEncuesta.setHours(0, 0, 0, 0);

        if (isNaN(fechaEncuesta.getTime())) {
          return 'Fecha inválida';
        }

        // DEBE SER FUTURA: fecha >= mañana (no hoy, no pasadas)
        if (fechaEncuesta < mañana) {
          return 'La fecha de envío debe ser futura (mañana en adelante)';
        }

        return '';
      }

    // case 'recomendaria':
    //   if (valor === '' || valor === null || valor === undefined)
    //     return 'Debe indicar si recomendaría el servicio';
    //   return '';
      
    case 'clienteRespondio':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si el cliente respondió';
      return '';
      
    case 'solicitoNueva':
      if (valor === '' || valor === null || valor === undefined)
        return 'Debe indicar si se solicitó nueva encuesta';
      return '';
      
    case 'comentarios':
      if (valor && valor.toString().length > 1000)
        return 'Los comentarios no pueden exceder 1000 caracteres';
      return '';
      
    default:
      return '';
  }
}

  // ========== OPERACIONES CRUD ==========
  private findClienteById(id: any): any | null {
    const nid = Number(id);
    if (!Number.isFinite(nid) || nid <= 0) return null;
    return (this.clientes() || []).find((c: any) => Number(c?.id_cliente ?? c?.cliente_id ?? c?.id) === nid) ?? null;
  }

  private findSolicitudById(id: any): any | null {
    const nid = Number(id);
    if (!Number.isFinite(nid) || nid <= 0) return null;
    return (this.solicitudes() || []).find((s: any) => Number(s?.solicitud_id ?? s?.id_solicitud ?? s?.id) === nid) ?? null;
  }

  private createClienteLogDetalle(id: any, cliente: any, body: any): any {
    const base = { ...(cliente && typeof cliente === 'object' ? cliente : {}), ...(body && typeof body === 'object' ? body : {}) };
    return {
      id,
      cliente_id: id,
      nombre_solicitante: base?.nombre_solicitante ?? null,
      razon_social: base?.razon_social ?? null,
      numero_identificacion: base?.numero_identificacion ?? null,
      nit: base?.nit ?? null,
      correo_electronico: base?.correo_electronico ?? null,
      ...base
    };
  }

  private createSolicitudLogDetalle(id: any, solicitud: any, body: any, cliente: any): any {
    const base = { ...(solicitud && typeof solicitud === 'object' ? solicitud : {}), ...(body && typeof body === 'object' ? body : {}) };
    const c = cliente && typeof cliente === 'object' ? cliente : null;
    return {
      id,
      solicitud_id: id,
      id_solicitud: id,
      id_cliente: base?.id_cliente ?? c?.id_cliente ?? null,
      nombre_muestra: base?.nombre_muestra ?? null,
      nombre_solicitante: base?.nombre_solicitante ?? c?.nombre_solicitante ?? null,
      razon_social: base?.razon_social ?? c?.razon_social ?? null,
      correo_electronico: base?.correo_electronico ?? c?.correo_electronico ?? null,
      tipo_solicitud: base?.tipo_solicitud ?? null,
      ...base
    };
  }

  async createCliente(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.validarCliente()) {
      this.snackbarService.warn('Por favor corrige los errores en el formulario de cliente');
      return;
    }

    const permError = this.utilsService.getOperationErrorMessage('crear');
    if (permError) {
      this.snackbarService.error(`No puedes crear clientes: ${permError}`);
      return;
    }

    try {
      const payload: any = {
        nombre_solicitante: this.clienteNombre,
        fecha_vinculacion: this.clienteFechaVinc,
        tipo_usuario: this.clienteTipoUsuario,
        razon_social: this.clienteRazonSocial,
        nit: this.clienteNit,
        tipo_identificacion: this.clienteTipoId,
        numero_identificacion: this.clienteIdNum,
        sexo: this.clienteSexo,
        tipo_poblacion: this.clienteTipoPobl,
        direccion: this.clienteDireccion,
        id_ciudad: this.clienteIdCiudad,
        id_departamento: this.clienteIdDepartamento,
        celular: this.clienteCelular,
        telefono: this.clienteTelefono,
        correo_electronico: this.clienteEmail,
        tipo_vinculacion: this.clienteTipoVinc,
        registro_realizado_por: this.clienteRegistroPor,
        observaciones: this.clienteObservaciones,
        numero: this.clienteNumero
      };

      await this.clientesService.createCliente(payload);

      this.snackbarService.success('✅ Cliente creado exitosamente');
      this.clienteErrors = {};

      const created =
        (this.clientes() || []).find((c: any) => {
          const idn = (payload?.numero_identificacion || '').toString().trim();
          const nit = (payload?.nit || '').toString().trim();
          const email = (payload?.correo_electronico || '').toString().trim();
          if (idn && String(c?.numero_identificacion || '').trim() === idn) return true;
          if (nit && String(c?.nit || '').trim() === nit) return true;
          if (email && String(c?.correo_electronico || '').trim() === email) return true;
          return false;
        }) ?? null;
      const createdId = Number(created?.id_cliente ?? created?.cliente_id ?? created?.id ?? 0) || null;
      const detalle = this.createClienteLogDetalle(createdId ?? payload?.numero ?? payload?.numero_identificacion ?? null, created, payload);
      logsService.crearLogAccion({
        modulo: 'CLIENTES',
        accion: 'CREAR',
        descripcion: `Creación de cliente: ${detalle?.id ?? ''}`.trim(),
        detalle
      }).catch(console.error);

      this.limpiarFormularioCliente();
      this.computeNextClienteNumero();

    } catch (err: any) {
      console.error('Error creating cliente:', err);
      this.manejarError(err, 'crear cliente');
    }
  }

  async createSolicitud(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.validarSolicitud()) {
      this.snackbarService.warn('Por favor corrige los errores en el formulario de solicitud');
      return;
    }

    const permError = this.utilsService.getOperationErrorMessage('crear');
    if (permError) {
      this.snackbarService.error(`No puedes crear solicitudes: ${permError}`);
      return;
    }

    try {
      const body: any = {
        solicitud_id: this.solicitudConsecutivo ?? null,
        id_cliente: this.solicitudClienteId,
        id_admin: this.solicitudAdminId ?? null,
        tipo_solicitud: this.solicitudTipo,
        id_tipo_af: (this.solicitudTipo || '').trim() === 'AF' ? (this.solicitudTipoAfId ?? null) : null,
        nombre_muestra: this.solicitudNombre,
        lote_producto: this.solicitudLote || null,
        fecha_solicitud: this.solicitudFechaSolicitud || null,
        fecha_vencimiento_muestra: this.solicitudFechaVenc || null,
        tipo_muestra: this.solicitudTipoMuestra || null,
        tipo_empaque: this.solicitudCondEmpaque || null,
        analisis_requerido: this.solicitudTipoAnalisis || null,
        req_analisis: this.solicitudRequiereVarios ? 1 : 0,
        cant_muestras: this.solicitudCantidad || null,
        fecha_entrega_muestra: this.solicitudFechaEstimada || null,
        solicitud_recibida: this.solicitudRecibida || (this.solicitudPuedeSuministrar ? 'Sí' : 'No'),
        recibe_personal: this.solicitudRecibePersonal || null,
        cargo_personal: this.solicitudCargoPersonal || null,
        observaciones: this.solicitudObservaciones || null
      };

      const nuevo: any = await this.solicitudesService.createSolicitud(body);

      this.snackbarService.success('✅ Solicitud creada exitosamente');
      this.solicitudErrors = {};

      this.limpiarFormularioSolicitud();

      // Reload solicitudes from server to get canonical IDs and joined data
      await this.loadSolicitudes();
      // Ensure consecutivo is recalculated after the fresh data is loaded
      try { this.computeNextSolicitudConsecutivo(); } catch (e) { console.warn('Error computing consecutivo after createSolicitud load', e); }
      // Try to locate the created solicitud. Prefer ID from response, otherwise match by client + nombre_muestra + fecha_solicitud
      let created = null;
      const nidFromResp = Number(nuevo?.solicitud_id ?? nuevo?.id_solicitud ?? nuevo?.id ?? nuevo?.insertId ?? 0);
      if (nidFromResp) {
        created = (this.solicitudes() || []).find(s => Number(s.solicitud_id) === nidFromResp);
      }
      if (!created) {
        const candidates = (this.solicitudes() || []).filter(s => {
          return Number(s?.id_cliente ?? 0) === Number(body?.id_cliente ?? 0) &&
                 (String(s?.nombre_muestra ?? '').trim() === String(body?.nombre_muestra ?? '').trim());
        });
        if (candidates.length) {
          // pick the one with highest solicitud_id
          created = candidates.reduce((a, b) => (Number(a.solicitud_id || 0) > Number(b.solicitud_id || 0) ? a : b));
        }
      }

      // Update filtered list and expand created card
      this.filtrarSolicitudes();
      if (created) {
        const nid = Number(created.solicitud_id || created.id_solicitud || 0);
        if (nid) {
          this.solicitudExpandida = nid;
          this.activeSolicitudTab[nid] = 'detalle';
        }
      }

      const sid = Number(created?.solicitud_id ?? created?.id_solicitud ?? nuevo?.solicitud_id ?? nuevo?.id_solicitud ?? body?.solicitud_id ?? 0) || null;
      const cliente = this.findClienteById(body?.id_cliente);
      const detalle = this.createSolicitudLogDetalle(sid ?? body?.solicitud_id ?? null, created, body, cliente);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'CREAR',
        descripcion: `Creación de solicitud: ${detalle?.id ?? ''}`.trim(),
        detalle
      }).catch(console.error);

    } catch (err: any) {
      console.error('Error creating solicitud:', err);
      this.manejarError(err, 'crear solicitud');
    }
  }

  async createOferta(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.validarOferta()) {
      this.snackbarService.warn('Por favor corrige los errores en el formulario de oferta');
      return;
    }

    const permError = this.utilsService.getOperationErrorMessage('crear');
    if (permError) {
      this.snackbarService.error(`No puedes crear ofertas: ${permError}`);
      return;
    }

    try {
      const body = {
        genero_cotizacion: this.ofertaGeneroCotizacion ? 1 : 0,
        valor_cotizacion: this.ofertaValor,
        fecha_envio_oferta: this.ofertaFechaEnvio,
        realizo_seguimiento_oferta: this.ofertaRealizoSeguimiento ? 1 : 0,
        observacion_oferta: this.ofertaObservacion || null
      };

      const ofertaId = Number(this.ofertaSolicitudId);
      if (isNaN(ofertaId) || ofertaId <= 0) {
        this.snackbarService.warn('Selecciona una solicitud válida antes de registrar la oferta');
        return;
      }

      await this.solicitudesService.upsertOferta(ofertaId, body);

      this.snackbarService.success('✅ Oferta registrada exitosamente');
      this.ofertaErrors = {};

      const s = this.findSolicitudById(ofertaId);
      const c = this.findClienteById(s?.id_cliente);
      const detalle = this.createSolicitudLogDetalle(ofertaId, s, { ...body }, c);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de oferta de solicitud: ${ofertaId}`,
        detalle
      }).catch(console.error);

      this.limpiarFormularioOferta();

      // Refresh the single solicitud from DB so the card updates immediately
      let updated: any = null;
      try {
        updated = await this.solicitudesService.getSolicitudDetalleById(ofertaId);
      } catch (err) {
        console.warn('No se pudo refrescar detalle de oferta', err);
      }
      this.filtrarSolicitudes();
      const created = updated || (this.solicitudes() || []).find(s => Number(s.solicitud_id) === Number(ofertaId));
      if (created) {
        const nid = Number(created.solicitud_id || created.id_solicitud || 0);
        if (nid) {
          this.solicitudExpandida = nid;
          this.activeSolicitudTab[nid] = 'oferta';
          this.selectedSolicitud.set(created);
        }
      }

    } catch (err: any) {
      console.error('Error creating oferta:', err);
      this.manejarError(err, 'crear oferta');
    }
  }

  async createResultado(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.validarResultado()) {
      this.snackbarService.warn('Por favor corrige los errores en el formulario de resultados');
      return;
    }

    const permError = this.utilsService.getOperationErrorMessage('crear');
    if (permError) {
      this.snackbarService.error(`No puedes registrar resultados: ${permError}`);
      return;
    }

    try {
      const body = {
        fecha_limite_entrega: this.resultadoFechaLimite,
        tipo_muestra_especificado: this.resultadoTipoMuestraEspecificado,
        ensayos_requeridos_claros: this.resultadoEnsayosClaros === null ? null : (this.resultadoEnsayosClaros ? 1 : 0),
        equipos_calibrados: this.resultadoEquiposCalibrados === null ? null : (this.resultadoEquiposCalibrados ? 1 : 0),
        personal_competente: this.resultadoPersonalCompetente === null ? null : (this.resultadoPersonalCompetente ? 1 : 0),
        infraestructura_adecuada: this.resultadoInfraestructuraAdecuada === null ? null : (this.resultadoInfraestructuraAdecuada ? 1 : 0),
        insumos_vigentes: this.resultadoInsumosVigentes === null ? null : (this.resultadoInsumosVigentes ? 1 : 0),
        cumple_tiempos_entrega: this.resultadoCumpleTiempos === null ? null : (this.resultadoCumpleTiempos ? 1 : 0),
        normas_metodos_especificados: this.resultadoNormasMetodos === null ? null : (this.resultadoNormasMetodos ? 1 : 0),
        metodo_validado_verificado: this.resultadoMetodoValidado === null ? null : (this.resultadoMetodoValidado ? 1 : 0),
        metodo_adecuado: this.resultadoMetodoAdecuado === null ? null : (this.resultadoMetodoAdecuado ? 1 : 0),
        observaciones_tecnicas: this.resultadoObservacionesTecnicas || null,
        concepto_final: this.resultadoConceptoFinal
      };

      const sid = Number(this.resultadoSolicitudId);
      await this.solicitudesService.upsertRevision(sid, body);

      this.snackbarService.success('✅ Resultados registrados exitosamente');
      this.resultadoErrors = {};

      const target = this.findSolicitudById(sid);
      if (target) {
        target.fecha_limite_entrega = body.fecha_limite_entrega || null;
        target.tipo_muestra_especificado = body.tipo_muestra_especificado || null;
        target.ensayos_requeridos_claros = body.ensayos_requeridos_claros === null ? null : Boolean(body.ensayos_requeridos_claros);
        target.equipos_calibrados = body.equipos_calibrados === null ? null : Boolean(body.equipos_calibrados);
        target.personal_competente = body.personal_competente === null ? null : Boolean(body.personal_competente);
        target.infraestructura_adecuada = body.infraestructura_adecuada === null ? null : Boolean(body.infraestructura_adecuada);
        target.insumos_vigentes = body.insumos_vigentes === null ? null : Boolean(body.insumos_vigentes);
        target.cumple_tiempos_entrega = body.cumple_tiempos_entrega === null ? null : Boolean(body.cumple_tiempos_entrega);
        target.normas_metodos_especificados = body.normas_metodos_especificados === null ? null : Boolean(body.normas_metodos_especificados);
        target.metodo_validado_verificado = body.metodo_validado_verificado === null ? null : Boolean(body.metodo_validado_verificado);
        target.metodo_adecuado = body.metodo_adecuado === null ? null : Boolean(body.metodo_adecuado);
        target.observaciones_tecnicas = body.observaciones_tecnicas || null;
        target.concepto_final = body.concepto_final || null;
      }

      // Optimistic: marcar estado como EVALUADA cuando se completa la revision
      const evaluada = (this.estadosSolicitud || []).find((e: any) =>
        String(e?.nombre_estado || e?.nombre || '').toUpperCase().includes('EVALUAD')
      );
      if (evaluada) {
        const target = this.findSolicitudById(sid);
        if (target) {
          target.id_estado = Number(evaluada.id_estado);
          target.nombre_estado = evaluada.nombre_estado || evaluada.nombre;
        }
      }

      const s = this.findSolicitudById(sid);
      const c = this.findClienteById(s?.id_cliente);
      const detalle = this.createSolicitudLogDetalle(sid, s, { ...body }, c);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de revisión de solicitud: ${sid}`,
        detalle
      }).catch(console.error);

      // Keep card state stable after submit (avoid temporary overwrite with partial payloads)
      if (sid) {
        this.activeSolicitudTab[sid] = 'revision';
        this.solicitudExpandida = sid;
        this.filtrarSolicitudes();
        const current = this.findSolicitudById(sid);
        if (current) this.selectedSolicitud.set(current);
      }

      this.revisionLocked = true;
      this.limpiarFormularioResultado();

    } catch (err: any) {
      console.error('Error creating resultado:', err);
      this.manejarError(err, 'registrar resultados');
    }
  }

  async createEncuesta(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.validarEncuesta()) {
      this.snackbarService.warn('Por favor corrige los errores en el formulario de encuesta');
      return;
    }

    const permError = this.utilsService.getOperationErrorMessage('crear');
    if (permError) {
      this.snackbarService.error(`No puedes crear encuestas: ${permError}`);
      return;
    }

    try {
      const body = {
        fecha_encuesta: this.encuestaFecha,
        comentarios: this.encuestaComentarios || null,
        // recomendaria_servicio: this.encuestaRecomendaria,
        fecha_realizacion_encuesta: this.encuestaFechaRealizacion || null,
        cliente_respondio: this.encuestaClienteRespondio,
        solicito_nueva_encuesta: this.encuestaSolicitoNueva
      };

      const sid = Number(this.encuestaSolicitudId);
      await this.solicitudesService.upsertSeguimientoEncuesta(sid, body);

      this.snackbarService.success('✅ Encuesta registrada exitosamente');
      this.encuestaErrors = {};

      const s = this.findSolicitudById(sid);
      const c = this.findClienteById(s?.id_cliente);
      const detalle = this.createSolicitudLogDetalle(sid, s, { ...body }, c);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'CREAR_ENCUESTA',
        descripcion: `Registro de encuesta para solicitud: ${sid}`,
        detalle
      }).catch(console.error);

      // Refresh the single solicitud so tabs show updated data
      let updated: any = null;
      try {
        updated = await this.solicitudesService.getSolicitudDetalleById(sid);
      } catch (err) {
        console.warn('No se pudo refrescar detalle de encuesta', err);
      }

      if (sid) {
        this.activeSolicitudTab[sid] = 'encuesta';
        this.solicitudExpandida = sid;
        this.filtrarSolicitudes();
        if (updated) this.selectedSolicitud.set(updated);
      }

      this.limpiarFormularioEncuesta();

    } catch (err: any) {
      console.error('Error creating encuesta:', err);
      this.manejarError(err, 'crear encuesta');
    }
  }

  async deleteCliente(id: number): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar cliente',
      message: '¿Estás seguro de que quieres eliminar este cliente?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    
    if (!this.canDelete()) {
      const errorMsg = this.utilsService.getDeleteErrorMessage();
      this.snackbarService.error(`❌ No puedes eliminar clientes: ${errorMsg}`);
      return;
    }

    try {
      const cliente = this.findClienteById(id);
      await this.clientesService.deleteCliente(id);
      this.snackbarService.success('✅ Cliente eliminado exitosamente');
      const detalle = this.createClienteLogDetalle(id, cliente, null);
      logsService.crearLogAccion({
        modulo: 'CLIENTES',
        accion: 'ELIMINAR',
        descripcion: `Eliminación de cliente: ${id}`,
        detalle
      }).catch(console.error);
      try {
        const next = this.clientesFiltrados().filter(c => Number(c.id_cliente || c.id || c.cliente_id) !== Number(id));
        this.clientesFiltrados.set(next);
      } catch (e) { console.warn('Error actualizando clientesFiltrados tras deleteCliente', e); }
    } catch (err: any) {
      console.error('deleteCliente', err);
      this.manejarError(err, 'eliminar cliente');
    }
  }

  async deleteSolicitud(id: number): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar solicitud',
      message: '¿Estás seguro de que quieres eliminar esta solicitud?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    
    if (!this.canEditOrDeleteSolicitud()) {
      this.snackbarService.error('❌ No puedes eliminar solicitudes con rol Administrador.');
      return;
    }

    try {
      const solicitud = this.findSolicitudById(id);
      const cliente = this.findClienteById(solicitud?.id_cliente);
      await this.solicitudesService.deleteSolicitud(id);
      this.snackbarService.success('✅ Solicitud eliminada exitosamente');
      const detalle = this.createSolicitudLogDetalle(id, solicitud, null, cliente);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'ELIMINAR',
        descripcion: `Eliminación de solicitud: ${id}`,
        detalle
      }).catch(console.error);
      try {
        const next = this.solicitudesFiltradas().filter(s => Number(s.solicitud_id || s.id_solicitud || s.id) !== Number(id));
        this.solicitudesFiltradas.set(next);
      } catch (e) { console.warn('Error actualizando solicitudesFiltradas tras deleteSolicitud', e); }
      try { this.computeNextSolicitudConsecutivo(); } catch (e) { console.warn('Error computing consecutivo after delete', e); }
    } catch (err: any) {
      console.error('deleteSolicitud', err);
      this.manejarError(err, 'eliminar solicitud');
    }
  }

  // ========== MÉTODOS AUXILIARES PARA MANEJO DE ERRORES ==========
  private manejarError(err: any, operacion: string): void {
    const errorMessage = err.message || err.toString();
    
    if (errorMessage.includes('No autorizado') || errorMessage.includes('401')) {
      this.snackbarService.error(`🔐 Sesión expirada. Por favor, inicia sesión nuevamente.`);
      setTimeout(() => {
        authService.logout();
        window.location.href = '/login';
      }, 3000);
    } 
    else if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch')) {
      this.snackbarService.error('🌐 Error de conexión. Verifica tu internet e intenta nuevamente.');
    }
    else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      this.snackbarService.error('⚙️ Error del servidor. Por favor, contacta al administrador.');
    }
    else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      this.snackbarService.error('🔍 Recurso no encontrado. Puede que ya haya sido eliminado.');
    }
    else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
      this.snackbarService.error('⚠️ Conflicto: El registro ya existe o tiene datos duplicados.');
    }
    else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      this.snackbarService.error('🚫 No tienes permisos para realizar esta acción.');
    }
    else if (errorMessage.includes('Validation failed') || errorMessage.includes('validation')) {
      this.snackbarService.error('📝 Error de validación: Verifica los datos ingresados.');
    }
    else {
      this.snackbarService.error(`❌ Error al ${operacion}: ${this.obtenerMensajeAmigable(errorMessage)}`);
    }
  }

  private obtenerMensajeAmigable(mensaje: string): string {
    const mensajesAmigables: Record<string, string> = {
      'duplicate key': 'Ya existe un registro con estos datos',
      'foreign key constraint': 'No se puede eliminar porque tiene registros relacionados', 
      'required field': 'Faltan campos obligatorios',
      'invalid date': 'Fecha inválida',
      'invalid email': 'Correo electrónico inválido',
      'connection refused': 'No se puede conectar al servidor'
    };

    for (const [key, value] of Object.entries(mensajesAmigables)) {
      if (mensaje.toLowerCase().includes(key)) {
        return value;
      }
    }

    return mensaje.length > 100 ? 'Error del sistema. Contacta al administrador.' : mensaje;
  }

  // ========== MÉTODOS PARA LIMPIAR FORMULARIOS ==========
  private limpiarFormularioCliente(): void {
    this.clienteNombre = this.clienteIdNum = this.clienteEmail = '';
    this.clienteNumero = null;
    this.clienteFechaVinc = '';
    this.clienteTipoUsuario = '';
    this.clienteRazonSocial = '';
    this.clienteNit = '';
    this.clienteTipoId = '';
    this.clienteSexo = 'Otro';
    this.clienteTipoPobl = '';
    this.clienteDireccion = '';
    this.clienteIdCiudad = '';
    this.clienteIdDepartamento = '';
    this.clienteCelular = '';
    this.clienteTelefono = '';
    this.clienteTipoVinc = '';
    this.clienteRegistroPor = '';
    this.clienteObservaciones = '';
  }

  private limpiarFormularioSolicitud(): void {
    // Reset to empty string so the <select> shows the placeholder option (value="").
    this.solicitudClienteId = '';
    this.solicitudNombre = '';
    this.solicitudTipo = '';
    this.solicitudTipoAfId = null;
    this.solicitudLote = '';
    this.solicitudFechaVenc = '';
    this.solicitudFechaSolicitud = '';
    this.solicitudTipoMuestra = '';
    this.solicitudCondEmpaque = '';
    this.solicitudTipoAnalisis = '';
    this.solicitudRequiereVarios = null;
    this.solicitudCantidad = null;
    this.solicitudFechaEstimada = '';
    this.solicitudPuedeSuministrar = false;
    this.solicitudServicioViable = false;
    this.solicitudRecibida = '';
    this.solicitudRecibePersonal = '';
    this.solicitudCargoPersonal = '';
    this.solicitudObservaciones = '';
    this.solicitudAdminId = null;
    this.computeNextSolicitudConsecutivo();
  }

  private limpiarFormularioOferta(): void {
    this.ofertaSolicitudId = null;
    this.ofertaGeneroCotizacion = null;
    this.ofertaValor = null;
    this.ofertaFechaEnvio = '';
    this.ofertaRealizoSeguimiento = null;
    this.ofertaObservacion = '';
    this.ofertaValorDisplay = '';
  }

  private limpiarFormularioResultado(): void {
    this.resultadoSolicitudId = null;
    this.resultadoFechaLimite = '';
    this.resultadoServicioViable = null;
    this.resultadoTipoMuestraEspecificado = null;
    this.resultadoEnsayosClaros = null;
    this.resultadoEquiposCalibrados = null;
    this.resultadoPersonalCompetente = null;
    this.resultadoInfraestructuraAdecuada = null;
    this.resultadoInsumosVigentes = null;
    this.resultadoCumpleTiempos = null;
    this.resultadoNormasMetodos = null;
    this.resultadoMetodoValidado = null;
    this.resultadoMetodoAdecuado = null;
    this.resultadoObservacionesTecnicas = '';
    this.resultadoConceptoFinal = null;
  }

  private limpiarFormularioEncuesta(): void {
    this.encuestaSolicitudId = null;
    this.encuestaFecha = '';
    this.encuestaPuntuacion = null;
    this.encuestaComentarios = '';
    // this.encuestaRecomendaria = false;
    this.encuestaFechaRealizacion = '';
    this.encuestaClienteRespondio = null;
    this.encuestaSolicitoNueva = null;
  }

  // ========== MÉTODOS UI ==========
  canEditSolicitudEstado(): boolean {
    const u = this.user();
    const raw = String((u as any)?.rol_nombre || u?.rol || '').trim().toLowerCase();
    const normalized = raw.replace(/\s+/g, '');
    return normalized === 'administrador' || normalized === 'superadmin';
  }

  canViewSolicitudSelects(): boolean {
    const u = this.user();
    const raw = String((u as any)?.rol_nombre || u?.rol || '').trim().toLowerCase();
    const normalized = raw.replace(/\s+/g, '');
    return normalized === 'administrador' || normalized === 'superadmin';
  }

  canInteractSolicitudSelects(): boolean {
    const u = this.user();
    const raw = String((u as any)?.rol_nombre || u?.rol || '').trim().toLowerCase();
    const normalized = raw.replace(/\s+/g, '');
    return normalized === 'superadmin';
  }

  setSolicitudEstadoPrev(s: any): void {
    s._estadoPrev = s?._estadoDraft ?? s?.id_estado ?? null;
  }

  setSolicitudAsignacionPrev(s: any): void {
    s._adminPrev = s?._adminDraft ?? s?.id_admin ?? null;
  }

  formatEstadoLabel(value: any): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/_/g, ' ');
  }

  formatAdminLabel(admin: any): string {
    const nombre = String(admin?.nombre_usuario || admin?.nombre || '').trim();
    if (nombre) return nombre;
    const email = String(admin?.email || '').trim();
    if (!email) return '';
    return email.split('@')[0] || email;
  }

  getSolicitudAdminLabel(s: any): string {
    const email = String(s?.admin_email || '').trim();
    if (email) return email;
    const id = s?.id_admin ?? null;
    if (id && Array.isArray(this.adminUsuarios) && this.adminUsuarios.length) {
      const admin = this.adminUsuarios.find((u: any) => Number(u?.id_usuario) === Number(id));
      const label = this.formatAdminLabel(admin);
      if (label) return label;
    }
    return 'Sin asignar';
  }

  private normalizeConceptoFinalValue(value: any): string | null {
    const raw = String(value ?? '').trim().toUpperCase();
    if (!raw) return null;
    if (raw === '1') return 'SOLICITUD_VIABLE';
    if (raw === '0') return 'SOLICITUD_NO_VIABLE';
    if (raw.includes('PENDIENT')) return 'PENDIENTE';
    if (raw === 'SOLICITUD_VIABLE_CON_OBSERVACIONES') return 'SOLICITUD_VIABLE_CON_OBSERVACIONES';
    if (raw.includes('OBSERV')) return 'SOLICITUD_VIABLE_CON_OBSERVACIONES';
    if (raw === 'SOLICITUD_VIABLE' || raw === 'VIABLE' || raw === 'SI' || raw === 'TRUE') return 'SOLICITUD_VIABLE';
    if (raw === 'SOLICITUD_NO_VIABLE' || raw === 'NO VIABLE' || raw === 'NOVIABLE' || raw === 'NO' || raw === 'FALSE')
      return 'SOLICITUD_NO_VIABLE';
    if (raw.includes('NO') && raw.includes('VIABLE')) return 'SOLICITUD_NO_VIABLE';
    if (raw.includes('VIABLE')) return 'SOLICITUD_VIABLE';
    return null;
  }

  getConceptoFinalValue(s: any): string | null {
    const rawConcepto =
      s?.concepto_final ??
      s?.conceptoFinal ??
      s?.revision?.concepto_final ??
      s?.revision?.conceptoFinal ??
      s?.revision_oferta?.concepto_final ??
      s?.revision_oferta?.conceptoFinal ??
      s?.revisionOferta?.concepto_final ??
      s?.revisionOferta?.conceptoFinal ??
      null;
    const fromConcepto = this.normalizeConceptoFinalValue(rawConcepto);
    if (fromConcepto) return fromConcepto;
    return null;
  }

  getEstadoFiltroValue(s: any): 'espera' | 'evaluacion' | 'evaluada' | null {
    const raw = String(s?.nombre_estado || s?.estado || s?.estado_solicitud || '').trim().toUpperCase();
    if (!raw) return null;
    if (raw.includes('ESPERA')) return 'espera';
    if (raw.includes('EVALUACION') || raw.includes('EVALUAR')) return 'evaluacion';
    if (raw.includes('EVALUAD')) return 'evaluada';
    return null;
  }

  getConceptoFinalLabel(value: any): string {
    const normalized = this.normalizeConceptoFinalValue(value);
    if (normalized === 'SOLICITUD_VIABLE') return 'Viable';
    if (normalized === 'SOLICITUD_VIABLE_CON_OBSERVACIONES') return 'Viable con observaciones';
    if (normalized === 'SOLICITUD_NO_VIABLE') return 'No viable';
    if (normalized === 'PENDIENTE') return 'Pendiente';
    return '';
  }

  getConceptoFinalClass(value: any): string {
    const normalized = this.normalizeConceptoFinalValue(value);
    if (normalized === 'SOLICITUD_VIABLE') return 'revision-viable';
    if (normalized === 'SOLICITUD_VIABLE_CON_OBSERVACIONES') return 'revision-observaciones';
    if (normalized === 'SOLICITUD_NO_VIABLE') return 'revision-no-viable';
    if (normalized === 'PENDIENTE') return 'revision-pendiente';
    return '';
  }

  getConceptoFinalIcon(value: any): string {
    const normalized = this.normalizeConceptoFinalValue(value);
    if (normalized === 'SOLICITUD_VIABLE') return 'fa-circle-check';
    if (normalized === 'SOLICITUD_VIABLE_CON_OBSERVACIONES') return 'fa-triangle-exclamation';
    if (normalized === 'SOLICITUD_NO_VIABLE') return 'fa-circle-xmark';
    if (normalized === 'PENDIENTE') return 'fa-circle-question';
    return 'fa-circle-info';
  }


  getEstadoIcon(label: any): string {
    const raw = String(label || '').trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
    if (!raw) return 'fa-circle-info';
    if (raw.includes('ESPERA')) return 'fa-hourglass-half';
    if (raw.includes('PROCESO')) return 'fa-spinner';
    if (raw.includes('REVISION')) return 'fa-magnifying-glass';
    if (raw.includes('EVALUAD')) return 'fa-circle-check';
    if (raw.includes('APROB')) return 'fa-circle-check';
    if (raw.includes('RECHAZ')) return 'fa-circle-xmark';
    if (raw.includes('CANCEL')) return 'fa-ban';
    if (raw.includes('FINAL') || raw.includes('COMPLET')) return 'fa-flag-checkered';
    return 'fa-circle-info';
  }

  getEstadoClass(label: any): string {
    const raw = String(label || '').trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
    if (!raw) return 'estado-neutral';
    if (raw.includes('ESPERA')) return 'estado-espera';
    if (raw.includes('EVALUACION') || raw.includes('EVALUAR')) return 'estado-evaluacion';
    if (raw.includes('EVALUAD')) return 'estado-evaluado';
    return 'estado-neutral';
  }

  closeEstadoMenu(ev?: Event): void {
    try {
      const target = ev?.target as HTMLElement | null;
      const details = target?.closest('details');
      if (details && details.hasAttribute('open')) {
        details.removeAttribute('open');
      }
    } catch {
      void 0;
    }
  }

  getEstadoEvaluacionId(): number | null {
    const estados = this.estadosSolicitud || [];
    const match = estados.find((e: any) => {
      const nombre = String(e?.nombre_estado || e?.nombre || '').toUpperCase();
      return nombre.includes('EVALUACION') || nombre.includes('EVALUAR');
    });
    const id = Number(match?.id_estado);
    return Number.isFinite(id) ? id : null;
  }

  isSolicitudEnEvaluacion(s: any): boolean {
    const nombre = String(s?.nombre_estado || '').toUpperCase();
    if (nombre.includes('EVALUACION') || nombre.includes('EVALUAR')) return true;
    const idActual = s?.id_estado ?? null;
    const idEvaluacion = this.getEstadoEvaluacionId();
    return idEvaluacion !== null && Number(idActual) === idEvaluacion;
  }

  isSolicitudEvaluada(s: any): boolean {
    const nombre = String(s?.nombre_estado || '').toUpperCase();
    if (nombre.includes('EVALUAD')) return true;
    const idActual = s?.id_estado ?? null;
    const evaluada = (this.estadosSolicitud || []).find((e: any) =>
      String(e?.nombre_estado || e?.nombre || '').toUpperCase().includes('EVALUAD')
    );
    const idEvaluada = Number(evaluada?.id_estado);
    return Number.isFinite(idEvaluada) && Number(idActual) === idEvaluada;
  }

  async setSolicitudEnEvaluacion(s: any): Promise<void> {
    if (!this.canInteractSolicitudSelects()) return;
    if (this.isSolicitudEvaluada(s) || this.isSolicitudEnEvaluacion(s)) return;
    const idEvaluacion = this.getEstadoEvaluacionId();
    if (!idEvaluacion) {
      this.snackbarService.error('Estado "En evaluación" no encontrado');
      return;
    }
    await this.updateSolicitudEstado(s, idEvaluacion);
  }

  canDelete(): boolean {
    return this.utilsService.canDelete();
  }

  canEditOrDeleteSolicitud(): boolean {
    const u = this.user();
    const raw = String((u as any)?.rol_nombre || u?.rol || '').trim().toLowerCase();
    if (!raw) return false;
    return raw.replace(/\s+/g, '') !== 'administrador';
  }

  toggleClienteDetails(id: number): void {
    this.detallesVisibles[id] = !this.detallesVisibles[id];
    if (this.detallesVisibles[id]) {
      const c = (this.clientes() || []).find(x => Number(x.id_cliente) === Number(id));
      if (c) this.selectedCliente.set(c);
    }
  }

  async toggleExpandSolicitud(s: any): Promise<void> {
    const key = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    if (!key) return;

    const isOpening = this.solicitudExpandida !== key;
    this.solicitudExpandida = isOpening ? key : null;

    if (this.solicitudExpandida === key && !this.activeSolicitudTab[key]) {
      this.activeSolicitudTab[key] = 'detalle';
    }

    let current = s || null;
    if (isOpening) {
      try {
        current = await this.solicitudesService.getSolicitudDetalleById(key);
      } catch (err) {
        console.warn('No se pudo refrescar detalle de solicitud', err);
      }
    }

    // Debug para verificar datos
    console.log('=== DEBUG Solicitud Expandida ===');
    console.log('ID:', key);
    console.log('Datos completos:', current);
    console.log('Campos de oferta:', {
      genero_cotizacion: current?.genero_cotizacion,
      valor_cotizacion: current?.valor_cotizacion,
      fecha_envio_oferta: current?.fecha_envio_oferta,
      realizo_seguimiento_oferta: current?.realizo_seguimiento_oferta,
      observacion_oferta: current?.observacion_oferta
    });
    console.log('Campos de revisión:', {
      fecha_limite_entrega: current?.fecha_limite_entrega,
      concepto_final: current?.concepto_final
    });
    console.log('Campos de encuesta:', {
      fecha_encuesta: current?.fecha_encuesta,
      comentarios: current?.comentarios,
      recomendaria_servicio: current?.recomendaria_servicio,
      cliente_respondio: current?.cliente_respondio,
      solicito_nueva_encuesta: current?.solicito_nueva_encuesta,
      fecha_realizacion_encuesta: current?.fecha_realizacion_encuesta
    });
    console.log('=== FIN DEBUG ===');

    // set selected solicitud for reactive forms/cards
    this.selectedSolicitud.set(current || null);
  }

  async updateSolicitudEstado(s: any, nuevoEstado: any): Promise<void> {
    if (!this.canInteractSolicitudSelects()) return;
    const id_estado = nuevoEstado === '' || nuevoEstado === null || nuevoEstado === undefined
      ? null
      : Number(nuevoEstado);
    const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    const prevEstadoId = s?.id_estado ?? null;
    if (!sid || id_estado === null || !Number.isFinite(id_estado)) return;
    if (Number(prevEstadoId) === Number(id_estado)) return;
    const estadoPrevio = (this.estadosSolicitud || []).find((e: any) => Number(e?.id_estado) === Number(prevEstadoId));
    const estadoNuevo = (this.estadosSolicitud || []).find((e: any) => Number(e?.id_estado) === id_estado);
    const prevEstadoNombre = estadoPrevio?.nombre_estado || estadoPrevio?.nombre || s?.nombre_estado || null;
    s.id_estado = id_estado;
    s.nombre_estado = estadoNuevo?.nombre_estado || estadoNuevo?.nombre || s?.nombre_estado || null;
    try {
      await this.solicitudesService.actualizarEstadoSolicitud(sid, id_estado);
      this.snackbarService.success('Estado actualizado');
    } catch (err: any) {
      s.id_estado = prevEstadoId;
      s.nombre_estado = prevEstadoNombre;
      this.snackbarService.error(err?.message || 'Error actualizando estado');
    }
  }

  async updateSolicitudAsignacion(s: any, nuevoAdmin: any): Promise<void> {
    if (!this.canInteractSolicitudSelects()) return;
    const id_admin = nuevoAdmin === '' || nuevoAdmin === null || nuevoAdmin === undefined ? null : Number(nuevoAdmin);
    const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    if (!sid) return;
    if (id_admin !== null && !Number.isFinite(id_admin)) return;
    const prevAdminId = s.id_admin ?? null;
    const prevAdminEmail = s.admin_email ?? null;
    if (Number(prevAdminId) === Number(id_admin)) return;
    const admin = (this.adminUsuarios || []).find((u: any) => Number(u?.id_usuario) === Number(id_admin));
    s.id_admin = id_admin;
    s.admin_email = admin?.email || s.admin_email || null;
    try {
      await this.solicitudesService.asignarSolicitud(sid, id_admin);
      this.snackbarService.success('Asignación actualizada');
    } catch (err: any) {
      s.id_admin = prevAdminId;
      s.admin_email = prevAdminEmail;
      this.snackbarService.error(err?.message || 'Error actualizando asignación');
    }
  }

  isSolicitudExpanded(s: any): boolean {
    const key = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    return key ? this.solicitudExpandida === key : false;
  }

  selectSolicitudTab(id: number, tabKey: string): void {
    this.activeSolicitudTab[id] = tabKey;
  }

  // ========== EDITAR TARJETAS ==========
  editSolicitud(s: any): void {
    const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    if (!sid) return;
    this.solicitudExpandida = sid;
    this.activeSolicitudTab[sid] = this.activeSolicitudTab[sid] || 'detalle';
    this.snackbarService.info('Edita los campos desde las pestañas');
  }

  editCliente(u: any): void {
    const cid = Number(u?.id_cliente ?? 0);
    if (!cid) return;
    // Toggle details open for inline editing in the card grid
    this.detallesVisibles[cid] = true;
    this.snackbarService.info('Edita los campos del cliente en el panel');
    // Open modal with prefilled data
    this.editClienteModalOpen = true;
    this.editClienteId = cid;
    this.editClienteNombre = u?.nombre_solicitante || '';
    this.editClienteCorreo = u?.correo_electronico || '';
    this.editClienteCelular = u?.celular || '';
    this.editClienteTelefono = u?.telefono || '';
    this.editClienteDireccion = u?.direccion || '';
    this.editClienteDep = String(u?.id_departamento || u?.departamento_codigo || '');
    this.editClienteCiudad = String(u?.id_ciudad || u?.ciudad_codigo || '');
    this.editClienteRazonSocial = u?.razon_social || '';
    this.editClienteNit = u?.nit || '';
    this.editClienteTipoUsuario = u?.tipo_usuario || '';
    this.editClienteTipoId = u?.tipo_identificacion || '';
    this.editClienteNumeroIdentificacion = u?.numero_identificacion || '';
    this.editClienteSexo = u?.sexo || '';
    this.editClienteTipoPobl = u?.tipo_poblacion || '';
    this.editClienteFechaVinculacion = this.toDateInput(u?.fecha_vinculacion);
    this.editClienteTipoVinculacion = u?.tipo_vinculacion || '';
    this.editClienteRegistroPor = u?.registro_realizado_por || '';
    this.editClienteObservaciones = u?.observaciones || '';
    // set reactive selected cliente
    this.selectedCliente.set(u);
  }

  // Normaliza valores de fecha a formato input date (YYYY-MM-DD)
  private toDateInput(v: any): string {
    if (!v) return '';
    try {
      // Si viene como Date o timestamp
      if (v instanceof Date) {
        const yyyy = v.getFullYear();
        const mm = String(v.getMonth() + 1).padStart(2, '0');
        const dd = String(v.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      const s = String(v);
      // Si viene como ISO, tomar primeros 10 caracteres
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.slice(0, 10);
      }
      // Intentar parsear
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return '';
    } catch {
      return '';
    }
  }

  private toNullableBool(value: any): boolean | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      return null;
    }
    const s = String(value).trim().toLowerCase();
    if (!s) return null;
    if (s === '1' || s === 'true' || s === 't' || s === 'si' || s === 'sí' || s === 'yes' || s === 'y') return true;
    if (s === '0' || s === 'false' || s === 'f' || s === 'no' || s === 'n') return false;
    return null;
  }

  private toTinyIntOrNull(value: any): number | null {
    const normalized = this.toNullableBool(value);
    return normalized === null ? null : (normalized ? 1 : 0);
  }

  private toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeComparableValue(value: unknown): string | number | boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'boolean') return value;
    const serialized = String(value).trim();
    return serialized === '' ? null : serialized;
  }

  private hasNoBodyChanges(body: Record<string, unknown>, current: Record<string, unknown>): boolean {
    return !Object.keys(body).some((key) =>
      this.normalizeComparableValue(body[key]) !== this.normalizeComparableValue(current[key])
    );
  }

  // ======= Estado modal de edición de cliente =======
  editClienteModalOpen = false;
  editClienteId: number | null = null;
  editClienteNombre = '';
  editClienteCorreo = '';
  editClienteCelular = '';
  editClienteTelefono = '';
  editClienteDireccion = '';
  editClienteDep = '';
  editClienteCiudad = '';
  editClienteRazonSocial = '';
  editClienteNit = '';
  editClienteTipoUsuario = '';
  editClienteTipoId = '';
  editClienteNumeroIdentificacion = '';
  editClienteSexo = '';
  editClienteTipoPobl = '';
  editClienteFechaVinculacion = '';
  editClienteTipoVinculacion = '';
  editClienteRegistroPor = '';
  editClienteObservaciones = '';

  closeEditClienteModal(): void {
    this.editClienteModalOpen = false;
    this.editClienteId = null;
  }

  async onEditDepChange(): Promise<void> {
    try {
      await this.locationsService.loadCiudades(this.editClienteDep);
    } catch (err: any) {
      console.warn('onEditDepChange: error cargando ciudades', err);
    }
  }

  async saveEditCliente(): Promise<void> {
    if (!this.editClienteId) return;
    const clienteBefore = this.findClienteById(this.editClienteId);
    const body = {
      nombre_solicitante: this.editClienteNombre,
      correo_electronico: this.editClienteCorreo,
      celular: this.editClienteCelular || null,
      telefono: this.editClienteTelefono || null,
      direccion: this.editClienteDireccion || null,
      id_departamento: this.editClienteDep || null,
      id_ciudad: this.editClienteCiudad || null,
      razon_social: this.editClienteRazonSocial || null,
      nit: this.editClienteNit || null,
      tipo_usuario: this.editClienteTipoUsuario || null,
      tipo_identificacion: this.editClienteTipoId || null,
      numero_identificacion: this.editClienteNumeroIdentificacion || null,
      sexo: this.editClienteSexo || null,
      tipo_poblacion: this.editClienteTipoPobl || null,
      fecha_vinculacion: this.editClienteFechaVinculacion || null,
      tipo_vinculacion: this.editClienteTipoVinculacion || null,
      registro_realizado_por: this.editClienteRegistroPor || null,
      observaciones: this.editClienteObservaciones || null
    };
    const currentBody = {
      nombre_solicitante: clienteBefore?.nombre_solicitante ?? null,
      correo_electronico: clienteBefore?.correo_electronico ?? null,
      celular: clienteBefore?.celular ?? null,
      telefono: clienteBefore?.telefono ?? null,
      direccion: clienteBefore?.direccion ?? null,
      id_departamento: clienteBefore?.id_departamento === null || clienteBefore?.id_departamento === undefined ? null : String(clienteBefore?.id_departamento),
      id_ciudad: clienteBefore?.id_ciudad === null || clienteBefore?.id_ciudad === undefined ? null : String(clienteBefore?.id_ciudad),
      razon_social: clienteBefore?.razon_social ?? null,
      nit: clienteBefore?.nit ?? null,
      tipo_usuario: clienteBefore?.tipo_usuario ?? null,
      tipo_identificacion: clienteBefore?.tipo_identificacion ?? null,
      numero_identificacion: clienteBefore?.numero_identificacion ?? null,
      sexo: clienteBefore?.sexo ?? null,
      tipo_poblacion: clienteBefore?.tipo_poblacion ?? null,
      fecha_vinculacion: this.toDateInput(clienteBefore?.fecha_vinculacion) || null,
      tipo_vinculacion: clienteBefore?.tipo_vinculacion ?? null,
      registro_realizado_por: clienteBefore?.registro_realizado_por ?? null,
      observaciones: clienteBefore?.observaciones ?? null
    };
    if (this.hasNoBodyChanges(body, currentBody)) {
      this.snackbarService.warn('No hay campos para actualizar');
      return;
    }
    try {
      await this.clientesService.updateCliente(this.editClienteId, body);
      this.snackbarService.success('✅ Cliente actualizado');
      const detalle = this.createClienteLogDetalle(this.editClienteId, clienteBefore, body);
      logsService.crearLogAccion({
        modulo: 'CLIENTES',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de cliente: ${this.editClienteId}`,
        detalle
      }).catch(console.error);
      this.closeEditClienteModal();
    } catch (err: any) {
      console.error('saveEditCliente', err);
      this.manejarError(err, 'actualizar cliente');
    }
  }

  // ======= Estado modal de edición de solicitud =======
  editSolicitudModalOpen = false;
  // When true the modal is playing the closing animation but remains in DOM
  editSolicitudModalClosing = false;
  estadoModalOpen = false;
  estadoModalSolicitud: any = null;
  asignacionModalOpen = false;
  asignacionModalSolicitud: any = null;
  editSolicitudId: number | null = null;
  editSolicitudNombreMuestra = '';
  editSolicitudTipo = '';
  editSolicitudTipoAfId: number | null = null;
  editSolicitudFechaSolicitud = '';
  editSolicitudFechaVenc = '';
  // Additional solicitud fields
  editSolicitudLote = '';
  editSolicitudTipoMuestra = '';
  editSolicitudTipoEmpaque = '';
  editSolicitudAnalisisRequerido = '';
  editSolicitudReqAnalisis: any = null;
  editSolicitudCantMuestras: number | null = null;
  editSolicitudSolicitudRecibida = '';
  editSolicitudFechaEntrega = '';
  editSolicitudRecibePersonal = '';
  editSolicitudCargoPersonal = '';
  editSolicitudObservaciones = '';
  // Tabs state for solicitud edit modal
  editSolicitudActiveTab: 'solicitud' | 'oferta' | 'revision' | 'encuesta' = 'solicitud';

  // Oferta fields
  editOfertaGeneroCotizacion: any = null;
  editOfertaValorCotizacion: any = null;
  editOfertaFechaEnvio = '';
  editOfertaRealizoSeguimiento: any = null;
  editOfertaObservacion = '';

  // Revision fields
  editRevisionFechaLimite = '';
  editRevisionServicioViable: any = null;
  editRevisionTipoMuestraEspecificado: string | null = null;
  editRevisionEnsayosClaros: any = null;
  editRevisionEquiposCalibrados: any = null;
  editRevisionPersonalCompetente: any = null;
  editRevisionInfraestructuraAdecuada: any = null;
  editRevisionInsumosVigentes: any = null;
  editRevisionCumpleTiempos: any = null;
  editRevisionNormasMetodos: any = null;
  editRevisionMetodoValidado: any = null;
  editRevisionMetodoAdecuado: any = null;
  editRevisionObservacionesTecnicas = '';
  editRevisionConceptoFinal: string | null = null;

  // Encuesta fields
  editEncuestaFecha = '';
  editEncuestaComentarios = '';
  // editEncuestaRecomendaria: any = null;
  editEncuestaFechaRealizacion = '';
  editEncuestaClienteRespondio: any = null;
  editEncuestaSolicitoNueva: any = null;

  editSolicitudOpen(s: any): void {
    if (!this.canEditOrDeleteSolicitud()) {
      this.snackbarService.error('❌ No puedes editar solicitudes con rol Administrador.');
      return;
    }
    const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    if (!sid) return;
    // If we were in a closing animation, cancel it and open immediately
    this.editSolicitudModalClosing = false;
    this.editSolicitudModalOpen = true;
    this.editSolicitudId = sid;
    this.editSolicitudNombreMuestra = s?.nombre_muestra || '';
    this.editSolicitudTipo = s?.tipo_solicitud || '';
    this.editSolicitudTipoAfId = s?.id_tipo_af === null || s?.id_tipo_af === undefined || s?.id_tipo_af === '' ? null : Number(s?.id_tipo_af);
    this.editSolicitudFechaSolicitud = this.toDateInput(s?.fecha_solicitud);
    this.editSolicitudFechaVenc = this.toDateInput(s?.fecha_vencimiento_muestra);
    // additional solicitud prefill
    this.editSolicitudLote = s?.lote_producto || '';
    this.editSolicitudTipoMuestra = s?.tipo_muestra || '';
    this.editSolicitudTipoEmpaque = s?.tipo_empaque || '';
    this.editSolicitudAnalisisRequerido = s?.analisis_requerido || '';
    this.editSolicitudReqAnalisis = this.toNullableBool(s?.req_analisis);
    this.editSolicitudCantMuestras = s?.cant_muestras ?? null;
    this.editSolicitudSolicitudRecibida = s?.solicitud_recibida || '';
    this.editSolicitudFechaEntrega = this.toDateInput(s?.fecha_entrega_muestra);
    this.editSolicitudRecibePersonal = s?.recibe_personal || '';
    this.editSolicitudCargoPersonal = s?.cargo_personal || '';
    this.editSolicitudObservaciones = s?.observaciones || '';
    // reset tab
    this.editSolicitudActiveTab = 'solicitud';

    // Prefill oferta
    this.editOfertaGeneroCotizacion = this.toNullableBool(s?.genero_cotizacion);
    this.editOfertaValorCotizacion = s?.valor_cotizacion ?? null;
    this.editOfertaFechaEnvio = this.toDateInput(s?.fecha_envio_oferta);
    this.editOfertaRealizoSeguimiento = this.toNullableBool(s?.realizo_seguimiento_oferta);
    this.editOfertaObservacion = s?.observacion_oferta || '';

    // Prefill revision
    this.editRevisionFechaLimite = this.toDateInput(s?.fecha_limite_entrega);
    this.editRevisionTipoMuestraEspecificado = s?.tipo_muestra_especificado || null;
    this.editRevisionEnsayosClaros = this.toNullableBool(s?.ensayos_requeridos_claros);
    this.editRevisionEquiposCalibrados = this.toNullableBool(s?.equipos_calibrados);
    this.editRevisionPersonalCompetente = this.toNullableBool(s?.personal_competente);
    this.editRevisionInfraestructuraAdecuada = this.toNullableBool(s?.infraestructura_adecuada);
    this.editRevisionInsumosVigentes = this.toNullableBool(s?.insumos_vigentes);
    this.editRevisionCumpleTiempos = this.toNullableBool(s?.cumple_tiempos_entrega);
    this.editRevisionNormasMetodos = this.toNullableBool(s?.normas_metodos_especificados);
    this.editRevisionMetodoValidado = this.toNullableBool(s?.metodo_validado_verificado);
    this.editRevisionMetodoAdecuado = this.toNullableBool(s?.metodo_adecuado);
    this.editRevisionObservacionesTecnicas = s?.observaciones_tecnicas || '';
    this.editRevisionConceptoFinal = s?.concepto_final || null;

    // Prefill encuesta
    this.editEncuestaFecha = this.toDateInput(s?.fecha_encuesta);
    this.editEncuestaComentarios = s?.comentarios || '';
    // this.editEncuestaRecomendaria = s?.recomendaria_servicio === null ? null : (s?.recomendaria_servicio ? true : false);
    this.editEncuestaFechaRealizacion = this.toDateInput(s?.fecha_realizacion_encuesta);
    this.editEncuestaClienteRespondio = this.toNullableBool(s?.cliente_respondio);
    this.editEncuestaSolicitoNueva = this.toNullableBool(s?.solicito_nueva_encuesta);
    // set reactive selected solicitud
    this.selectedSolicitud.set(s);
  }

  openEstadoModal(s: any): void {
    if (!s) return;
    this.estadoModalSolicitud = s;
    this.estadoModalOpen = true;
  }

  closeEstadoModal(): void {
    this.estadoModalOpen = false;
    this.estadoModalSolicitud = null;
  }

  openAsignacionModal(s: any): void {
    if (!s) return;
    this.asignacionModalSolicitud = s;
    this.asignacionModalOpen = true;
  }

  closeAsignacionModal(): void {
    this.asignacionModalOpen = false;
    this.asignacionModalSolicitud = null;
  }

  // When user chooses a client in the create-solicitud select, update selectedCliente signal
  onSelectSolicitudCliente(value: any): void {
    try {
      const id = Number(value);
      const found = (this.clientes() || []).find(c => Number(c.id_cliente) === id);
      if (found) this.selectedCliente.set(found);
    } catch {
      void 0;
    }
  }

  // Estado de bloqueo de formularios (si ya existen datos)
  ofertaLocked = false;
  revisionLocked = false;
  encuestaLocked = false;

  // When user chooses a solicitud in oferta/result/encuesta selects, update selectedSolicitud signal
  onSelectSolicitudOferta(value: any): void {
    try {
      const id = Number(value);
      const found = (this.solicitudes() || []).find(s => Number(s.solicitud_id) === id || Number(s.id_solicitud) === id);
      
      if (found) {
        this.selectedSolicitud.set(found);
        
        // Verificar si ya tiene oferta registrada
        // Si genero_cotizacion tiene valor (0 o 1), asumimos que existe
        this.ofertaLocked = (found.genero_cotizacion !== null && found.genero_cotizacion !== undefined);
        
        if (this.ofertaLocked) {
          this.ofertaValor = Number.isFinite(Number(found?.valor_cotizacion)) ? Number(found?.valor_cotizacion) : null;
          this.ofertaValorDisplay = this.formatCurrency(this.ofertaValor);
          this.ofertaGeneroCotizacion = found.genero_cotizacion === 1 || found.genero_cotizacion === true;
          this.ofertaRealizoSeguimiento = found.realizo_seguimiento_oferta === 1 || found.realizo_seguimiento_oferta === true;
          this.ofertaFechaEnvio = this.toDateInput(found.fecha_envio_oferta);
          this.ofertaObservacion = String(found?.observacion_oferta ?? '');
        } else {
          // Limpiar campos excepto ID
          this.ofertaValor = null;
          this.ofertaValorDisplay = '';
          this.ofertaGeneroCotizacion = null;
          this.ofertaRealizoSeguimiento = null;
          this.ofertaFechaEnvio = '';
          this.ofertaObservacion = '';
          this.ofertaLocked = false;
        }
      } else {
        this.ofertaLocked = false;
      }
    } catch {
      void 0;
    }
  }

  async onSelectSolicitudRevision(value: any): Promise<void> {
    const id = Number(value);
    if (!id) {
      this.revisionLocked = false;
      this.resultadoFechaLimite = '';
      this.resultadoTipoMuestraEspecificado = null;
      this.resultadoEnsayosClaros = null;
      this.resultadoEquiposCalibrados = null;
      this.resultadoPersonalCompetente = null;
      this.resultadoInfraestructuraAdecuada = null;
      this.resultadoInsumosVigentes = null;
      this.resultadoCumpleTiempos = null;
      this.resultadoNormasMetodos = null;
      this.resultadoMetodoValidado = null;
      this.resultadoMetodoAdecuado = null;
      this.resultadoObservacionesTecnicas = '';
      this.resultadoConceptoFinal = null;
      return;
    }

    let found: any = null;
    try {
      found = await this.solicitudesService.getSolicitudDetalleById(id);
    } catch {
      found = (this.solicitudes() || []).find(s => Number(s.solicitud_id) === id || Number(s.id_solicitud) === id) || null;
    }

    if (found) {
      this.selectedSolicitud.set(found);

      // Verificar si ya tiene revisión (concepto_final no nulo)
      this.revisionLocked = (found.concepto_final !== null && found.concepto_final !== undefined);

      if (this.revisionLocked) {
        this.resultadoFechaLimite = this.toDateInput(found.fecha_limite_entrega);
        this.resultadoTipoMuestraEspecificado = found.tipo_muestra_especificado || null;
        this.resultadoEnsayosClaros = found.ensayos_requeridos_claros === 1 || found.ensayos_requeridos_claros === true;
        this.resultadoEquiposCalibrados = found.equipos_calibrados === 1 || found.equipos_calibrados === true;
        this.resultadoPersonalCompetente = found.personal_competente === 1 || found.personal_competente === true;
        this.resultadoInfraestructuraAdecuada = found.infraestructura_adecuada === 1 || found.infraestructura_adecuada === true;
        this.resultadoInsumosVigentes = found.insumos_vigentes === 1 || found.insumos_vigentes === true;
        this.resultadoCumpleTiempos = found.cumple_tiempos_entrega === 1 || found.cumple_tiempos_entrega === true;
        this.resultadoNormasMetodos = found.normas_metodos_especificados === 1 || found.normas_metodos_especificados === true;
        this.resultadoMetodoValidado = found.metodo_validado_verificado === 1 || found.metodo_validado_verificado === true;
        this.resultadoMetodoAdecuado = found.metodo_adecuado === 1 || found.metodo_adecuado === true;
        this.resultadoObservacionesTecnicas = found.observaciones_tecnicas || '';
        this.resultadoConceptoFinal = found.concepto_final || null;
      } else {
        this.resultadoFechaLimite = '';
        this.resultadoTipoMuestraEspecificado = null;
        this.resultadoEnsayosClaros = null;
        this.resultadoEquiposCalibrados = null;
        this.resultadoPersonalCompetente = null;
        this.resultadoInfraestructuraAdecuada = null;
        this.resultadoInsumosVigentes = null;
        this.resultadoCumpleTiempos = null;
        this.resultadoNormasMetodos = null;
        this.resultadoMetodoValidado = null;
        this.resultadoMetodoAdecuado = null;
        this.resultadoObservacionesTecnicas = '';
        this.resultadoConceptoFinal = null;
        this.revisionLocked = false;
      }
    } else {
      this.revisionLocked = false;
    }
  }

  onSelectSolicitudEncuesta(value: any): void {
    try {
      const id = Number(value);
      const found = (this.solicitudes() || []).find(s => Number(s.solicitud_id) === id || Number(s.id_solicitud) === id);
      
      if (found) {
        this.selectedSolicitud.set(found);
        
        // Verificar si ya tiene encuesta (cliente_respondio no nulo)
        this.encuestaLocked = (found.cliente_respondio !== null && found.cliente_respondio !== undefined);
        
        if (this.encuestaLocked) {
          this.encuestaFecha = this.toDateInput(found.fecha_encuesta);
          this.encuestaComentarios = String(found?.comentarios ?? '');
          this.encuestaClienteRespondio = found.cliente_respondio === 1 || found.cliente_respondio === true;
          this.encuestaSolicitoNueva = found.solicito_nueva_encuesta === 1 || found.solicito_nueva_encuesta === true;
          this.encuestaFechaRealizacion = this.toDateInput(found.fecha_realizacion_encuesta);
        } else {
          this.encuestaFecha = '';
          this.encuestaComentarios = '';
          this.encuestaClienteRespondio = null;
          this.encuestaSolicitoNueva = null;
          this.encuestaFechaRealizacion = '';
          this.encuestaLocked = false;
        }
      } else {
        this.encuestaLocked = false;
      }
    } catch {
      void 0;
    }
  }

  closeEditSolicitudModal(): void {
    // Play a smooth close animation before actually removing modal from DOM.
    if (!this.editSolicitudModalOpen || this.editSolicitudModalClosing) {
      // already closed or closing
      return;
    }
    this.editSolicitudModalClosing = true;
    // Delay should match CSS transition duration (200ms)
    setTimeout(() => {
      this.editSolicitudModalClosing = false;
      this.editSolicitudModalOpen = false;
      this.editSolicitudId = null;
    }, 220);
  }

  async saveEditSolicitud(): Promise<void> {
    if (!this.editSolicitudId) return;
    const solicitudBefore = this.findSolicitudById(this.editSolicitudId);
    const cliente = this.findClienteById(solicitudBefore?.id_cliente);
    const body: Record<string, unknown> = {
      nombre_muestra: this.editSolicitudNombreMuestra,
      tipo_solicitud: this.editSolicitudTipo,
      id_tipo_af: (this.editSolicitudTipo || '').trim() === 'AF' ? (this.editSolicitudTipoAfId ?? null) : null,
      lote_producto: this.editSolicitudLote || null,
      fecha_solicitud: this.editSolicitudFechaSolicitud || null,
      fecha_vencimiento_muestra: this.editSolicitudFechaVenc || null,
      tipo_muestra: this.editSolicitudTipoMuestra || null,
      tipo_empaque: this.editSolicitudTipoEmpaque || null,
      analisis_requerido: this.editSolicitudAnalisisRequerido || null,
      req_analisis: this.editSolicitudReqAnalisis === null ? null : (this.editSolicitudReqAnalisis ? 1 : 0),
      cant_muestras: this.editSolicitudCantMuestras ?? null,
      fecha_entrega_muestra: this.editSolicitudFechaEntrega || null,
      solicitud_recibida: this.editSolicitudSolicitudRecibida || null,
      recibe_personal: this.editSolicitudRecibePersonal || null,
      cargo_personal: this.editSolicitudCargoPersonal || null,
      observaciones: this.editSolicitudObservaciones || null
    };
    const currentBody: Record<string, unknown> = {
      nombre_muestra: solicitudBefore?.nombre_muestra ?? null,
      tipo_solicitud: solicitudBefore?.tipo_solicitud ?? null,
      id_tipo_af: (String(solicitudBefore?.tipo_solicitud || '').trim() === 'AF') ? this.toNumberOrNull(solicitudBefore?.id_tipo_af) : null,
      lote_producto: solicitudBefore?.lote_producto ?? null,
      fecha_solicitud: this.toDateInput(solicitudBefore?.fecha_solicitud) || null,
      fecha_vencimiento_muestra: this.toDateInput(solicitudBefore?.fecha_vencimiento_muestra) || null,
      tipo_muestra: solicitudBefore?.tipo_muestra ?? null,
      tipo_empaque: solicitudBefore?.tipo_empaque ?? null,
      analisis_requerido: solicitudBefore?.analisis_requerido ?? null,
      req_analisis: this.toTinyIntOrNull(solicitudBefore?.req_analisis),
      cant_muestras: this.toNumberOrNull(solicitudBefore?.cant_muestras),
      fecha_entrega_muestra: this.toDateInput(solicitudBefore?.fecha_entrega_muestra) || null,
      solicitud_recibida: solicitudBefore?.solicitud_recibida ?? null,
      recibe_personal: solicitudBefore?.recibe_personal ?? null,
      cargo_personal: solicitudBefore?.cargo_personal ?? null,
      observaciones: solicitudBefore?.observaciones ?? null
    };
    if (this.hasNoBodyChanges(body, currentBody)) {
      this.snackbarService.warn('No hay campos para actualizar');
      return;
    }
    try {
      await this.solicitudesService.updateSolicitud(this.editSolicitudId, body);
      this.snackbarService.success('✅ Solicitud actualizada');
      const detalle = this.createSolicitudLogDetalle(this.editSolicitudId, solicitudBefore, body, cliente);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de solicitud: ${this.editSolicitudId}`,
        detalle
      }).catch(console.error);
      this.closeEditSolicitudModal();
      await this.loadSolicitudes();
    } catch (err: unknown) {
      console.error('saveEditSolicitud', err);
      this.manejarError(err, 'actualizar solicitud');
    }
  }

  // Save oferta tab
  async saveEditOferta(): Promise<void> {
    if (!this.editSolicitudId) return;
    const solicitudBefore = this.findSolicitudById(this.editSolicitudId);
    const cliente = this.findClienteById(solicitudBefore?.id_cliente);
    const body: Record<string, unknown> = {
      genero_cotizacion: this.editOfertaGeneroCotizacion === null ? null : (this.editOfertaGeneroCotizacion ? 1 : 0),
      valor_cotizacion: this.editOfertaValorCotizacion,
      fecha_envio_oferta: this.editOfertaFechaEnvio || null,
      realizo_seguimiento_oferta: this.editOfertaRealizoSeguimiento === null ? null : (this.editOfertaRealizoSeguimiento ? 1 : 0),
      observacion_oferta: this.editOfertaObservacion || null
    };
    const currentBody: Record<string, unknown> = {
      genero_cotizacion: this.toTinyIntOrNull(solicitudBefore?.genero_cotizacion),
      valor_cotizacion: this.toNumberOrNull(solicitudBefore?.valor_cotizacion),
      fecha_envio_oferta: this.toDateInput(solicitudBefore?.fecha_envio_oferta) || null,
      realizo_seguimiento_oferta: this.toTinyIntOrNull(solicitudBefore?.realizo_seguimiento_oferta),
      observacion_oferta: solicitudBefore?.observacion_oferta ?? null
    };
    if (this.hasNoBodyChanges(body, currentBody)) {
      this.snackbarService.warn('No hay campos para actualizar');
      return;
    }
    try {
      await this.solicitudesService.upsertOferta(Number(this.editSolicitudId), body);
      this.snackbarService.success('✅ Oferta actualizada');
      const detalle = this.createSolicitudLogDetalle(this.editSolicitudId, solicitudBefore, { ...body }, cliente);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de oferta de solicitud: ${this.editSolicitudId}`,
        detalle
      }).catch(console.error);
      // refresh local prefill
      await this.loadSolicitudes();
      const updated = (this.solicitudes() || []).find(s => Number(s.solicitud_id) === Number(this.editSolicitudId));
      if (updated) this.editSolicitudOpen(updated);
    } catch (err: unknown) {
      console.error('saveEditOferta', err);
      this.manejarError(err, 'actualizar oferta');
    }
  }

  // Save revision tab
  async saveEditRevision(): Promise<void> {
    if (!this.editSolicitudId) return;
    const solicitudBefore = this.findSolicitudById(this.editSolicitudId);
    const cliente = this.findClienteById(solicitudBefore?.id_cliente);
    const body: Record<string, unknown> = {
      fecha_limite_entrega: this.editRevisionFechaLimite || null,
      tipo_muestra_especificado: this.editRevisionTipoMuestraEspecificado,
      ensayos_requeridos_claros: this.editRevisionEnsayosClaros === null ? null : (this.editRevisionEnsayosClaros ? 1 : 0),
      equipos_calibrados: this.editRevisionEquiposCalibrados === null ? null : (this.editRevisionEquiposCalibrados ? 1 : 0),
      personal_competente: this.editRevisionPersonalCompetente === null ? null : (this.editRevisionPersonalCompetente ? 1 : 0),
      infraestructura_adecuada: this.editRevisionInfraestructuraAdecuada === null ? null : (this.editRevisionInfraestructuraAdecuada ? 1 : 0),
      insumos_vigentes: this.editRevisionInsumosVigentes === null ? null : (this.editRevisionInsumosVigentes ? 1 : 0),
      cumple_tiempos_entrega: this.editRevisionCumpleTiempos === null ? null : (this.editRevisionCumpleTiempos ? 1 : 0),
      normas_metodos_especificados: this.editRevisionNormasMetodos === null ? null : (this.editRevisionNormasMetodos ? 1 : 0),
      metodo_validado_verificado: this.editRevisionMetodoValidado === null ? null : (this.editRevisionMetodoValidado ? 1 : 0),
      metodo_adecuado: this.editRevisionMetodoAdecuado === null ? null : (this.editRevisionMetodoAdecuado ? 1 : 0),
      observaciones_tecnicas: this.editRevisionObservacionesTecnicas || null,
      concepto_final: this.editRevisionConceptoFinal
    };
    const currentBody: Record<string, unknown> = {
      fecha_limite_entrega: this.toDateInput(solicitudBefore?.fecha_limite_entrega) || null,
      tipo_muestra_especificado: solicitudBefore?.tipo_muestra_especificado ?? null,
      ensayos_requeridos_claros: this.toTinyIntOrNull(solicitudBefore?.ensayos_requeridos_claros),
      equipos_calibrados: this.toTinyIntOrNull(solicitudBefore?.equipos_calibrados),
      personal_competente: this.toTinyIntOrNull(solicitudBefore?.personal_competente),
      infraestructura_adecuada: this.toTinyIntOrNull(solicitudBefore?.infraestructura_adecuada),
      insumos_vigentes: this.toTinyIntOrNull(solicitudBefore?.insumos_vigentes),
      cumple_tiempos_entrega: this.toTinyIntOrNull(solicitudBefore?.cumple_tiempos_entrega),
      normas_metodos_especificados: this.toTinyIntOrNull(solicitudBefore?.normas_metodos_especificados),
      metodo_validado_verificado: this.toTinyIntOrNull(solicitudBefore?.metodo_validado_verificado),
      metodo_adecuado: this.toTinyIntOrNull(solicitudBefore?.metodo_adecuado),
      observaciones_tecnicas: solicitudBefore?.observaciones_tecnicas ?? null,
      concepto_final: solicitudBefore?.concepto_final ?? null
    };
    if (this.hasNoBodyChanges(body, currentBody)) {
      this.snackbarService.warn('No hay campos para actualizar');
      return;
    }
    try {
      await this.solicitudesService.upsertRevision(Number(this.editSolicitudId), body);
      this.snackbarService.success('✅ Revisión actualizada');
      {
        const evaluada = (this.estadosSolicitud || []).find((e: { nombre_estado?: string; nombre?: string; id_estado?: number | string }) =>
          String(e?.nombre_estado || e?.nombre || '').toUpperCase().includes('EVALUAD')
        );
        if (evaluada && solicitudBefore) {
          solicitudBefore.id_estado = Number(evaluada.id_estado);
          solicitudBefore.nombre_estado = evaluada.nombre_estado || evaluada.nombre;
        }
      }
      const detalle = this.createSolicitudLogDetalle(this.editSolicitudId, solicitudBefore, { ...body }, cliente);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de revisión de solicitud: ${this.editSolicitudId}`,
        detalle
      }).catch(console.error);
      await this.loadSolicitudes();
      const updated = (this.solicitudes() || []).find(s => Number(s.solicitud_id) === Number(this.editSolicitudId));
      if (updated) this.editSolicitudOpen(updated);
    } catch (err: unknown) {
      console.error('saveEditRevision', err);
      this.manejarError(err, 'actualizar revisión');
    }
  }

  // Save encuesta tab
  async saveEditEncuesta(): Promise<void> {
    if (!this.editSolicitudId) return;
    const solicitudBefore = this.findSolicitudById(this.editSolicitudId);
    const cliente = this.findClienteById(solicitudBefore?.id_cliente);
    const body: Record<string, unknown> = {
      fecha_encuesta: this.editEncuestaFecha || null,
      comentarios: this.editEncuestaComentarios || null,
      // recomendaria_servicio: this.editEncuestaRecomendaria === null ? null : (this.editEncuestaRecomendaria ? 1 : 0),
      fecha_realizacion_encuesta: this.editEncuestaFechaRealizacion || null,
      cliente_respondio: this.toTinyIntOrNull(this.editEncuestaClienteRespondio),
      solicito_nueva_encuesta: this.toTinyIntOrNull(this.editEncuestaSolicitoNueva)
    };
    const currentBody: Record<string, unknown> = {
      fecha_encuesta: this.toDateInput(solicitudBefore?.fecha_encuesta) || null,
      comentarios: solicitudBefore?.comentarios ?? null,
      fecha_realizacion_encuesta: this.toDateInput(solicitudBefore?.fecha_realizacion_encuesta) || null,
      cliente_respondio: this.toTinyIntOrNull(solicitudBefore?.cliente_respondio),
      solicito_nueva_encuesta: this.toTinyIntOrNull(solicitudBefore?.solicito_nueva_encuesta)
    };
    if (this.hasNoBodyChanges(body, currentBody)) {
      this.snackbarService.warn('No hay campos para actualizar');
      return;
    }
    try {
      await this.solicitudesService.upsertSeguimientoEncuesta(Number(this.editSolicitudId), body);
      this.snackbarService.success('✅ Encuesta actualizada');
      const detalle = this.createSolicitudLogDetalle(this.editSolicitudId, solicitudBefore, { ...body }, cliente);
      logsService.crearLogAccion({
        modulo: 'SOLICITUDES',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de encuesta de solicitud: ${this.editSolicitudId}`,
        detalle
      }).catch(console.error);
      await this.loadSolicitudes();
      const updated = (this.solicitudes() || []).find(s => Number(s.solicitud_id) === Number(this.editSolicitudId));
      if (updated) this.editSolicitudOpen(updated);
    } catch (err: unknown) {
      console.error('saveEditEncuesta', err);
      this.manejarError(err, 'actualizar encuesta');
    }
  }

  // Save current tab only (avoid overwriting other tabs with nulls)
  async saveAllEditSolicitud(): Promise<void> {
    switch (this.editSolicitudActiveTab) {
      case 'oferta':
        await this.saveEditOferta();
        return;
      case 'revision':
        await this.saveEditRevision();
        return;
      case 'encuesta':
        await this.saveEditEncuesta();
        return;
      case 'solicitud':
      default:
        await this.saveEditSolicitud();
        return;
    }
  }

  // Helpers: resolve display names for departamento/ciudad from IDs or codes
  resolveDepartamento(cliente: any): string {
    const depList = this.departamentos();
    const raw = cliente?.departamento;
    const codigo = cliente?.id_departamento || cliente?.departamento_codigo || raw;
    if (codigo && Array.isArray(depList) && depList.length) {
      const found = depList.find(d => String(d.codigo) === String(codigo));
      if (found?.nombre) return this.formatValue(found.nombre);
    }
    if (raw) return this.formatValue(raw);
    return '—';
  }

  resolveCiudad(cliente: any): string {
    // Try common name keys first
    const raw = cliente?.ciudad
      || cliente?.ciudad_nombre
      || cliente?.nombre_ciudad
      || cliente?.municipio
      || cliente?.municipio_nombre;
    // Try to resolve by code if we have cities loaded
    const codigo = cliente?.id_ciudad || cliente?.ciudad_codigo || cliente?.codigo_ciudad || raw;
    const cityList = this.ciudades();
    if (codigo && Array.isArray(cityList) && cityList.length) {
      const found = cityList.find(c => String(c.codigo) === String(codigo));
      if (found?.nombre) return this.formatValue(found.nombre);
    }
    if (raw) return this.formatValue(raw);
    return '—';
  }

  async copyField(key: string, value: string | null): Promise<void> {
    const ok = await this.utilsService.copyToClipboard(value);
    if (!ok) return;
    this.showToast('Copiado');
  }

  getClienteFieldValue(cliente: any, key: string): string {
    switch (key) {
      case 'nombre_solicitante':
        return this.formatValue(cliente.nombre_solicitante);
      case 'razon_social':
        return this.formatValue(cliente.razon_social);
      case 'fecha_vinculacion':
        return this.formatValue(cliente.fecha_vinculacion);
      case 'tipo_identificacion':
        return this.formatValue(cliente.tipo_identificacion);
      case 'sexo':
        return cliente.sexo || '-';
      case 'tipo_poblacion':
        return cliente.tipo_poblacion || '-';
      case 'direccion':
        return this.formatValue(cliente.direccion);
      case 'ciudad_departamento':
        return `${this.resolveCiudad(cliente)} / ${this.resolveDepartamento(cliente)}`;
      case 'telefono_celular':
        return `${this.formatValue(cliente.telefono)} / ${this.formatValue(cliente.celular)}`;
      case 'correo_electronico':
        return this.formatValue(cliente.correo_electronico);
      case 'tipo_vinculacion':
        return this.formatValue(cliente.tipo_vinculacion);
      case 'observaciones':
        return this.formatValue(cliente.observaciones);
      case 'registro_realizado_por':
        return this.formatValue(cliente.registro_realizado_por);
      case 'created_at':
        return this.formatValue(cliente.created_at);
      case 'updated_at':
        return this.formatValue(cliente.updated_at);
      default:
        return this.formatValue(cliente[key]);
    }
  }

  showToast(message: string, ms = 1400): void {
    this.lastCopiedMessage = message;
    setTimeout(() => { this.lastCopiedMessage = null; }, ms);
  }

  formatValue(val: unknown): string {
    return this.utilsService.formatValue(val);
  }

  formatCurrency(val: unknown): string {
    return this.utilsService.formatCurrency(val);
  }

  getTipoAfNombre(idTipoAf: unknown): string {
    if (idTipoAf === null || idTipoAf === undefined || idTipoAf === '') return '—';
    const id = Number(idTipoAf);
    if (Number.isFinite(id)) {
      const found = this.tiposAf.find(t => Number(t.id) === id);
      if (found?.nombre) return found.nombre;
    }
    return this.formatValue(idTipoAf);
  }

  limpiarFecha(val: unknown): string {
    if (val === null || val === undefined || val === '') return '—';
    const s = String(val);
    const m = s.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
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

  // Indica si la pestaña para una solicitud ya tiene datos completados
  hasTabCompleted(
    solicitud: {
      realizo_seguimiento_oferta?: unknown;
      concepto_final?: unknown;
      fecha_encuesta?: unknown;
      comentarios?: unknown;
      recomendaria_servicio?: unknown;
      cliente_respondio?: unknown;
      solicito_nueva_encuesta?: unknown;
    } | null,
    tabKey: string
  ): boolean {
    if (!solicitud) return false;
    switch ((tabKey || '').toString()) {
      case 'oferta': {
        // Chulo solo cuando el usuario elige SÍ en seguimiento oferta
        return solicitud.realizo_seguimiento_oferta === 1 || solicitud.realizo_seguimiento_oferta === true;
      }
      case 'revision': {
        // Chulo cuando ya existe concepto_final
        return !!solicitud.concepto_final;
      }
      case 'encuesta': {
        // Mantener la lógica existente para encuesta
        if (solicitud.fecha_encuesta) return true;
        if (solicitud.comentarios) return true;
        if (solicitud.recomendaria_servicio === 1 || solicitud.recomendaria_servicio === true) return true;
        if (solicitud.cliente_respondio === 1 || solicitud.cliente_respondio === true) return true;
        if (solicitud.solicito_nueva_encuesta === 1 || solicitud.solicito_nueva_encuesta === true) return true;
        return false;
      }
      default:
        return false;
    }
  }

  onOfertaValorInput(value: string): void {
    // Reject letters immediately: if user types letters, restore previous and show error
    if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(String(value || ''))) {
      this.ofertaValorError = 'Solo se permiten números y separador decimal';
      this.ofertaValorDisplay = this.ofertaValorPrevDisplay;
      return;
    }

    this.ofertaValorError = '';

    // Keep user's raw input in the display while typing to avoid cursor jumps,
    // but enforce a maximum of 13 integer digits and up to 2 decimal digits.
    const rawInput = String(value || '').replace(/[^0-9,.,-]/g, '').trim();

    // Decide decimal separator based on input style
    let intPart = '';
    let decPart = '';
    const hasComma = rawInput.includes(',');
    const hasDot = rawInput.includes('.');
    const lastDot = rawInput.lastIndexOf('.');
    const lastComma = rawInput.lastIndexOf(',');

    if (hasComma && (!hasDot || lastComma > lastDot)) {
      // Comma is the decimal separator; dots are thousands
      const normalized = rawInput.replace(/\./g, '').replace(/,/g, '.');
      const parts = normalized.split('.');
      intPart = parts[0] || '';
      decPart = parts[1] || '';
    } else if (hasDot) {
      const digitsAfterDot = rawInput.length - lastDot - 1;
      if (digitsAfterDot > 2) {
        // Treat dots as thousands separators
        intPart = rawInput.replace(/\./g, '');
      } else {
        intPart = rawInput.slice(0, lastDot).replace(/\./g, '');
        decPart = rawInput.slice(lastDot + 1).replace(/\./g, '');
      }
    } else {
      intPart = rawInput;
    }

    // Enforce limits: if exceeded, reject the new input and restore previous valid display
    if (intPart.length > 13 || decPart.length > 2) {
      // Restore previous valid entry (prevent typing extra digits)
      this.ofertaValorError = 'Máx. 13 enteros y 2 decimales';
      this.ofertaValorDisplay = this.ofertaValorPrevDisplay;
      return;
    }

    // Reconstruct normalized value without thousands separators to keep typing stable
    const normalized = decPart ? `${intPart}.${decPart}` : intPart;

    // Update internal numeric value
    if (normalized === '' || normalized === '.') {
      this.ofertaValor = null;
      this.ofertaValorDisplay = '';
      this.ofertaValorPrevDisplay = '';
      this.ofertaValorError = '';
    } else {
      const num = Number(normalized);
      this.ofertaValor = isNaN(num) ? null : num;
      // Show unformatted numeric string while typing to avoid cursor jumps
      this.ofertaValorDisplay = decPart ? `${intPart}.${decPart}` : intPart;
      this.ofertaValorPrevDisplay = this.ofertaValorDisplay;
      this.ofertaValorError = '';
    }
  }

  onOfertaValorFocus(): void {
    // When focusing, show the raw numeric value (no formatting) to allow smooth editing
    if (this.ofertaValor !== null && this.ofertaValor !== undefined) {
      // Use plain number string without thousands separators
      this.ofertaValorDisplay = String(this.ofertaValor);
    }
  }

  onOfertaValorBlur(): void {
    // When leaving the field, show formatted currency for clarity
    if (this.ofertaValor !== null && this.ofertaValor !== undefined && !isNaN(Number(this.ofertaValor))) {
      this.ofertaValorDisplay = this.formatCurrency(this.ofertaValor);
    } else {
      this.ofertaValorDisplay = '';
    }
  }

  // Control de formularios (mostrar/ocultar desde las tarjetas de acción)
  formularioActivo: string | null = null;

  // Mostrar/ocultar formularios al pulsar las tarjetas de acción
  async toggleFormulario(tipo: string) {
    if (this.formularioActivo === tipo) {
      this.formularioActivo = null;
    } else {
      // cerrar cualquiera abierto y abrir el solicitado
      this.formularioActivo = tipo;
      if (this.formularioActivo === 'solicitud-documentos-plantilla') {
        this.tplSolicitudDocEntidad = 'solicitud';
        this.tplSolicitudDocFiltroTipo = 'todos';
        this.tplSolicitudDocBusqueda = '';
        this.tplSolicitudDocResultados = [];
        this.tplSolicitudDocSeleccionado = null;
        this.tplSolicitudDocPlantillaId = null;
        this.tplSolicitudDocNombrePlantilla = '';
        this.tplSolicitudDocTemplateFile = null;
        this.tplSolicitudDocMsg = '';
        this.tplSolicitudDocLoading = false;
        this.tplSolicitudDocUploadLoading = false;
        try {
          const el = this.tplSolicitudDocTemplateInput?.nativeElement;
          if (el) el.value = '';
        } catch {
          void 0;
        }
        await this.cargarClientesDocumentos();
        await this.cargarSolicitudesDocumentos();
        await this.cargarPlantillasDocumentoSolicitud();
      }
    }
  }

  // Auto-resize handler for modal textareas: expand height as user types, up to a limit
  autoResizeTextarea(e: Event): void {
    try {
      const el = e.target as HTMLTextAreaElement | null;
      if (!el) return;
      // reset to auto to correctly measure scrollHeight
      el.style.height = 'auto';
      const scroll = el.scrollHeight;
      const viewportMax = Math.floor(window.innerHeight * 0.6); // up to 60% of viewport
      const newHeight = Math.min(scroll, viewportMax);
      el.style.height = `${newHeight}px`;
    } catch {
      void 0;
    }
  }
}

import { Component, signal, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientesService } from '../services/clientes/clientes.service';
import { SolicitudesService } from '../services/clientes/solicitudes.service';
import { LocationsService } from '../services/clientes/locations.service';
import { UtilsService } from '../services/clientes/utils.service';
import { SnackbarService } from '../shared/snackbar.service';
import { authService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-solicitudes',
  imports: [CommonModule, FormsModule, RouterModule],
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

  // Signals desde servicios
  clientes = this.clientesService.clientes;
  solicitudes = this.solicitudesService.solicitudes;
  departamentos = this.locationsService.departamentos;
  ciudades = this.locationsService.ciudades;

  // Signals locales
  clientesFiltrados = signal<Array<any>>([]);
  solicitudesFiltradas = signal<Array<any>>([]);

  // Variables de estado para errores de validación
  clienteErrors: { [key: string]: string } = {};
  solicitudErrors: { [key: string]: string } = {};
  ofertaErrors: { [key: string]: string } = {};
  resultadoErrors: { [key: string]: string } = {};
  encuestaErrors: { [key: string]: string } = {};

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
  showTipoPoblModal: boolean = false;
  modalTipoPoblText: string = '';
  clienteDireccion = '';
  clienteIdCiudad = '';
  clienteIdDepartamento = '';
  clienteCelular = '';
  clienteTelefono = '';
  clienteTipoVinc = '';
  clienteRegistroPor = '';
  clienteObservaciones = '';
  clientesQ = '';
  solicitudesQ = '';

  solicitudClienteId: any = '';
  solicitudNombre = '';
  solicitudTipo = '';
  solicitudLote = '';
  solicitudFechaVenc = '';
  solicitudFechaSolicitud = '';
  solicitudNumeroFrontPreview: string = '';
  solicitudTipoMuestra = '';
  solicitudCondEmpaque = '';
  solicitudTipoEmpaqueCustomOptions: string[] = [];
  showTipoEmpaqueModal: boolean = false;
  modalTipoEmpaqueText: string = '';
  solicitudTipoAnalisis = '';
  solicitudTipoAnalisisCustomOptions: string[] = [];
  showTipoAnalisisModal: boolean = false;
  modalTipoAnalisisText: string = '';
  solicitudRequiereVarios: any = '';
  solicitudCantidad: number | null = null;
  solicitudFechaEstimada = '';
  solicitudPuedeSuministrar: any = '';
  solicitudServicioViable: any = false;
  solicitudRecibida: string = '';
  solicitudRecibePersonal: string = '';
  solicitudCargoPersonal: string = '';
  solicitudObservaciones: string = '';
  solicitudConsecutivo: number | null = null;

  ofertaSolicitudId: any = '';
  ofertaGeneroCotizacion: any = '';
  ofertaValor: number | null = null;
  ofertaFechaEnvio = '';
  ofertaRealizoSeguimiento: any = '';
  ofertaObservacion = '';

  resultadoSolicitudId: any = '';
  resultadoFechaLimite = '';
  resultadoNumeroInforme = '';
  resultadoFechaEnvio = '';
  resultadoServicioViable: any = '';

  encuestaSolicitudId: any = '';
  encuestaFecha = '';
  encuestaPuntuacion: number | null = null;
  encuestaComentarios = '';
  encuestaRecomendaria: any = '';
  encuestaClienteRespondio: any = '';
  encuestaSolicitoNueva: any = '';

  // Formulario alterno: actualizar viabilidad
  viableSolicitudId: any = '';
  viableEstado: any = '';

  // Estado UI
  detallesVisibles: { [key: number]: boolean } = {};
  solicitudExpandida: number | null = null;
  lastCopiedMessage: string | null = null;
  
  // Tabs para tarjetas de solicitudes
  solicitudTabs = [
    { key: 'detalle', label: 'Detalle' },
    { key: 'oferta', label: 'Oferta' },
    { key: 'revision', label: 'Revisión' },
    { key: 'encuesta', label: 'Encuesta' }
  ];
  activeSolicitudTab: { [id: number]: string } = {};

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
  }

  ngOnDestroy() {
    console.log('🔴 Solicitudes component: Destruyendo...');
  }

  private async loadInitialData(): Promise<void> {
    console.log('🔄 Cargando datos iniciales...');
    try {
      await this.locationsService.loadDepartamentos();
      console.log('✅ Departamentos cargados:', this.departamentos().length);
      await this.loadClientes();
      console.log('✅ Clientes cargados:', this.clientes().length);
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
      this.computeNextSolicitudConsecutivo();
    } catch (err) {
      console.error('❌ Error cargando datos iniciales:', err);
      this.manejarError(err, 'cargar datos iniciales');
    }
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
      if (!this.solicitudConsecutivo || Number(this.solicitudConsecutivo) < siguiente) {
        this.solicitudConsecutivo = siguiente;
      }
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
      const t = (s.tipo_solicitud || '').trim();
      const y = s.fecha_solicitud ? new Date(s.fecha_solicitud).getFullYear() : new Date().getFullYear();
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

  onDepartamentoChange(): void {
    this.clienteIdCiudad = '';
    (async () => {
      try {
        await this.locationsService.loadCiudades(this.clienteIdDepartamento);
        const count = this.ciudades().length;
        if (count === 0) {
          this.snackbarService.warn('No se encontraron ciudades para el departamento seleccionado');
        }
      } catch (err: any) {
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
      const ciudad = (cliente.ciudad || '').toLowerCase();
      const departamento = (cliente.departamento || '').toLowerCase();
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

  filtrarSolicitudes(): void {
    const base = [...this.solicitudes()];
    
    // Ordenar por fecha y luego por id
    const arr = base.sort((a, b) => {
      const da = a.fecha_solicitud ? new Date(a.fecha_solicitud).getTime() : 0;
      const db = b.fecha_solicitud ? new Date(b.fecha_solicitud).getTime() : 0;
      if (da !== db) return da - db;
      return (a.solicitud_id || a.id_solicitud || 0) - (b.solicitud_id || b.id_solicitud || 0);
    });

    // Normalizar campos
    const normalized = arr.map((s) => {
      const id = s?.solicitud_id ?? s?.id_solicitud ?? s?.solicitudId ?? null;
      const tipo = (s?.tipo_solicitud ?? s?.tipo ?? '').toString().trim();
      const fecha = s?.fecha_solicitud ?? s?.created_at ?? s?.fecha ?? null;
      const nombreSolicitante = s?.nombre_solicitante ?? s?.cliente_nombre ?? s?.nombre_cliente ?? (s?.cliente?.nombre) ?? '';
      const nombreMuestra = s?.nombre_muestra ?? s?.muestra_nombre ?? s?.producto_nombre ?? '';
      
      return {
        ...s,
        id_solicitud: id,
        solicitud_id: id,
        tipo_solicitud: tipo,
        fecha_solicitud: fecha,
        nombre_solicitante: nombreSolicitante,
        nombre_muestra: nombreMuestra
      };
    });

    // Calcular consecutivo por año y tipo
    const counters = new Map<string, number>();
    const solicitudes = normalized.map((s) => {
      const tipo = (s.tipo_solicitud || '').trim();
      const fecha = s.fecha_solicitud ? new Date(s.fecha_solicitud) : new Date();
      const year = fecha.getFullYear();
      const key = `${tipo}|${year}`;
      const curr = counters.get(key) || 0;
      const next = curr + 1;
      counters.set(key, next);
      const consecutivoStr = String(next).padStart(2, '0');
      return {
        ...s,
        numero_solicitud_front: tipo ? `${tipo}-${year}-${consecutivoStr}` : `--${year}-${consecutivoStr}`
      };
    });

    if (!this.solicitudesQ.trim()) {
      this.solicitudesFiltradas.set(solicitudes);
      return;
    }

    const filtro = this.solicitudesQ.toLowerCase().trim();
    const solicitudesFiltradas = solicitudes.filter(solicitud => {
      const id = (solicitud.solicitud_id || solicitud.id_solicitud || '').toString();
      const tipo = (solicitud.tipo_solicitud || '').toLowerCase();
      const numeroFront = (solicitud.numero_solicitud_front || '').toLowerCase();
      const nombreSolicitante = (solicitud.nombre_solicitante || '').toLowerCase();
      const nombreMuestra = (solicitud.nombre_muestra || '').toLowerCase();
      const tipoMuestra = (solicitud.tipo_muestra || '').toLowerCase();
      const tipoAnalisis = (solicitud.analisis_requerido || '').toLowerCase();
      const lote = (solicitud.lote_producto || '').toLowerCase();
      
      return id.includes(filtro) || tipo.includes(filtro) ||
             numeroFront.includes(filtro) || nombreSolicitante.includes(filtro) ||
             nombreMuestra.includes(filtro) || tipoMuestra.includes(filtro) ||
             tipoAnalisis.includes(filtro) || lote.includes(filtro);
    });
    
    this.solicitudesFiltradas.set(solicitudesFiltradas);
  }

  // ========== VALIDACIONES ==========
  validarCliente(): boolean {
    this.clienteErrors = {};
    let isValid = true;

    if (!this.clienteNombre.trim()) {
      this.clienteErrors['nombre'] = 'El nombre es obligatorio';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,50}$/.test(this.clienteNombre)) {
      this.clienteErrors['nombre'] = 'Solo letras y espacios (máx 50 caracteres)';
      isValid = false;
    }

    if (!this.clienteNumero) {
      this.clienteErrors['numero'] = 'El número es obligatorio';
      isValid = false;
    }

    if (!this.clienteFechaVinc) {
      this.clienteErrors['fechaVinc'] = 'La fecha es obligatoria';
      isValid = false;
    } else {
      const fecha = new Date(this.clienteFechaVinc);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fecha.setHours(0, 0, 0, 0);
      if (fecha > hoy) {
        this.clienteErrors['fechaVinc'] = 'La fecha no puede ser futura';
        isValid = false;
      }
    }

    if (!this.clienteIdNum.trim()) {
      this.clienteErrors['idNum'] = 'El número de identificación es obligatorio';
      isValid = false;
    }

    if (this.clienteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.clienteEmail)) {
      this.clienteErrors['email'] = 'Correo electrónico inválido';
      isValid = false;
    }

    return isValid;
  }

  validarSolicitud(): boolean {
    this.solicitudErrors = {};
    let isValid = true;
    
    if (this.solicitudFechaSolicitud) {
      const f = new Date(this.solicitudFechaSolicitud);
      if (isNaN(f.getTime())) {
        this.solicitudErrors['fechaSolicitud'] = 'Fecha de solicitud inválida';
        isValid = false;
      }
    }

    if (!this.solicitudClienteId) {
      this.solicitudErrors['clienteId'] = 'Debe seleccionar un cliente';
      isValid = false;
    }

    if (!this.solicitudTipo.trim()) {
      this.solicitudErrors['tipo'] = 'Debe seleccionar el tipo de solicitud';
      isValid = false;
    }

    if (!this.solicitudNombre.trim()) {
      this.solicitudErrors['nombre'] = 'El nombre de la muestra es obligatorio';
      isValid = false;
    } else if (this.solicitudNombre.length > 100) {
      this.solicitudErrors['nombre'] = 'Máximo 100 caracteres (' + this.solicitudNombre.length + ' actuales)';
      isValid = false;
    }

    // Validaciones nuevas según esquema
    if (this.solicitudRecibida && this.solicitudRecibida.length > 255) {
      this.solicitudErrors['solicitudRecibida'] = 'Máx 255 caracteres';
      isValid = false;
    }
    
    if (this.solicitudRecibePersonal && this.solicitudRecibePersonal.length > 255) {
      this.solicitudErrors['solicitudRecibePersonal'] = 'Máx 255 caracteres';
      isValid = false;
    }
    
    if (this.solicitudCargoPersonal && this.solicitudCargoPersonal.length > 100) {
      this.solicitudErrors['solicitudCargoPersonal'] = 'Máx 100 caracteres';
      isValid = false;
    }
    
    if (this.solicitudObservaciones && this.solicitudObservaciones.length > 5000) {
      this.solicitudErrors['observaciones'] = 'Observaciones demasiado largas';
      isValid = false;
    }

    return isValid;
  }

  validarOferta(): boolean {
    this.ofertaErrors = {};
    let isValid = true;

    if (!this.ofertaSolicitudId) {
      this.ofertaErrors['solicitudId'] = 'Debe seleccionar una solicitud';
      isValid = false;
    }

    if (!this.ofertaValor) {
      this.ofertaErrors['valor'] = 'El valor de la oferta es obligatorio';
      isValid = false;
    } else if (this.ofertaValor <= 0) {
      this.ofertaErrors['valor'] = 'El valor debe ser mayor a 0';
      isValid = false;
    }

    if (!this.ofertaFechaEnvio) {
      this.ofertaErrors['fechaEnvio'] = 'La fecha de envío es obligatoria';
      isValid = false;
    }

    return isValid;
  }

  validarResultado(): boolean {
    this.resultadoErrors = {};
    let isValid = true;

    if (!this.resultadoSolicitudId) {
      this.resultadoErrors['solicitudId'] = 'Debe seleccionar una solicitud';
      isValid = false;
    }

    if (!this.resultadoFechaLimite) {
      this.resultadoErrors['fechaLimite'] = 'La fecha límite es obligatoria';
      isValid = false;
    }

    if (!this.resultadoNumeroInforme) {
      this.resultadoErrors['numeroInforme'] = 'El número de informe es obligatorio';
      isValid = false;
    }

    if (!this.resultadoFechaEnvio) {
      this.resultadoErrors['fechaEnvio'] = 'La fecha de envío es obligatoria';
      isValid = false;
    }

    if (this.resultadoServicioViable === '') {
      this.resultadoErrors['servicioViable'] = 'Debe indicar si el servicio es viable';
      isValid = false;
    }

    return isValid;
  }

  validarEncuesta(): boolean {
    this.encuestaErrors = {};
    let isValid = true;

    if (!this.encuestaSolicitudId) {
      this.encuestaErrors['solicitudId'] = 'Debe seleccionar una solicitud';
      isValid = false;
    }

    if (!this.encuestaFecha) {
      this.encuestaErrors['fecha'] = 'La fecha de la encuesta es obligatoria';
      isValid = false;
    }

    return isValid;
  }

  // ========== OPERACIONES CRUD ==========
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
        tipo_solicitud: this.solicitudTipo,
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
      // Asegurar que la nueva solicitud se vea inmediatamente en la lista filtrada
      this.filtrarSolicitudes();
      // Expandir la tarjeta recién creada en la pestaña Detalle
      const nid = Number(nuevo?.solicitud_id ?? nuevo?.id_solicitud ?? 0);
      if (nid) {
        this.solicitudExpandida = nid;
        this.activeSolicitudTab[nid] = 'detalle';
      }

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

      this.limpiarFormularioOferta();

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
        Codigo_informe_resultados: this.resultadoNumeroInforme,
        fecha_envio_resultados: this.resultadoFechaEnvio,
        servicio_es_viable: this.resultadoServicioViable ? 1 : 0
      };

      await this.solicitudesService.upsertRevision(Number(this.resultadoSolicitudId), body);

      this.snackbarService.success('✅ Resultados registrados exitosamente');
      this.resultadoErrors = {};

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
        recomendaria_servicio: this.encuestaRecomendaria,
        cliente_respondio: this.encuestaClienteRespondio,
        solicito_nueva_encuesta: this.encuestaSolicitoNueva
      };

      await this.solicitudesService.upsertSeguimientoEncuesta(Number(this.encuestaSolicitudId), body);

      this.snackbarService.success('✅ Encuesta registrada exitosamente');
      this.encuestaErrors = {};

      // Optimistic UX: expand card and show 'encuesta' tab with fresh data
      const sid = Number(this.encuestaSolicitudId);
      if (sid) {
        this.activeSolicitudTab[sid] = 'encuesta';
        this.solicitudExpandida = sid;
        this.filtrarSolicitudes();
      }

      this.limpiarFormularioEncuesta();

    } catch (err: any) {
      console.error('Error creating encuesta:', err);
      this.manejarError(err, 'crear encuesta');
    }
  }

  async deleteCliente(id: number): Promise<void> {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
    
    if (!this.canDelete()) {
      const errorMsg = this.utilsService.getDeleteErrorMessage();
      this.snackbarService.error(`❌ No puedes eliminar clientes: ${errorMsg}`);
      return;
    }

    try {
      await this.clientesService.deleteCliente(id);
      this.snackbarService.success('✅ Cliente eliminado exitosamente');
    } catch (err: any) {
      console.error('deleteCliente', err);
      this.manejarError(err, 'eliminar cliente');
    }
  }

  async deleteSolicitud(id: number): Promise<void> {
    if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) return;
    
    if (!this.canDelete()) {
      const errorMsg = this.utilsService.getDeleteErrorMessage();
      this.snackbarService.error(`❌ No puedes eliminar solicitudes: ${errorMsg}`);
      return;
    }

    try {
      await this.solicitudesService.deleteSolicitud(id);
      this.snackbarService.success('✅ Solicitud eliminada exitosamente');
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
    const mensajesAmigables: {[key: string]: string} = {
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
    this.solicitudClienteId = null;
    this.solicitudNombre = '';
    this.solicitudTipo = '';
    this.solicitudLote = '';
    this.solicitudFechaVenc = '';
    this.solicitudFechaSolicitud = '';
    this.solicitudTipoMuestra = '';
    this.solicitudCondEmpaque = '';
    this.solicitudTipoAnalisis = '';
    this.solicitudRequiereVarios = false;
    this.solicitudCantidad = null;
    this.solicitudFechaEstimada = '';
    this.solicitudPuedeSuministrar = false;
    this.solicitudServicioViable = false;
    this.solicitudRecibida = '';
    this.solicitudRecibePersonal = '';
    this.solicitudCargoPersonal = '';
    this.solicitudObservaciones = '';
    this.computeNextSolicitudConsecutivo();
  }

  private limpiarFormularioOferta(): void {
    this.ofertaSolicitudId = null;
    this.ofertaGeneroCotizacion = false;
    this.ofertaValor = null;
    this.ofertaFechaEnvio = '';
    this.ofertaRealizoSeguimiento = false;
    this.ofertaObservacion = '';
  }

  private limpiarFormularioResultado(): void {
    this.resultadoSolicitudId = null;
    this.resultadoFechaLimite = '';
    this.resultadoNumeroInforme = '';
    this.resultadoFechaEnvio = '';
    this.resultadoServicioViable = false;
  }

  private limpiarFormularioEncuesta(): void {
    this.encuestaSolicitudId = null;
    this.encuestaFecha = '';
    this.encuestaPuntuacion = null;
    this.encuestaComentarios = '';
    this.encuestaRecomendaria = false;
    this.encuestaClienteRespondio = false;
    this.encuestaSolicitoNueva = false;
  }

  // ========== MÉTODOS UI ==========
  canDelete(): boolean {
    return this.utilsService.canDelete();
  }

  toggleClienteDetails(id: number): void {
    this.detallesVisibles[id] = !this.detallesVisibles[id];
  }

  toggleExpandSolicitud(s: any): void {
    const key = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    if (!key) return;
    
    this.solicitudExpandida = this.solicitudExpandida === key ? null : key;
    
    if (this.solicitudExpandida === key && !this.activeSolicitudTab[key]) {
      this.activeSolicitudTab[key] = 'detalle';
    }
    
    // Debug para verificar datos
    console.log('=== DEBUG Solicitud Expandida ===');
    console.log('ID:', key);
    console.log('Datos completos:', s);
    console.log('Campos de oferta:', {
      genero_cotizacion: s?.genero_cotizacion,
      valor_cotizacion: s?.valor_cotizacion,
      fecha_envio_oferta: s?.fecha_envio_oferta,
      realizo_seguimiento_oferta: s?.realizo_seguimiento_oferta,
      observacion_oferta: s?.observacion_oferta
    });
    console.log('Campos de revisión:', {
      fecha_limite_entrega: s?.fecha_limite_entrega,
      Codigo_informe_resultados: s?.Codigo_informe_resultados,
      fecha_envio_resultados: s?.fecha_envio_resultados,
      servicio_es_viable: s?.servicio_es_viable
    });
    console.log('Campos de encuesta:', {
      fecha_encuesta: s?.fecha_encuesta,
      comentarios: s?.comentarios,
      recomendaria_servicio: s?.recomendaria_servicio,
      cliente_respondio: s?.cliente_respondio,
      solicito_nueva_encuesta: s?.solicito_nueva_encuesta
    });
    console.log('=== FIN DEBUG ===');
  }

  isSolicitudExpanded(s: any): boolean {
    const key = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
    return key ? this.solicitudExpandida === key : false;
  }

  selectSolicitudTab(id: number, tabKey: string): void {
    this.activeSolicitudTab[id] = tabKey;
  }

  // Helpers: resolve display names for departamento/ciudad from IDs or codes
  resolveDepartamento(cliente: any): string {
    const nombre = cliente?.departamento;
    if (nombre) return this.formatValue(nombre);
    const codigo = cliente?.id_departamento || cliente?.departamento_codigo;
    const depList = this.departamentos();
    const found = depList.find(d => String(d.codigo) === String(codigo));
    return this.formatValue(found?.nombre) || '—';
  }

  resolveCiudad(cliente: any): string {
    // Try common name keys first
    const nombre = cliente?.ciudad
      || cliente?.ciudad_nombre
      || cliente?.nombre_ciudad
      || cliente?.municipio
      || cliente?.municipio_nombre;
    if (nombre) return this.formatValue(nombre);
    // Try to resolve by code if we have cities loaded
    const codigo = cliente?.id_ciudad || cliente?.ciudad_codigo || cliente?.codigo_ciudad;
    const cityList = this.ciudades();
    if (codigo && Array.isArray(cityList) && cityList.length) {
      const found = cityList.find(c => String(c.codigo) === String(codigo));
      if (found?.nombre) return this.formatValue(found.nombre);
    }
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
        return `${this.formatValue(cliente.ciudad)} / ${this.formatValue(cliente.departamento)}`;
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

  formatValue(val: any): string {
    return this.utilsService.formatValue(val);
  }
}
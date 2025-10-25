import { Component, signal, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService } from '../services/auth.service';

const API = (window as any).__env?.API_BASE || 'http://localhost:3000/api/solicitudes';

@Component({
  standalone: true,
  selector: 'app-solicitudes',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SolicitudesComponent implements OnInit, OnDestroy {
  clientes = signal<Array<any>>([]);
  solicitudes = signal<Array<any>>([]);
  clientesFiltrados = signal<Array<any>>([]);
  solicitudesFiltradas = signal<Array<any>>([]);

  clienteErrors: { [key: string]: string } = {};
  solicitudErrors: { [key: string]: string } = {};
  ofertaErrors: { [key: string]: string } = {};
  resultadoErrors: { [key: string]: string } = {};
  encuestaErrors: { [key: string]: string } = {};

  clienteNombre = '';
  clienteIdNum = '';
  clienteEmail = '';
  clienteNumero: number | null = null;
  clienteFechaVinc = '';
  clienteTipoUsuario = '';
  clienteRazonSocial = '';
  clienteNit = '';
  clienteTipoId = '';
  clienteSexo = 'Otro';
  clienteTipoPobl = '';
  clienteDireccion = '';
  clienteCiudad = '';
  clienteDepartamento = '';
  clienteCelular = '';
  clienteTelefono = '';
  clienteTipoVinc = '';
  clienteRegistroPor = '';
  clienteObservaciones = '';
  clienteMsg = '';
  clientesQ = '';
  solicitudesQ = '';

  solicitudClienteId: any = null;
  solicitudNombre = '';
  solicitudMsg = '';
  solicitudTipo = '';
  solicitudLote = '';
  solicitudFechaVenc = '';
  solicitudTipoMuestra = '';
  solicitudCondEmpaque = '';
  solicitudTipoAnalisis = '';
  solicitudRequiereVarios = false;
  solicitudCantidad: number | null = null;
  solicitudFechaEstimada = '';
  solicitudPuedeSuministrar = false;
  solicitudServicioViable = false;

  // Variables para el formulario de oferta
  ofertaSolicitudId: any = null;
  ofertaGeneroCotizacion = false;
  ofertaValor: number | null = null;
  ofertaFechaEnvio = '';
  ofertaRealizoSeguimiento = false;
  ofertaObservacion = '';
  ofertaMsg = '';

  // Variables para el formulario de resultados
  resultadoSolicitudId: any = null;
  resultadoFechaLimite = '';
  resultadoNumeroInforme = '';
  resultadoFechaEnvio = '';
  resultadoMsg = '';

  // Variables para el formulario de encuesta
  encuestaSolicitudId: any = null;
  encuestaFecha = '';
  encuestaPuntuacion: number | null = null;
  encuestaComentarios = '';
  encuestaRecomendaria = false;
  encuestaClienteRespondio = false;
  encuestaSolicitoNueva = false;
  encuestaMsg = '';

  // Auto-refresh properties
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 segundos
  private isFormActive = false; // Flag para detectar si el cliente está interactuando con formularios

  constructor() {
    // Removed loadClientes() and loadSolicitudes() from constructor
    // They will be called in ngOnInit
  }

  ngOnInit() {
    // Cargar datos inicialmente
    this.loadClientes();
    this.loadSolicitudes();

    // Initialize filtered data
    this.filtrarClientes();
    this.filtrarSolicitudes();

    // Configurar auto-refresh
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    this.stopAutoRefresh();
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(async () => {
      // Solo actualizar si el cliente no está interactuando con formularios
      if (!this.isFormActive) {
        await this.loadClientes();
        await this.loadSolicitudes();
      }
    }, this.REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Métodos para controlar la interacción con formularios
  onFormFocus() {
    this.isFormActive = true;
  }

  onFormBlur() {
    // Usar un pequeño delay para evitar que se active inmediatamente
    setTimeout(() => {
      this.isFormActive = false;
    }, 1000);
  }

  async loadClientes() {
    try {
      const res = await fetch(API + '/clientes');
      const data = await res.json();
      const clientesBasicos = Array.isArray(data) ? data : [];
      
      const clientesCompletos = [];
      for (const cliente of clientesBasicos) {
        try {
          const resCompleto = await fetch(API + '/clientes/' + cliente.id_cliente);
          if (resCompleto.ok) {
            const clienteCompleto = await resCompleto.json();
            clientesCompletos.push(clienteCompleto);
          } else {
            clientesCompletos.push(cliente);
          }
        } catch (err) {
          console.warn('Error obteniendo datos completos del cliente', cliente.id_cliente, err);
          clientesCompletos.push(cliente);
        }
      }
      
      this.clientes.set(clientesCompletos);
      this.filtrarClientes(); // ← IMPORTANTE: Actualizar filtros después de cargar
    } catch (err) {
      console.error('loadClientes', err);
      this.clientes.set([]);
      this.clientesFiltrados.set([]);
    }
  }

  filtrarClientes() {
    const clientes = this.clientes();
    
    // Si no hay texto de búsqueda, mostrar todos
    if (!this.clientesQ.trim()) {
      this.clientesFiltrados.set(clientes);
      return;
    }
    
    const filtro = this.clientesQ.toLowerCase().trim();
    
    // Filtrar por múltiples campos
    const clientesFiltrados = clientes.filter(cliente => {
      const nombre = (cliente.nombre_solicitante || '').toLowerCase();
      const correo = (cliente.correo_electronico || '').toLowerCase();
      const identificacion = (cliente.numero_identificacion || '').toLowerCase();
      const ciudad = (cliente.ciudad || '').toLowerCase();
      const departamento = (cliente.departamento || '').toLowerCase();
      const celular = (cliente.celular || '').toLowerCase();
      const telefono = (cliente.telefono || '').toLowerCase();
      const tipoUsuario = (cliente.tipo_usuario || '').toLowerCase();
      
      return nombre.includes(filtro) ||
             correo.includes(filtro) ||
             identificacion.includes(filtro) ||
             ciudad.includes(filtro) ||
             departamento.includes(filtro) ||
             celular.includes(filtro) ||
             telefono.includes(filtro) ||
             tipoUsuario.includes(filtro);
    });
    
    this.clientesFiltrados.set(clientesFiltrados);
  }

  async loadSolicitudes() {
    try {
      const res = await fetch(API);
      const data = await res.json();
      const solicitudes = Array.isArray(data) ? data : [];
      this.solicitudes.set(solicitudes);
      this.filtrarSolicitudes(); // ← IMPORTANTE: Actualizar filtros después de cargar
    } catch (err) {
      console.error('loadSolicitudes', err);
      this.solicitudes.set([]);
      this.solicitudesFiltradas.set([]);
    }
  }

  filtrarSolicitudes() {
    const solicitudes = this.solicitudes();
    
    // Si no hay texto de búsqueda, mostrar todas
    if (!this.solicitudesQ.trim()) {
      this.solicitudesFiltradas.set(solicitudes);
      return;
    }
    
    const filtro = this.solicitudesQ.toLowerCase().trim();
    
    // Filtrar por múltiples campos
    const solicitudesFiltradas = solicitudes.filter(solicitud => {
      const id = (solicitud.id_solicitud || '').toString();
      const codigo = (solicitud.codigo || '').toLowerCase();
      const nombreSolicitante = (solicitud.nombre_solicitante || '').toLowerCase();
      const nombreMuestra = (solicitud.nombre_muestra_producto || '').toLowerCase();
      const tipoMuestra = (solicitud.tipo_muestra || '').toLowerCase();
      const tipoAnalisis = (solicitud.tipo_analisis_requerido || '').toLowerCase();
      const lote = (solicitud.lote_producto || '').toLowerCase();
      
      return id.includes(filtro) ||
             codigo.includes(filtro) ||
             nombreSolicitante.includes(filtro) ||
             nombreMuestra.includes(filtro) ||
             tipoMuestra.includes(filtro) ||
             tipoAnalisis.includes(filtro) ||
             lote.includes(filtro);
    });
    
    this.solicitudesFiltradas.set(solicitudesFiltradas);
  }

  validarCliente(): boolean {
    this.clienteErrors = {}; // Limpiar errores previos
    let isValid = true;

    // Validar Nombre
    if (!this.clienteNombre.trim()) {
      this.clienteErrors['nombre'] = 'El nombre es obligatorio';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,50}$/.test(this.clienteNombre)) {
      this.clienteErrors['nombre'] = 'Solo letras y espacios (máx 50 caracteres)';
      isValid = false;
    }

    // Validar Número
    if (!this.clienteNumero) {
      this.clienteErrors['numero'] = 'El número es obligatorio';
      isValid = false;
    }

    // Validar Fecha vinculación
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

    // Validar Tipo cliente
    if (!this.clienteTipoUsuario.trim()) {
      this.clienteErrors['tipoUsuario'] = 'Debe seleccionar un tipo de usuario';
      isValid = false;
    }

    // Validar Razón social
    if (!this.clienteRazonSocial.trim()) {
      this.clienteErrors['razonSocial'] = 'La razón social es obligatoria';
      isValid = false;
    } else if (this.clienteRazonSocial.length > 50) {
      this.clienteErrors['razonSocial'] = 'Máximo 50 caracteres (' + this.clienteRazonSocial.length + ' actuales)';
      isValid = false;
    }

    // Validar NIT
    if (!this.clienteNit.trim()) {
      this.clienteErrors['nit'] = 'El NIT es obligatorio';
      isValid = false;
    }

    // Validar Tipo identificación
    if (!this.clienteTipoId.trim()) {
      this.clienteErrors['tipoId'] = 'Debe seleccionar un tipo de identificación';
      isValid = false;
    }

    // Validar Número identificación
    if (!this.clienteIdNum.trim()) {
      this.clienteErrors['idNum'] = 'El número de identificación es obligatorio';
      isValid = false;
    } else if (!/^\d{6,14}$/.test(this.clienteIdNum)) {
      this.clienteErrors['idNum'] = 'Entre 6 y 14 dígitos. Ej: 1234567890';
      isValid = false;
    }

    // Validar Sexo
    if (!this.clienteSexo.trim()) {
      this.clienteErrors['sexo'] = 'Debe seleccionar el sexo';
      isValid = false;
    }

    // Validar Tipo población
    if (!this.clienteTipoPobl.trim()) {
      this.clienteErrors['tipoPobl'] = 'El tipo de población es obligatorio';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,30}$/.test(this.clienteTipoPobl)) {
      this.clienteErrors['tipoPobl'] = 'Solo letras (máx 30 caracteres)';
      isValid = false;
    }

    // Validar Dirección
    if (!this.clienteDireccion.trim()) {
      this.clienteErrors['direccion'] = 'La dirección es obligatoria';
      isValid = false;
    } else if (this.clienteDireccion.length > 100) {
      this.clienteErrors['direccion'] = 'Máximo 100 caracteres (' + this.clienteDireccion.length + ' actuales)';
      isValid = false;
    }

    // Validar Ciudad
    if (!this.clienteCiudad.trim()) {
      this.clienteErrors['ciudad'] = 'La ciudad es obligatoria';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,30}$/.test(this.clienteCiudad)) {
      this.clienteErrors['ciudad'] = 'Solo letras (máx 30 caracteres)';
      isValid = false;
    }

    // Validar Departamento
    if (!this.clienteDepartamento.trim()) {
      this.clienteErrors['departamento'] = 'El departamento es obligatorio';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,30}$/.test(this.clienteDepartamento)) {
      this.clienteErrors['departamento'] = 'Solo letras (máx 30 caracteres)';
      isValid = false;
    }

    // Validar Celular
    if (!this.clienteCelular.trim()) {
      this.clienteErrors['celular'] = 'El celular es obligatorio';
      isValid = false;
    } else if (!/^\d{9,12}$/.test(this.clienteCelular)) {
      this.clienteErrors['celular'] = 'Entre 9 y 12 dígitos. Ej: 3001234567';
      isValid = false;
    }

    // Validar Teléfono
    if (!this.clienteTelefono.trim()) {
      this.clienteErrors['telefono'] = 'El teléfono es obligatorio';
      isValid = false;
    } else if (!/^\d{9,12}$/.test(this.clienteTelefono)) {
      this.clienteErrors['telefono'] = 'Entre 9 y 12 dígitos. Ej: 6012345678';
      isValid = false;
    }

    // Validar Email
    if (!this.clienteEmail.trim()) {
      this.clienteErrors['email'] = 'El correo es obligatorio';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.clienteEmail)) {
      this.clienteErrors['email'] = 'Formato inválido. Ej: cliente@ejemplo.com';
      isValid = false;
    }

    // Validar Tipo vinculación
    if (!this.clienteTipoVinc.trim()) {
      this.clienteErrors['tipoVinc'] = 'El tipo de vinculación es obligatorio';
      isValid = false;
    } else if (this.clienteTipoVinc.length > 50) {
      this.clienteErrors['tipoVinc'] = 'Máximo 50 caracteres (' + this.clienteTipoVinc.length + ' actuales)';
      isValid = false;
    }

    // Validar Registro realizado por
    if (!this.clienteRegistroPor.trim()) {
      this.clienteErrors['registroPor'] = 'Este campo es obligatorio';
      isValid = false;
    } else if (this.clienteRegistroPor.length > 30) {
      this.clienteErrors['registroPor'] = 'Máximo 30 caracteres (' + this.clienteRegistroPor.length + ' actuales)';
      isValid = false;
    }

    // Validar Observaciones
    if (this.clienteObservaciones.length > 300) {
      this.clienteErrors['observaciones'] = 'Máximo 300 caracteres (' + this.clienteObservaciones.length + ' actuales)';
      isValid = false;
    }

    return isValid;
  }

  validarSolicitud(): boolean {
    this.solicitudErrors = {}; // Limpiar errores previos
    let isValid = true;

    // Validar Cliente (obligatorio)
    if (!this.solicitudClienteId) {
      this.solicitudErrors['clienteId'] = 'Debe seleccionar un cliente';
      isValid = false;
    }

    // Validar Tipo de solicitud (obligatorio)
    if (!this.solicitudTipo.trim()) {
      this.solicitudErrors['tipo'] = 'Debe seleccionar el tipo de solicitud';
      isValid = false;
    }

    // Validar Nombre de muestra/producto (obligatorio, máx 100 caracteres)
    if (!this.solicitudNombre.trim()) {
      this.solicitudErrors['nombre'] = 'El nombre de la muestra es obligatorio';
      isValid = false;
    } else if (this.solicitudNombre.length > 100) {
      this.solicitudErrors['nombre'] = 'Máximo 100 caracteres (' + this.solicitudNombre.length + ' actuales)';
      isValid = false;
    }

    // Validar Lote del producto (opcional, pero si hay valor, máx 50 caracteres)
    if (this.solicitudLote.trim() && this.solicitudLote.length > 50) {
      this.solicitudErrors['lote'] = 'Máximo 50 caracteres (' + this.solicitudLote.length + ' actuales)';
      isValid = false;
    }

    // Validar Fecha de vencimiento (opcional, pero no puede ser pasada)
    if (this.solicitudFechaVenc) {
      const fechaVenc = new Date(this.solicitudFechaVenc);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaVenc.setHours(0, 0, 0, 0);

      if (fechaVenc < hoy) {
        this.solicitudErrors['fechaVenc'] = 'La fecha de vencimiento no puede ser pasada';
        isValid = false;
      }
    }

    // Validar Tipo de muestra (obligatorio, máx 50 caracteres)
    if (!this.solicitudTipoMuestra.trim()) {
      this.solicitudErrors['tipoMuestra'] = 'El tipo de muestra es obligatorio';
      isValid = false;
    } else if (this.solicitudTipoMuestra.length > 50) {
      this.solicitudErrors['tipoMuestra'] = 'Máximo 50 caracteres (' + this.solicitudTipoMuestra.length + ' actuales)';
      isValid = false;
    }

    // Validar Condiciones de empaque (opcional, máx 200 caracteres)
    if (this.solicitudCondEmpaque.trim() && this.solicitudCondEmpaque.length > 200) {
      this.solicitudErrors['condEmpaque'] = 'Máximo 200 caracteres (' + this.solicitudCondEmpaque.length + ' actuales)';
      isValid = false;
    }

    // Validar Tipo de análisis (obligatorio, máx 100 caracteres)
    if (!this.solicitudTipoAnalisis.trim()) {
      this.solicitudErrors['tipoAnalisis'] = 'El tipo de análisis es obligatorio';
      isValid = false;
    } else if (this.solicitudTipoAnalisis.length > 100) {
      this.solicitudErrors['tipoAnalisis'] = 'Máximo 100 caracteres (' + this.solicitudTipoAnalisis.length + ' actuales)';
      isValid = false;
    }

    // Validar Cantidad de muestras (obligatorio, debe ser mayor a 0 y menor a 1000)
    if (!this.solicitudCantidad) {
      this.solicitudErrors['cantidad'] = 'La cantidad de muestras es obligatoria';
      isValid = false;
    } else if (this.solicitudCantidad <= 0) {
      this.solicitudErrors['cantidad'] = 'La cantidad debe ser mayor a 0';
      isValid = false;
    } else if (this.solicitudCantidad > 1000) {
      this.solicitudErrors['cantidad'] = 'La cantidad no puede ser mayor a 1000';
      isValid = false;
    }

    // Validar Fecha estimada de entrega (obligatoria, debe ser futura)
    if (!this.solicitudFechaEstimada) {
      this.solicitudErrors['fechaEstimada'] = 'La fecha estimada de entrega es obligatoria';
      isValid = false;
    } else {
      const fechaEst = new Date(this.solicitudFechaEstimada);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaEst.setHours(0, 0, 0, 0);

      if (fechaEst < hoy) {
        this.solicitudErrors['fechaEstimada'] = 'La fecha debe ser igual o posterior a hoy';
        isValid = false;
      }

      // La fecha estimada no debe ser más de 1 año en el futuro
      const unAnio = new Date();
      unAnio.setFullYear(unAnio.getFullYear() + 1);
      if (fechaEst > unAnio) {
        this.solicitudErrors['fechaEstimada'] = 'La fecha no puede ser mayor a 1 año desde hoy';
        isValid = false;
      }
    }

    return isValid;
  }

  validarOferta(): boolean {
    this.ofertaErrors = {}; // Limpiar errores previos
    let isValid = true;

    // Validar Solicitud (obligatorio)
    if (!this.ofertaSolicitudId) {
      this.ofertaErrors['solicitudId'] = 'Debe seleccionar una solicitud';
      isValid = false;
    }

    // Validar Valor de la oferta (obligatorio, debe ser mayor a 0)
    if (!this.ofertaValor) {
      this.ofertaErrors['valor'] = 'El valor de la oferta es obligatorio';
      isValid = false;
    } else if (this.ofertaValor <= 0) {
      this.ofertaErrors['valor'] = 'El valor debe ser mayor a 0';
      isValid = false;
    } else if (this.ofertaValor > 999999999) {
      this.ofertaErrors['valor'] = 'El valor no puede superar 999,999,999';
      isValid = false;
    }

    // Validar Fecha de envío (obligatoria, puede ser pasada o futura)
    if (!this.ofertaFechaEnvio) {
      this.ofertaErrors['fechaEnvio'] = 'La fecha de envío es obligatoria';
      isValid = false;
    }

    // Validar Observación (opcional, pero si hay valor, máx 500 caracteres)
    if (this.ofertaObservacion.trim() && this.ofertaObservacion.length > 500) {
      this.ofertaErrors['observacion'] = 'Máximo 500 caracteres (' + this.ofertaObservacion.length + ' actuales)';
      isValid = false;
    }

    // Si marcó "generó cotización", debe haber un valor
    if (this.ofertaGeneroCotizacion && !this.ofertaValor) {
      this.ofertaErrors['valor'] = 'Si generó cotización, debe ingresar un valor';
      isValid = false;
    }

    return isValid;
  }

  validarResultado(): boolean {
    this.resultadoErrors = {}; // Limpiar errores previos
    let isValid = true;

    // Validar Solicitud (obligatorio)
    if (!this.resultadoSolicitudId) {
      this.resultadoErrors['solicitudId'] = 'Debe seleccionar una solicitud';
      isValid = false;
    }

    // Validar Fecha límite (obligatoria, debe ser futura o hoy)
    if (!this.resultadoFechaLimite) {
      this.resultadoErrors['fechaLimite'] = 'La fecha límite es obligatoria';
      isValid = false;
    } else {
      const fechaLimite = new Date(this.resultadoFechaLimite);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaLimite.setHours(0, 0, 0, 0);

      if (fechaLimite < hoy) {
        this.resultadoErrors['fechaLimite'] = 'La fecha límite no puede ser pasada';
        isValid = false;
      }
    }

    // Validar Número de informe (obligatorio, máx 50 caracteres, alfanumérico)
    if (!this.resultadoNumeroInforme.trim()) {
      this.resultadoErrors['numeroInforme'] = 'El número de informe es obligatorio';
      isValid = false;
    } else if (this.resultadoNumeroInforme.length > 50) {
      this.resultadoErrors['numeroInforme'] = 'Máximo 50 caracteres (' + this.resultadoNumeroInforme.length + ' actuales)';
      isValid = false;
    } else if (!/^[A-Za-z0-9\-_]+$/.test(this.resultadoNumeroInforme)) {
      this.resultadoErrors['numeroInforme'] = 'Solo letras, números, guiones y guiones bajos';
      isValid = false;
    }

    // Validar Fecha de envío (obligatoria)
    if (!this.resultadoFechaEnvio) {
      this.resultadoErrors['fechaEnvio'] = 'La fecha de envío es obligatoria';
      isValid = false;
    } else {
      // La fecha de envío no puede ser posterior a la fecha límite
      if (this.resultadoFechaLimite) {
        const fechaEnvio = new Date(this.resultadoFechaEnvio);
        const fechaLimite = new Date(this.resultadoFechaLimite);
        fechaEnvio.setHours(0, 0, 0, 0);
        fechaLimite.setHours(0, 0, 0, 0);

        if (fechaEnvio > fechaLimite) {
          this.resultadoErrors['fechaEnvio'] = 'La fecha de envío no puede ser posterior a la fecha límite';
          isValid = false;
        }
      }
    }

    return isValid;
  }

  validarEncuesta(): boolean {
    this.encuestaErrors = {}; // Limpiar errores previos
    let isValid = true;

    // Validar Solicitud (obligatorio)
    if (!this.encuestaSolicitudId) {
      this.encuestaErrors['solicitudId'] = 'Debe seleccionar una solicitud';
      isValid = false;
    }

    // Validar Fecha de encuesta (obligatoria, no puede ser futura)
    if (!this.encuestaFecha) {
      this.encuestaErrors['fecha'] = 'La fecha de la encuesta es obligatoria';
      isValid = false;
    } else {
      const fechaEncuesta = new Date(this.encuestaFecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaEncuesta.setHours(0, 0, 0, 0);

      if (fechaEncuesta > hoy) {
        this.encuestaErrors['fecha'] = 'La fecha de la encuesta no puede ser futura';
        isValid = false;
      }
    }

    // Validar Puntuación (opcional, pero si hay valor, debe estar entre 1 y 10)
    if (this.encuestaPuntuacion !== null && this.encuestaPuntuacion !== undefined) {
      if (this.encuestaPuntuacion < 1 || this.encuestaPuntuacion > 10) {
        this.encuestaErrors['puntuacion'] = 'La puntuación debe estar entre 1 y 10';
        isValid = false;
      }
    }

    // Validar Comentarios (opcional, pero si hay valor, máx 1000 caracteres)
    if (this.encuestaComentarios.trim() && this.encuestaComentarios.length > 1000) {
      this.encuestaErrors['comentarios'] = 'Máximo 1000 caracteres (' + this.encuestaComentarios.length + ' actuales)';
      isValid = false;
    }

    // Si el cliente respondió la encuesta, debe haber puntuación
    if (this.encuestaClienteRespondio && !this.encuestaPuntuacion) {
      this.encuestaErrors['puntuacion'] = 'Si el cliente respondió, debe ingresar una puntuación';
      isValid = false;
    }

    return isValid;
  }

  async createCliente(e: Event) {
    e.preventDefault();

    if (!this.validarCliente()) {
      this.clienteMsg = '⚠️ Por favor corrige los errores en el formulario';
      return;
    }

    try {
      const payload: any = {
        nombre_solicitante: this.clienteNombre,
        numero: this.clienteNumero,
        fecha_vinculacion: this.clienteFechaVinc,
        tipo_usuario: this.clienteTipoUsuario,
        razon_social: this.clienteRazonSocial,
        nit: this.clienteNit,
        tipo_identificacion: this.clienteTipoId,
        numero_identificacion: this.clienteIdNum,
        sexo: this.clienteSexo,
        tipo_poblacion: this.clienteTipoPobl,
        direccion: this.clienteDireccion,
        ciudad: this.clienteCiudad,
        departamento: this.clienteDepartamento,
        celular: this.clienteCelular,
        telefono: this.clienteTelefono,
        correo_electronico: this.clienteEmail,
        tipo_vinculacion: this.clienteTipoVinc,
        registro_realizado_por: this.clienteRegistroPor,
        observaciones: this.clienteObservaciones
      };
      const res = await fetch(API + '/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());

      this.clienteMsg = '✅ Cliente creado exitosamente';
      this.clienteErrors = {}; // Limpiar errores

      // Limpiar formulario
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
      this.clienteCiudad = '';
      this.clienteDepartamento = '';
      this.clienteCelular = '';
      this.clienteTelefono = '';
      this.clienteTipoVinc = '';
      this.clienteRegistroPor = '';
      this.clienteObservaciones = '';

      setTimeout(() => {
        this.clienteMsg = '';
      }, 3000);

      await this.loadClientes();
    } catch (err: any) {
      this.clienteMsg = '❌ Error: ' + (err.message || err);
    }
  }

  async createSolicitud(e: Event) {
    e.preventDefault();

    if (!this.validarSolicitud()) {
      this.solicitudMsg = '⚠️ Por favor corrige los errores en el formulario';
      return;
    }

    try {
      const body: any = {
        id_cliente: this.solicitudClienteId,
        nombre_muestra_producto: this.solicitudNombre,
        codigo: this.solicitudTipo,
        lote_producto: this.solicitudLote || null,
        fecha_vencimiento_producto: this.solicitudFechaVenc || null,
        tipo_muestra: this.solicitudTipoMuestra,
        condiciones_empaque: this.solicitudCondEmpaque || null,
        tipo_analisis_requerido: this.solicitudTipoAnalisis,
        requiere_varios_analisis: this.solicitudRequiereVarios ? 1 : 0,
        cantidad_muestras_analizar: this.solicitudCantidad,
        fecha_estimada_entrega_muestra: this.solicitudFechaEstimada,
        puede_suministrar_informacion_adicional: this.solicitudPuedeSuministrar ? 1 : 0,
        servicio_viable: this.solicitudServicioViable ? 1 : 0,
      };

      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      this.solicitudMsg = '✅ Solicitud creada exitosamente';
      this.solicitudErrors = {}; // Limpiar errores

      // Limpiar todos los campos del formulario después de crear la solicitud
      this.solicitudClienteId = null;
      this.solicitudNombre = '';
      this.solicitudTipo = '';
      this.solicitudLote = '';
      this.solicitudFechaVenc = '';
      this.solicitudTipoMuestra = '';
      this.solicitudCondEmpaque = '';
      this.solicitudTipoAnalisis = '';
      this.solicitudRequiereVarios = false;
      this.solicitudCantidad = null;
      this.solicitudFechaEstimada = '';
      this.solicitudPuedeSuministrar = false;
      this.solicitudServicioViable = false;

      setTimeout(() => {
        this.solicitudMsg = '';
      }, 3000);

      await this.loadSolicitudes();
    } catch (err: any) {
      this.solicitudMsg = '❌ Error: ' + (err.message || err);
    }
  }

  async createOferta(e: Event) {
    e.preventDefault();

    if (!this.validarOferta()) {
      this.ofertaMsg = '⚠️ Por favor corrige los errores en el formulario';
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

      const res = await fetch(API + '/' + this.ofertaSolicitudId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      this.ofertaMsg = '✅ Oferta actualizada exitosamente';
      this.ofertaErrors = {}; // Limpiar errores

      // Limpiar formulario
      this.ofertaSolicitudId = null;
      this.ofertaGeneroCotizacion = false;
      this.ofertaValor = null;
      this.ofertaFechaEnvio = '';
      this.ofertaRealizoSeguimiento = false;
      this.ofertaObservacion = '';

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.ofertaMsg = '';
      }, 3000);

      // Recargar solicitudes para actualizar el checkbox de oferta
      await this.loadSolicitudes();
    } catch (err: any) {
      this.ofertaMsg = '❌ Error: ' + (err.message || err);
    }
  }

  async createResultado(e: Event) {
    e.preventDefault();

    if (!this.validarResultado()) {
      this.resultadoMsg = '⚠️ Por favor corrige los errores en el formulario';
      return;
    }

    try {
      const body = {
        fecha_limite_entrega_resultados: this.resultadoFechaLimite,
        numero_informe_resultados: this.resultadoNumeroInforme,
        fecha_envio_resultados: this.resultadoFechaEnvio
      };

      const res = await fetch(API + '/' + this.resultadoSolicitudId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      this.resultadoMsg = '✅ Resultados actualizados exitosamente';
      this.resultadoErrors = {}; // Limpiar errores

      // Limpiar formulario
      this.resultadoSolicitudId = null;
      this.resultadoFechaLimite = '';
      this.resultadoNumeroInforme = '';
      this.resultadoFechaEnvio = '';

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.resultadoMsg = '';
      }, 3000);

      await this.loadSolicitudes();
    } catch (err: any) {
      this.resultadoMsg = '❌ Error: ' + (err.message || err);
    }
  }

  async createEncuesta(e: Event) {
    e.preventDefault();

    if (!this.validarEncuesta()) {
      this.encuestaMsg = '⚠️ Por favor corrige los errores en el formulario';
      return;
    }

    try {
      const body = {
        id_solicitud: this.encuestaSolicitudId,
        fecha_encuesta: this.encuestaFecha,
        puntuacion_satisfaccion: this.encuestaPuntuacion || null,
        comentarios: this.encuestaComentarios || null,
        recomendaria_servicio: this.encuestaRecomendaria,
        cliente_respondio_encuesta: this.encuestaClienteRespondio,
        solicito_nueva_encuesta: this.encuestaSolicitoNueva
      };

      const res = await fetch(API + '/encuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      this.encuestaMsg = '✅ Encuesta creada exitosamente';
      this.encuestaErrors = {}; // Limpiar errores

      // Limpiar formulario
      this.encuestaSolicitudId = null;
      this.encuestaFecha = '';
      this.encuestaPuntuacion = null;
      this.encuestaComentarios = '';
      this.encuestaRecomendaria = false;
      this.encuestaClienteRespondio = false;
      this.encuestaSolicitoNueva = false;

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.encuestaMsg = '';
      }, 3000);

      await this.loadSolicitudes();
    } catch (err: any) {
      this.encuestaMsg = '❌ Error: ' + (err.message || err);
    }
  }

  async deleteCliente(id: number) {
    if (!confirm('¿Borrar este cliente?')) return;
    try {
      const res = await fetch(API + '/clientes/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await this.loadClientes();
    } catch (err) {
      console.error('deleteCliente', err);
    }
  }

  async toggleCheck(s: any, field: string, value: any) {
    try {
      const body: any = {};
      // For numeric/bool fields we send 1/0
      if (field === 'numero_informe_resultados') {
        body[field] = value ? '1' : null;
      } else {
        body[field] = value ? 1 : 0;
      }
      const res = await fetch(API + '/solicitudes/' + s.id_solicitud, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      // update local copy
      s[field] = body[field];
    } catch (err) {
      console.error('toggleCheck', err);
    }
  }

  async deleteSolicitud(id: number) {
    if (!confirm('¿Borrar esta solicitud?')) return;
    try {
      const res = await fetch(API + '/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await this.loadSolicitudes();
    } catch (err) {
      console.error('deleteSolicitud', err);
    }
  }

  // Estado para mostrar/ocultar detalles por cliente
  detallesVisibles: { [key: number]: boolean } = {};

  toggleClienteDetails(id: number) {
    this.detallesVisibles[id] = !this.detallesVisibles[id];
  }

  async copyToClipboard(value: string | null): Promise<boolean> {
    // ignore empty or placeholder values
    if (!value || value === '-' ) return false;
    try {
      await navigator.clipboard.writeText(value.toString());
      // Optionally, show a small temporary message in the console (UI toast can be added later)
      console.info('Copiado al portapapeles:', value);
      return true;
    } catch (err) {
      console.error('No se pudo copiar:', err);
      return false;
    }
  }

  // wrapper to copy and show a temporary global toast for a specific field
  async copyField(key: string, value: string | null) {
    const ok = await this.copyToClipboard(value);
    if (!ok) return;
    this.showToast('Copiado');
  }

  // Global toast message for copy feedback
  lastCopiedMessage: string | null = null;

  showToast(message: string, ms = 1400) {
    this.lastCopiedMessage = message;
    setTimeout(() => { this.lastCopiedMessage = null; }, ms);
  }

  // Format ISO / date-like strings into a nicer local representation
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      // e.g. "13 Oct 2025, 14:23" (locale-sensitive)
      return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // Generic formatter used in templates
  formatValue(val: any): string {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'string') {
      // simple ISO date detection (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
      if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(val)) return this.formatDate(val);
      return val;
    }
    return val.toString();
  }
}
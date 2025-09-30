import { Component, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authService } from '../services/auth.service';


const API = (window as any).__env?.API_BASE || 'http://localhost:3000/api/solicitudes';

@Component({
  standalone: true,
  selector: 'app-solicitudes',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './solicitudes.component.html'
})
export class SolicitudesComponent implements OnInit, OnDestroy {
  usuarios = signal<Array<any>>([]);
  solicitudes = signal<Array<any>>([]);
  usuariosFiltrados = signal<Array<any>>([]);
  solicitudesFiltradas = signal<Array<any>>([]);
  
  // Auto-refresh properties
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 segundos
  private isFormActive = false; // Flag para detectar si el usuario está interactuando con formularios

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

  solicitudUsuarioId: any = null;
  solicitudNombre = '';
  solicitudMsg = '';
  // seguimiento checks are handled in the list and toggleCheck()
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

  constructor() {
    // Removed loadUsuarios() and loadSolicitudes() from constructor
    // They will be called in ngOnInit
  }

  ngOnInit() {
    // Cargar datos inicialmente
    this.loadUsuarios();
    this.loadSolicitudes();
    
    // Initialize filtered data
    this.filtrarUsuarios();
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
      // Solo actualizar si el usuario no está interactuando con formularios
      if (!this.isFormActive) {
        await this.loadUsuarios();
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

  async loadUsuarios() {
    try {
      // Primero obtenemos la lista básica de usuarios
      const res = await fetch(API + '/usuarios');
      const data = await res.json();
      // Asegurar que siempre sea un array
      const usuariosBasicos = Array.isArray(data) ? data : [];
      
      // Ahora obtenemos la información completa de cada usuario
      const usuariosCompletos = [];
      for (const usuario of usuariosBasicos) {
        try {
          const resCompleto = await fetch(API + '/usuarios/' + usuario.id_usuario);
          if (resCompleto.ok) {
            const usuarioCompleto = await resCompleto.json();
            usuariosCompletos.push(usuarioCompleto);
          } else {
            // Si falla la consulta individual, usar los datos básicos
            usuariosCompletos.push(usuario);
          }
        } catch (err) {
          console.warn('Error obteniendo datos completos del usuario', usuario.id_usuario, err);
          // Si falla la consulta individual, usar los datos básicos
          usuariosCompletos.push(usuario);
        }
      }
      

        
      this.usuarios.set(usuariosCompletos);
      this.filtrarUsuarios();
    } catch (err) {
      console.error('loadUsuarios', err);
      // En caso de error, establecer array vacío
      this.usuarios.set([]);
      this.usuariosFiltrados.set([]);
    }
  }

  filtrarUsuarios() {
    const usuarios = this.usuarios();
    if (!this.clientesQ.trim()) {
      this.usuariosFiltrados.set(usuarios);
      return;
    }
    
    const filtro = this.clientesQ.toLowerCase().trim();
    const usuariosFiltrados = usuarios.filter(usuario => 
      (usuario.nombre_solicitante || '').toLowerCase().includes(filtro) ||
      (usuario.correo_electronico || '').toLowerCase().includes(filtro) ||
      (usuario.numero_identificacion || '').toLowerCase().includes(filtro)
    );
    
    this.usuariosFiltrados.set(usuariosFiltrados);
  }

  async loadSolicitudes() {
    try {
      const res = await fetch(API);
      const data = await res.json();
      // Asegurar que siempre sea un array
      const solicitudes = Array.isArray(data) ? data : [];
      this.solicitudes.set(solicitudes);
      this.filtrarSolicitudes();
    } catch (err) {
      console.error('loadSolicitudes', err);
      // En caso de error, establecer array vacío
      this.solicitudes.set([]);
      this.solicitudesFiltradas.set([]);
    }
  }

  filtrarSolicitudes() {
    const solicitudes = this.solicitudes();
    if (!this.solicitudesQ.trim()) {
      this.solicitudesFiltradas.set(solicitudes);
      return;
    }
    
    const filtro = this.solicitudesQ.toLowerCase().trim();
    const solicitudesFiltradas = solicitudes.filter(solicitud => 
      (solicitud.nombre_solicitud || '').toLowerCase().includes(filtro) ||
      (solicitud.tipo_solicitud || '').toLowerCase().includes(filtro) ||
      (solicitud.tipo_muestra || '').toLowerCase().includes(filtro) ||
      (solicitud.tipo_analisis || '').toLowerCase().includes(filtro) ||
      (solicitud.nombre_solicitante || '').toLowerCase().includes(filtro) ||
      (solicitud.nombre_muestra_producto || '').toLowerCase().includes(filtro) ||
      (solicitud.codigo || '').toLowerCase().includes(filtro) ||
      (solicitud.id_solicitud || '').toString().includes(filtro)
    );
    
    this.solicitudesFiltradas.set(solicitudesFiltradas);
  }

  async createCliente(e: Event) {
    e.preventDefault();
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
      const res = await fetch(API + '/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      this.clienteMsg = 'Cliente creado';
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
      await this.loadUsuarios();
    } catch (err: any) {
      this.clienteMsg = 'Error: ' + (err.message || err);
    }
  }

  async createSolicitud(e: Event) {
    e.preventDefault();
    try {
      const body: any = {
        id_usuario: this.solicitudUsuarioId,
        nombre_muestra_producto: this.solicitudNombre,
        codigo: this.solicitudTipo,
        lote_producto: this.solicitudLote,
        fecha_vencimiento_producto: this.solicitudFechaVenc,
        tipo_muestra: this.solicitudTipoMuestra,
        condiciones_empaque: this.solicitudCondEmpaque,
        tipo_analisis_requerido: this.solicitudTipoAnalisis,
        requiere_varios_analisis: this.solicitudRequiereVarios ? 1 : 0,
        cantidad_muestras_analizar: this.solicitudCantidad,
        fecha_estimada_entrega_muestra: this.solicitudFechaEstimada,
        puede_suministrar_informacion_adicional: this.solicitudPuedeSuministrar ? 1 : 0,
        servicio_viable: this.solicitudServicioViable ? 1 : 0,
        // seguimiento flags are set later via the list toggles
      };
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      this.solicitudMsg = 'Solicitud creada';
      
      // Limpiar todos los campos del formulario después de crear la solicitud
      this.solicitudUsuarioId = null;
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
      
      // keep seguimiento defaults to server-side
      await this.loadSolicitudes();
    } catch (err: any) {
      this.solicitudMsg = 'Error: ' + (err.message || err);
    }
  }

  async createOferta(e: Event) {
    e.preventDefault();
    if (!this.ofertaSolicitudId) {
      this.ofertaMsg = 'Debe seleccionar una solicitud';
      return;
    }
    
    try {
      const body = {
        genero_cotizacion: this.ofertaGeneroCotizacion ? 1 : 0,
        valor_cotizacion: this.ofertaValor,
        fecha_envio_oferta: this.ofertaFechaEnvio,
        realizo_seguimiento_oferta: this.ofertaRealizoSeguimiento ? 1 : 0,
        observacion_oferta: this.ofertaObservacion
      };
      
      const res = await fetch(API + '/' + this.ofertaSolicitudId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      this.ofertaMsg = 'Oferta actualizada exitosamente';
      
      // Limpiar formulario
      this.ofertaSolicitudId = null;
      this.ofertaGeneroCotizacion = false;
      this.ofertaValor = null;
      this.ofertaFechaEnvio = '';
      this.ofertaRealizoSeguimiento = false;
      this.ofertaObservacion = '';
      
      // Recargar solicitudes para actualizar el checkbox de oferta
      await this.loadSolicitudes();
    } catch (err: any) {
      this.ofertaMsg = 'Error: ' + (err.message || err);
    }
  }

  async createResultado(e: Event) {
    e.preventDefault();
    
    if (!this.resultadoSolicitudId) {
      this.resultadoMsg = 'Debe seleccionar una solicitud';
      return;
    }
    
    try {
      const body = {
        fecha_limite_entrega_resultados: this.resultadoFechaLimite || null,
        numero_informe_resultados: this.resultadoNumeroInforme || null,
        fecha_envio_resultados: this.resultadoFechaEnvio || null
      };
      
      const res = await fetch(API + '/' + this.resultadoSolicitudId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      this.resultadoMsg = 'Resultados actualizados exitosamente';
      
      // Limpiar formulario
      this.resultadoSolicitudId = null;
      this.resultadoFechaLimite = '';
      this.resultadoNumeroInforme = '';
      this.resultadoFechaEnvio = '';
      
      // Recargar solicitudes para actualizar la información
      await this.loadSolicitudes();
    } catch (err: any) {
      this.resultadoMsg = 'Error: ' + (err.message || err);
    }
  }

  async createEncuesta(e: Event) {
    e.preventDefault();
    
    if (!this.encuestaSolicitudId) {
      this.encuestaMsg = 'Debe seleccionar una solicitud';
      return;
    }
    
    try {
      const body = {
        id_solicitud: this.encuestaSolicitudId,
        fecha_encuesta: this.encuestaFecha || null,
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
      
      this.encuestaMsg = 'Encuesta creada exitosamente';
      
      // Limpiar formulario
      this.encuestaSolicitudId = null;
      this.encuestaFecha = '';
      this.encuestaPuntuacion = null;
      this.encuestaComentarios = '';
      this.encuestaRecomendaria = false;
      this.encuestaClienteRespondio = false;
      this.encuestaSolicitoNueva = false;
      
      // Recargar solicitudes para actualizar la información
      await this.loadSolicitudes();
    } catch (err: any) {
      this.encuestaMsg = 'Error: ' + (err.message || err);
    }
  }

  async deleteCliente(id: number) {
    if (!confirm('¿Borrar este cliente?')) return;
    try {
      const res = await fetch(API + '/usuarios/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await this.loadUsuarios();
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
}

import { Component } from '@angular/core';
import { equiposService } from '../services/equipos.service';
import { SnackbarService } from '../shared/snackbar.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-equipos',
  templateUrl: './equipos.component.html',
  styleUrls: ['./equipos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class EquiposComponent {
  // Variables para controlar la visibilidad de los formularios
  mostrarFormularios = false;
  mostrarFichaTecnica = false;

  // Variables para búsqueda y autocompletado
  busquedaEquipo = '';
  equiposFiltrados: any[] = [];
  equipoSeleccionado: any = null;

  // Campos para ficha_tecnica_de_equipos
  codigo_identificador = '';
  nombre_ficha = '';
  marca_ficha = '';
  modelo_ficha = '';
  serie_ficha = '';
  fabricante = '';
  fecha_adq = '';
  uso = '';
  fecha_func = '';
  precio: number | null = null;
  accesorios_ficha = '';
  manual_ope = '';
  idioma_manual = '';
  
  // Especificaciones de medición
  magnitud = '';
  resolucion = '';
  precision_med = '';
  exactitud_ficha = '';
  rango_de_medicion = '';
  rango_de_uso = '';
  
  // Especificaciones eléctricas
  voltaje_ficha = '';
  potencia = '';
  amperaje = '';
  frecuencia_ficha = '';
  
  // Dimensiones físicas
  ancho: number | null = null;
  alto: number | null = null;
  peso_kg: number | null = null;
  profundidad: number | null = null;
  
  // Condiciones ambientales
  temperatura_c: number | null = null;
  humedad_porcentaje: number | null = null;
  limitaciones_e_interferencias = '';
  otros = '';
  
  // Especificaciones técnicas del software
  especificaciones_software = '';
  
  // Información del proveedor
  proveedor = '';
  email = '';
  telefono = '';
  fecha_de_instalacion = '';
  alcance_del_servicio = '';
  garantia = '';
  observaciones_ficha = '';
  recibido_por = '';
  cargo_y_firma = '';
  fecha_ficha = '';

  // Campos para intervalo_hv
  consecutivo_intervalo: number | null = null;
  equipo_id_intervalo: string = '';
  unidad_nominal_g: number | null = null;
  calibracion_1: string = '';
  fecha_c1: string = '';
  error_c1_g: number | null = null;
  calibracion_2: string = '';
  fecha_c2: string = '';
  error_c2_g: number | null = null;
  diferencia_dias: number | null = null;
  desviacion: number | null = null;
  deriva: number | null = null;
  tolerancia_g_intervalo: number | null = null;
  intervalo_calibraciones_dias: number | null = null;
  intervalo_calibraciones_anios: number | null = null;

  // Campos para historial_hv
  consecutivo: number | null = null;
  equipo_id: string = '';
  fecha: string = '';
  tipo_historial: string = '';
  codigo_registro: string = '';
  tolerancia_g: number | null = null;
  tolerancia_error_g: number | null = null;
  incertidumbre_u: number | null = null;
  realizo: string = '';
  superviso: string = '';
  observaciones: string = '';

  // Campos del formulario principal
  codigo_identificacion = '';
  nombre = '';
  modelo = '';
  marca = '';
  inventario_sena = '';
  ubicacion = '';
  acreditacion = '';
  tipo_manual = '';
  numero_serie = '';
  tipo = '';
  clasificacion = '';
  manual_usuario = '';
  puesta_en_servicio = '';
  fecha_adquisicion = '';
  requerimientos_equipo = '';
  elementos_electricos = '';
  voltaje = '';
  elementos_mecanicos = '';
  frecuencia = '';
  campo_medicion = '';
  exactitud = '';
  sujeto_verificar = '';
  sujeto_calibracion = '';
  resolucion_division = '';
  sujeto_calificacion = '';
  accesorios = '';

  equiposRegistrados: any[] = [];

  constructor(public snack: SnackbarService) {
    this.obtenerEquiposRegistrados();
  }

  // Función para buscar equipos
  buscarEquipos() {
    if (this.busquedaEquipo.length < 2) {
      this.equiposFiltrados = [];
      return;
    }
    
    const busqueda = this.busquedaEquipo.toLowerCase();
    this.equiposFiltrados = this.equiposRegistrados.filter(equipo => 
      equipo.codigo_identificacion.toLowerCase().includes(busqueda) ||
      equipo.nombre.toLowerCase().includes(busqueda) ||
      (equipo.marca && equipo.marca.toLowerCase().includes(busqueda)) ||
      (equipo.modelo && equipo.modelo.toLowerCase().includes(busqueda))
    );
  }

  // Función para seleccionar equipo y autocompletar SOLO campos similares
  seleccionarEquipo(equipo: any) {
    this.equipoSeleccionado = equipo;
    this.busquedaEquipo = `${equipo.codigo_identificacion} - ${equipo.nombre}`;
    this.equiposFiltrados = [];
    
    console.log('Datos del equipo seleccionado desde hv_equipos:', equipo);

    // 🔄 CAMPOS SIMILARES ENTRE hv_equipos Y ficha_tecnica_de_equipos
    
    // 1. INFORMACIÓN BÁSICA (Coinciden directamente)
    this.codigo_identificador = equipo.codigo_identificacion || '';
    this.nombre_ficha = equipo.nombre || '';
    this.marca_ficha = equipo.marca || '';
    this.modelo_ficha = equipo.modelo || '';
    this.serie_ficha = equipo.numero_serie || '';
    
    // 2. FECHAS (Coinciden en concepto)
    this.fecha_adq = equipo.fecha_adquisicion || '';
    this.fecha_func = equipo.puesta_en_servicio || '';
    
    // 3. UBICACIÓN/USO (Concepto similar)
    this.uso = equipo.ubicacion || '';
    
    // 4. ESPECIFICACIONES ELÉCTRICAS (Coinciden)
    this.voltaje_ficha = equipo.voltaje || '';
    this.frecuencia_ficha = equipo.frecuencia || '';
    
    // 5. ESPECIFICACIONES TÉCNICAS (Conceptos similares)
    this.magnitud = equipo.campo_medicion || '';
    this.exactitud_ficha = equipo.exactitud || '';
    this.resolucion = equipo.resolucion_division || '';
    
    // 6. ACCESORIOS (Coincide)
    this.accesorios_ficha = equipo.accesorios || '';
    
    // 7. INFORMACIÓN ADICIONAL (Mapeo inteligente)
    this.fabricante = equipo.marca || ''; // Fabricante = Marca
    this.limitaciones_e_interferencias = equipo.requerimientos_equipo || '';
    
    if (equipo.clasificacion) {
      this.otros = `Clasificación: ${equipo.clasificacion}`;
    }

    console.log('Campos similares autocompletados correctamente');
    this.snack.success(`Datos de "${equipo.nombre}" cargados en campos similares`);
  }

  // Limpiar búsqueda
  limpiarBusqueda() {
    this.busquedaEquipo = '';
    this.equiposFiltrados = [];
    this.equipoSeleccionado = null;
  }

  // Función para mostrar/ocultar formularios de hoja de vida
  toggleFormularios() {
    this.mostrarFormularios = !this.mostrarFormularios;
    // Cerrar ficha técnica si está abierta
    if (this.mostrarFormularios) {
      this.mostrarFichaTecnica = false;
    }
  }

  // Función para mostrar/ocultar formulario de ficha técnica
  toggleFichaTecnica() {
    this.mostrarFichaTecnica = !this.mostrarFichaTecnica;
    // Cerrar hoja de vida si está abierta
    if (this.mostrarFichaTecnica) {
      this.mostrarFormularios = false;
      this.limpiarBusqueda();
    }
  }

  async obtenerEquiposRegistrados() {
    try {
      this.equiposRegistrados = await equiposService.listarEquipos();
      console.log('Equipos cargados:', this.equiposRegistrados.length);
    } catch (error: any) {
      this.snack.error('Error al obtener equipos registrados');
    }
  }

  // Método para crear ficha técnica
  async crearFichaTecnica(event: Event) {
    event.preventDefault();
    
    // Validación básica
    if (!this.codigo_identificador || !this.nombre_ficha) {
      this.snack.warn('Código y nombre son obligatorios');
      return;
    }
    
    try {
      await equiposService.crearFichaTecnica({
        codigo_identificador: this.codigo_identificador,
        nombre: this.nombre_ficha,
        marca: this.marca_ficha,
        modelo: this.modelo_ficha,
        serie: this.serie_ficha,
        fabricante: this.fabricante,
        fecha_adq: this.fecha_adq,
        uso: this.uso,
        fecha_func: this.fecha_func,
        precio: this.precio,
        accesorios: this.accesorios_ficha,
        manual_ope: this.manual_ope,
        idioma_manual: this.idioma_manual,
        magnitud: this.magnitud,
        resolucion: this.resolucion,
        precision_med: this.precision_med,
        exactitud: this.exactitud_ficha,
        rango_de_medicion: this.rango_de_medicion,
        rango_de_uso: this.rango_de_uso,
        voltaje: this.voltaje_ficha,
        potencia: this.potencia,
        amperaje: this.amperaje,
        frecuencia: this.frecuencia_ficha,
        ancho: this.ancho,
        alto: this.alto,
        peso_kg: this.peso_kg,
        profundidad: this.profundidad,
        temperatura_c: this.temperatura_c,
        humedad_porcentaje: this.humedad_porcentaje,
        limitaciones_e_interferencias: this.limitaciones_e_interferencias,
        otros: this.otros,
        especificaciones_software: this.especificaciones_software,
        proveedor: this.proveedor,
        email: this.email,
        telefono: this.telefono,
        fecha_de_instalacion: this.fecha_de_instalacion,
        alcance_del_servicio: this.alcance_del_servicio,
        garantia: this.garantia,
        observaciones: this.observaciones_ficha,
        recibido_por: this.recibido_por,
        cargo_y_firma: this.cargo_y_firma,
        fecha: this.fecha_ficha
      });
      this.snack.success('Ficha técnica registrada exitosamente');
      this.resetFormFichaTecnica();
    } catch (error: any) {
      this.snack.error(error.message || 'Error al registrar ficha técnica');
    }
  }

  // Resetear formulario de ficha técnica
  resetFormFichaTecnica() {
    this.codigo_identificador = '';
    this.nombre_ficha = '';
    this.marca_ficha = '';
    this.modelo_ficha = '';
    this.serie_ficha = '';
    this.fabricante = '';
    this.fecha_adq = '';
    this.uso = '';
    this.fecha_func = '';
    this.precio = null;
    this.accesorios_ficha = '';
    this.manual_ope = '';
    this.idioma_manual = '';
    this.magnitud = '';
    this.resolucion = '';
    this.precision_med = '';
    this.exactitud_ficha = '';
    this.rango_de_medicion = '';
    this.rango_de_uso = '';
    this.voltaje_ficha = '';
    this.potencia = '';
    this.amperaje = '';
    this.frecuencia_ficha = '';
    this.ancho = null;
    this.alto = null;
    this.peso_kg = null;
    this.profundidad = null;
    this.temperatura_c = null;
    this.humedad_porcentaje = null;
    this.limitaciones_e_interferencias = '';
    this.otros = '';
    this.especificaciones_software = '';
    this.proveedor = '';
    this.email = '';
    this.telefono = '';
    this.fecha_de_instalacion = '';
    this.alcance_del_servicio = '';
    this.garantia = '';
    this.observaciones_ficha = '';
    this.recibido_por = '';
    this.cargo_y_firma = '';
    this.fecha_ficha = '';
    this.limpiarBusqueda();
  }

  // Los demás métodos permanecen igual...
  async crearIntervalo(event: Event) {
    event.preventDefault();
    
    if (!this.consecutivo_intervalo || !this.equipo_id_intervalo) {
      this.snack.warn('Consecutivo y equipo son obligatorios');
      return;
    }
    
    try {
      await equiposService.crearIntervalo({
        consecutivo: this.consecutivo_intervalo,
        equipo_id: this.equipo_id_intervalo,
        unidad_nominal_g: this.unidad_nominal_g,
        calibracion_1: this.calibracion_1,
        fecha_c1: this.fecha_c1,
        error_c1_g: this.error_c1_g,
        calibracion_2: this.calibracion_2,
        fecha_c2: this.fecha_c2,
        error_c2_g: this.error_c2_g,
        diferencia_dias: this.diferencia_dias,
        desviacion: this.desviacion,
        deriva: this.deriva,
        tolerancia_g: this.tolerancia_g_intervalo,
        intervalo_calibraciones_dias: this.intervalo_calibraciones_dias,
        intervalo_calibraciones_anios: this.intervalo_calibraciones_anios
      });
      this.snack.success('Intervalo registrado exitosamente');
      this.resetFormIntervalo();
    } catch (error: any) {
      this.snack.error(error.message || 'Error al registrar intervalo');
    }
  }

  async crearHistorial(event: Event) {
    event.preventDefault();
    
    if (!this.consecutivo || !this.equipo_id) {
      this.snack.warn('Consecutivo y equipo son obligatorios');
      return;
    }
    
    try {
      await equiposService.crearHistorial({
        consecutivo: this.consecutivo,
        equipo_id: this.equipo_id,
        fecha: this.fecha,
        tipo_historial: this.tipo_historial,
        codigo_registro: this.codigo_registro,
        tolerancia_g: this.tolerancia_g,
        tolerancia_error_g: this.tolerancia_error_g,
        incertidumbre_u: this.incertidumbre_u,
        realizo: this.realizo,
        superviso: this.superviso,
        observaciones: this.observaciones
      });
      this.snack.success('Historial registrado exitosamente');
      this.resetFormHistorial();
    } catch (error: any) {
      this.snack.error(error.message || 'Error al registrar historial');
    }
  }

  async crearEquipo(event: Event) {
    event.preventDefault();
    
    if (!this.codigo_identificacion || !this.nombre) {
      this.snack.warn('Código y nombre son obligatorios');
      return;
    }
    
    try {
      await equiposService.crearEquipo({
        codigo_identificacion: this.codigo_identificacion,
        nombre: this.nombre,
        modelo: this.modelo,
        marca: this.marca,
        inventario_sena: this.inventario_sena,
        ubicacion: this.ubicacion,
        acreditacion: this.acreditacion,
        tipo_manual: this.tipo_manual,
        numero_serie: this.numero_serie,
        tipo: this.tipo,
        clasificacion: this.clasificacion,
        manual_usuario: this.manual_usuario,
        puesta_en_servicio: this.puesta_en_servicio,
        fecha_adquisicion: this.fecha_adquisicion,
        requerimientos_equipo: this.requerimientos_equipo,
        elementos_electricos: this.elementos_electricos,
        voltaje: this.voltaje,
        elementos_mecanicos: this.elementos_mecanicos,
        frecuencia: this.frecuencia,
        campo_medicion: this.campo_medicion,
        exactitud: this.exactitud,
        sujeto_verificar: this.sujeto_verificar,
        sujeto_calibracion: this.sujeto_calibracion,
        resolucion_division: this.resolucion_division,
        sujeto_calificacion: this.sujeto_calificacion,
        accesorios: this.accesorios
      });
      this.snack.success('Equipo registrado exitosamente');
      this.resetForm();
      this.obtenerEquiposRegistrados(); // Actualizar lista
    } catch (error: any) {
      this.snack.error(error.message || 'Error al registrar equipo');
    }
  }

  resetForm() {
    this.codigo_identificacion = '';
    this.nombre = '';
    this.modelo = '';
    this.marca = '';
    this.inventario_sena = '';
    this.ubicacion = '';
    this.acreditacion = '';
    this.tipo_manual = '';
    this.numero_serie = '';
    this.tipo = '';
    this.clasificacion = '';
    this.manual_usuario = '';
    this.puesta_en_servicio = '';
    this.fecha_adquisicion = '';
    this.requerimientos_equipo = '';
    this.elementos_electricos = '';
    this.voltaje = '';
    this.elementos_mecanicos = '';
    this.frecuencia = '';
    this.campo_medicion = '';
    this.exactitud = '';
    this.sujeto_verificar = '';
    this.sujeto_calibracion = '';
    this.resolucion_division = '';
    this.sujeto_calificacion = '';
    this.accesorios = '';
  }

  resetFormIntervalo() {
    this.consecutivo_intervalo = null;
    this.equipo_id_intervalo = '';
    this.unidad_nominal_g = null;
    this.calibracion_1 = '';
    this.fecha_c1 = '';
    this.error_c1_g = null;
    this.calibracion_2 = '';
    this.fecha_c2 = '';
    this.error_c2_g = null;
    this.diferencia_dias = null;
    this.desviacion = null;
    this.deriva = null;
    this.tolerancia_g_intervalo = null;
    this.intervalo_calibraciones_dias = null;
    this.intervalo_calibraciones_anios = null;
  }

  resetFormHistorial() {
    this.consecutivo = null;
    this.equipo_id = '';
    this.fecha = '';
    this.tipo_historial = '';
    this.codigo_registro = '';
    this.tolerancia_g = null;
    this.tolerancia_error_g = null;
    this.incertidumbre_u = null;
    this.realizo = '';
    this.superviso = '';
    this.observaciones = '';
  }
}
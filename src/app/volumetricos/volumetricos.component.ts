import { Component, signal, effect, OnInit, ChangeDetectorRef, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SnackbarService } from '../shared/snackbar.service';
import { ConfirmService } from '../shared/confirm.service';
// Suponiendo que hay un servicio similar para volumetricos
import { VolumetricosService } from '../services/volumetricos.service';
import { logsService } from '../services/logs.service';
import { authService, authUser } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-volumetricos',
  templateUrl: './volumetricos.component.html',
  styleUrls: ['./volumetricos.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class VolumetricosComponent implements OnInit {
  public snack = inject(SnackbarService);
  private cdr = inject(ChangeDetectorRef);
  public volumetricosService = inject(VolumetricosService);
  private confirm = inject(ConfirmService);
  public get esAuxiliar(): boolean {
    const user = authUser();
    if (!user || user.rol !== 'Auxiliar') return false;
    return !authService.canEditModule('volumetricos');
  }
  // API base URL
  API_VOLUMETRICOS = (window as any).__env?.API_VOLUMETRICOS || 'http://localhost:4000/api/volumetricos';

  // Tabs para la información del material volumétrico
  volumetricoTabs = [
    { key: 'general', label: 'General' },
    { key: 'historial', label: 'Historial' },
    { key: 'intervalo', label: 'Intervalo' }
  ];

  // Control de pestaña activa por material
  activeTab: Record<string, string> = {};

  // Almacenar historial e intervalo por material
  historialPorMaterial: Record<string, any[]> = {};
  intervaloPorMaterial: Record<string, any[]> = {};

  // Control de formularios
  formularioActivo: string | null = null;

  // Control de material expandido
  materialExpandido: string | null = null;

  // Variables para búsqueda y autocompletado
  busquedaMaterial = '';
  tipoFiltro = 'todos';
  materialesFiltrados: any[] = [];
  materialSeleccionado: any = null;
  mostrarResultados = false;

  @ViewChild('volDocTemplateInput') volDocTemplateInput?: ElementRef<HTMLInputElement>;

  volDocFiltroTipo = 'todos';
  volDocBusqueda = '';
  volDocResultados: any[] = [];
  volDocSeleccionado: any = null;
  volDocPlantillas = signal<any[]>([]);
  volDocPlantillaId: number | null = null;
  volDocNombrePlantilla = '';
  volDocTemplateFile: File | null = null;
  volDocMsg = '';
  volDocLoading = false;
  volDocListLoading = signal(false);
  volDocUploadLoading = false;
  volDocDeleteLoading: Set<number> = new Set<number>();

  // Opciones para el select de filtro
  opcionesFiltro = [
    { valor: 'todos', texto: 'Todos los campos' },
    { valor: 'codigo', texto: 'Código' },
    { valor: 'nombre', texto: 'Nombre' },
    { valor: 'marca', texto: 'Marca' },
    { valor: 'modelo', texto: 'Modelo' }
  ];

  // Señal para el siguiente código disponible
  codigoIdSig = signal<number>(1);
  // Calcula el siguiente código disponible
  get nextCodigoId(): number {
    if (!this.materialesRegistrados.length) return 1;
    const max = Math.max(...this.materialesRegistrados.map(m => Number(m.codigo_id) || 0));
    return max + 1;
  }
  nombre_material = '';
  volumen_nominal: number | null = null;
  rango_volumen = '';
  marca = '';
  resolucion: number | null = null;
  error_max_permitido: number | null = null;
  modelo = '';

  // Campos para historial_volumetrico
  consecutivo_historial: number | null = null;
  codigo_material_historial: number | null = null;
  fecha_historial = '';
  tipo_historial_instrumento = '';
  codigo_registro_historial = '';
  realizo = '';
  superviso = '';

  // Campos para intervalo_volumetrico
  consecutivo_intervalo: number | null = null;
  codigo_material_intervalo: number | null = null;
  valor_nominal: number | null = null;
  fecha_c1 = '';
  error_c1: number | null = null;
  fecha_c2 = '';
  error_c2: number | null = null;
  diferencia_tiempo_dias: number | null = null;
  desviacion_abs: number | null = null;
  deriva: number | null = null;
  tolerancia: number | null = null;
  intervalo_calibracion_dias: number | null = null;
  intervalo_calibracion_anos: number | null = null;
  incertidumbre_exp: number | null = null;

  // Lista de materiales registrados
  materialesRegistrados: any[] = [];
  cargandoMateriales = false;

  // Señales para consecutivos
  codigoHistorialSig = signal<number | null>(null);
  consecutivoHistorialSig = signal<number | null>(null);
  codigoIntervaloSig = signal<number | null>(null);
  consecutivoIntervaloSig = signal<number | null>(null);

  // Control de registros expandidos
  historialExpandido: Record<string, boolean> = {};
  intervaloExpandido: Record<string, boolean> = {};

  // PDF management
  pdfListByMaterial: Record<string, { id?: number; name: string; url: string; categoria?: string; size?: number; mime?: string; fecha_subida?: Date | null; displayName?: string }[]> = {};
  selectedPdfByMaterial: Record<string, string | null> = {};
  menuCategoriaPdfVisible: Record<string, boolean> = {};

  // Edit modal state
  editModalVisible = false;
  editModalClosing = false;
  editModalActiveTab = 'general';
  editMaterialMode = false;
  editingMaterialCodigo: number | null = null;
  private editOriginalMaterialPayload: any | null = null;

  constructor() {
    // Efectos para consecutivos
    effect(() => {
      const codigo = this.codigoHistorialSig();
      if (codigo) {
        this.volumetricosService.obtenerNextHistorial(codigo)
          .then((resp: any) => this.consecutivoHistorialSig.set(resp.next))
          .catch(() => this.snack.warn('No se pudo cargar consecutivo historial'));
      } else {
        this.consecutivoHistorialSig.set(null);
      }
    });

    effect(() => {
      const codigo = this.codigoIntervaloSig();
      if (codigo) {
        this.volumetricosService.obtenerNextIntervalo(codigo)
          .then((resp: any) => this.consecutivoIntervaloSig.set(resp.next))
          .catch(() => this.snack.warn('No se pudo cargar consecutivo intervalo'));
      } else {
        this.consecutivoIntervaloSig.set(null);
      }
    });
  }

  ngOnInit() {
    console.log('🎯 VolumetricosComponent inicializado - cargando materiales...');
    this.obtenerMaterialesRegistrados();
    // Cerrar menú de categorías cuando se hace clic fuera
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.categoria-pdf-menu') && !target.closest('.btn.add')) {
        Object.keys(this.menuCategoriaPdfVisible).forEach(key => {
          this.menuCategoriaPdfVisible[key] = false;
        });
      }
    });
  }

  // Métodos similares a equipos, adaptados para volumetricos

  async obtenerMaterialesRegistrados() {
    console.log('🔄 Iniciando carga de materiales...');
    this.cargandoMateriales = true;
    try {
      const materiales = await this.volumetricosService.listarMateriales();
      console.log('✅ Materiales recibidos:', materiales);
      
      // Precargar historial e intervalo
      await Promise.all(materiales.map(async (material: any) => {
        const codigo = material.codigo_id;
        try {
          const [historial, intervalo] = await Promise.all([
            this.volumetricosService.listarHistorialPorMaterial(codigo),
            this.volumetricosService.listarIntervaloPorMaterial(codigo)
          ]);
          this.historialPorMaterial[codigo] = historial;
          this.intervaloPorMaterial[codigo] = intervalo;
          await this.listarPdfs(String(codigo));
        } catch (error) {
          console.warn(`Error al precargar datos para material ${codigo}:`, error);
          this.historialPorMaterial[codigo] = [];
          this.intervaloPorMaterial[codigo] = [];
        }
      }));
      
      this.materialesRegistrados = materiales.map((material: any) => ({
        codigo_id: material.codigo_id,
        nombre_material: material.nombre_material,
        volumen_nominal: material.volumen_nominal,
        rango_volumen: material.rango_volumen,
        marca: material.marca,
        resolucion: material.resolucion,
        error_max_permitido: material.error_max_permitido,
        modelo: material.modelo
      }));
      // Actualizar la señal automáticamente
      this.codigoIdSig.set(this.nextCodigoId);
      console.log('✅ Materiales procesados. Total:', this.materialesRegistrados.length);
    } catch (error: any) {
      console.error('❌ Error al obtener materiales:', error);
      this.snack.error(error.message || 'Error al obtener materiales registrados');
      this.materialesRegistrados = [];
    } finally {
      this.cargandoMateriales = false;
      this.cdr.detectChanges();
    }
  }

  // Función para buscar materiales
  buscarMateriales() {
    if (!this.busquedaMaterial.trim()) {
      this.materialesFiltrados = [];
      this.mostrarResultados = false;
      return;
    }
    
    const busqueda = this.busquedaMaterial.toLowerCase().trim();
    this.mostrarResultados = true;
    
    this.materialesFiltrados = this.materialesRegistrados.filter(material => {
      switch (this.tipoFiltro) {
        case 'codigo':
          return material.codigo_id?.toString().includes(busqueda);
        case 'nombre':
          return material.nombre_material?.toLowerCase().includes(busqueda);
        case 'marca':
          return material.marca?.toLowerCase().includes(busqueda);
        case 'modelo':
          return material.modelo?.toLowerCase().includes(busqueda);
        case 'todos':
        default:
          return (
            material.codigo_id?.toString().includes(busqueda) ||
            material.nombre_material?.toLowerCase().includes(busqueda) ||
            material.marca?.toLowerCase().includes(busqueda) ||
            material.modelo?.toLowerCase().includes(busqueda)
          );
      }
    });
  }

  // Función para seleccionar material
  seleccionarMaterial(material: any) {
    this.materialSeleccionado = material;
    this.busquedaMaterial = `${material.codigo_id} - ${material.nombre_material}`;
    this.materialesFiltrados = [];
    this.mostrarResultados = false;

    // Autocompletar campos del formulario actual
    if (this.formularioActivo === 'material') {
      this.codigoIdSig.set(material.codigo_id);
      this.nombre_material = material.nombre_material;
      this.volumen_nominal = material.volumen_nominal;
      this.rango_volumen = material.rango_volumen;
      this.marca = material.marca;
      this.resolucion = material.resolucion;
      this.error_max_permitido = material.error_max_permitido;
      this.modelo = material.modelo;
    }

    this.snack.success(`Datos de "${material.nombre_material}" cargados`);
  }

  // Limpiar búsqueda
  limpiarBusqueda() {
    this.busquedaMaterial = '';
    this.tipoFiltro = 'todos';
    this.materialesFiltrados = [];
    this.materialSeleccionado = null;
    this.mostrarResultados = false;
  }

  // Método para obtener placeholder dinámico
  getPlaceholder(): string {
    switch (this.tipoFiltro) {
      case 'codigo':
        return 'Buscar por código...';
      case 'nombre':
        return 'Buscar por nombre...';
      case 'marca':
        return 'Buscar por marca...';
      case 'modelo':
        return 'Buscar por modelo...';
      case 'todos':
      default:
        return 'Buscar en todos los campos...';
    }
  }

  // Ocultar resultados cuando se hace clic fuera
  onFocusOut() {
    setTimeout(() => {
      this.mostrarResultados = false;
    }, 200);
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  // Crear material volumétrico
  async crearMaterial(event: Event) {
    event.preventDefault();
    // Siempre usar el siguiente código disponible
    const nextCodigo = this.codigoIdSig();
    if (!nextCodigo || !this.nombre_material) {
      this.snack.warn('Código y nombre son obligatorios');
      return;
    }
    try {
      const payload = {
        codigo_id: nextCodigo,
        nombre_material: this.nombre_material,
        volumen_nominal: this.volumen_nominal,
        rango_volumen: this.rango_volumen,
        marca: this.marca,
        resolucion: this.resolucion,
        error_max_permitido: this.error_max_permitido,
        modelo: this.modelo
      };
      await this.volumetricosService.crearMaterial(payload);
      this.snack.success('Material registrado exitosamente');
      
      // Log auditoría
      logsService.crearLogAccion({
        modulo: 'MAT_VOLUMETRICOS',
        accion: 'CREAR',
        descripcion: `Creación de material volumétrico: ${payload.codigo_id}`,
        detalle: { id: payload.codigo_id, ...payload }
      }).then(() => console.log('Log de auditoría creado'))
        .catch(err => {
          console.error('Error creando log:', err);
          this.snack.warn('Error al crear registro de auditoría');
        });

      this.resetFormMaterial();
      await this.obtenerMaterialesRegistrados();
    } catch (error: any) {
      this.snack.error(error.message || 'Error al registrar material');
    }
  }

  // Crear historial
  async crearHistorial(event: Event) {
    event.preventDefault();
    
    const consecutivo = this.consecutivoHistorialSig();
    const codigo_material = this.codigoHistorialSig();
    
    if (!consecutivo || !codigo_material) {
      this.snack.warn('Debe seleccionar un material y tener un consecutivo válido');
      return;
    }
    
    try {
      await this.volumetricosService.crearHistorial({
        consecutivo: consecutivo,
        codigo_material: codigo_material,
        fecha: this.fecha_historial,
        tipo_historial_instrumento: this.tipo_historial_instrumento,
        codigo_registro: this.codigo_registro_historial,
        realizo: this.realizo,
        superviso: this.superviso
      });
      
      this.snack.success('Historial registrado exitosamente');

      // Log auditoría
      const materialNombre = (this.materialesRegistrados || []).find(m => Number(m?.codigo_id) === Number(codigo_material))?.nombre_material || null;
      logsService.crearLogAccion({
        modulo: 'MAT_VOLUMETRICOS',
        accion: 'CREAR',
        descripcion: `Creación de historial para volumétrico: ${codigo_material}`,
        detalle: { id: codigo_material, nombre_material: materialNombre, consecutivo, tipo_historial_instrumento: this.tipo_historial_instrumento || null }
      }).catch(console.error);

      this.resetFormHistorial();

      // Mantener material seleccionado y refrescar consecutivo automáticamente
      this.codigo_material_historial = codigo_material;
      this.codigoHistorialSig.set(codigo_material);
      try {
        const next = await this.volumetricosService.obtenerNextHistorial(codigo_material);
        this.consecutivoHistorialSig.set(next.next);
      } catch {
        // ya se notifica vía snack en el effect/servicio
      }
      
      // Actualizar lista local
      if (this.historialPorMaterial[codigo_material]) {
        const data = await this.volumetricosService.listarHistorialPorMaterial(codigo_material);
        this.historialPorMaterial[codigo_material] = data;
      }
    } catch (error: any) {
      this.snack.error(error.message || 'Error al registrar historial');
    }
  }

  // Crear intervalo
  async crearIntervalo(event: Event) {
    event.preventDefault();
    
    const consecutivo = this.consecutivoIntervaloSig();
    const codigo_material = this.codigoIntervaloSig();
    
    if (!consecutivo || !codigo_material) {
      this.snack.warn('Debe seleccionar un material y tener un consecutivo válido');
      return;
    }
    
    // Validación: fecha_c2 no puede ser anterior a fecha_c1
    if (this.fecha_c1 && this.fecha_c2) {
      const f1 = new Date(this.fecha_c1);
      const f2 = new Date(this.fecha_c2);
      f1.setHours(0,0,0,0);
      f2.setHours(0,0,0,0);
      if (f2 < f1) {
        this.snack.warn('La fecha de calibración 2 no puede ser anterior a la fecha de calibración 1');
        return;
      }
    }
    
    const calc = this.recalcularIntervalo();

    try {
      await this.volumetricosService.crearIntervalo({
        consecutivo: consecutivo,
        codigo_material: codigo_material,
        valor_nominal: this.valor_nominal,
        fecha_c1: this.fecha_c1,
        error_c1: this.error_c1,
        fecha_c2: this.fecha_c2,
        error_c2: this.error_c2,
        diferencia_tiempo_dias: calc.diferencia_tiempo_dias,
        desviacion_abs: calc.desviacion_abs,
        deriva: calc.deriva,
        tolerancia: this.tolerancia,
        intervalo_calibracion_dias: calc.intervalo_calibracion_dias,
        intervalo_calibracion_anos: calc.intervalo_calibracion_anos,
        incertidumbre_exp: this.incertidumbre_exp
      });

      this.snack.success('Intervalo registrado exitosamente');

      this.resetFormIntervalo();

      // Mantener material seleccionado y refrescar consecutivo automáticamente
      this.codigo_material_intervalo = codigo_material;
      this.codigoIntervaloSig.set(codigo_material);
      try {
        const next = await this.volumetricosService.obtenerNextIntervalo(codigo_material);
        this.consecutivoIntervaloSig.set(next.next);
      } catch {
        // ya se notifica vía snack en el effect/servicio
      }

      // Actualizar lista local
      if (this.intervaloPorMaterial[codigo_material]) {
        const data = await this.volumetricosService.listarIntervaloPorMaterial(codigo_material);
        this.intervaloPorMaterial[codigo_material] = data;
      }
    } catch (error: any) {
      this.snack.error(error.message || 'Error al registrar intervalo');
    }
  }

  resetFormMaterial() {
    this.codigoIdSig.set(this.nextCodigoId);
    this.nombre_material = '';
    this.volumen_nominal = null;
    this.rango_volumen = '';
    this.marca = '';
    this.resolucion = null;
    this.error_max_permitido = null;
    this.modelo = '';
    this.limpiarBusqueda();
  }

  resetFormHistorial() {
    this.consecutivo_historial = null;
    this.codigo_material_historial = null;
    this.fecha_historial = '';
    this.tipo_historial_instrumento = '';
    this.codigo_registro_historial = '';
    this.realizo = '';
    this.superviso = '';
  }

  resetFormIntervalo() {
    this.consecutivo_intervalo = null;
    this.codigo_material_intervalo = null;
    this.valor_nominal = null;
    this.fecha_c1 = '';
    this.error_c1 = null;
    this.fecha_c2 = '';
    this.error_c2 = null;
    this.diferencia_tiempo_dias = null;
    this.desviacion_abs = null;
    this.deriva = null;
    this.tolerancia = null;
    this.intervalo_calibracion_dias = null;
    this.intervalo_calibracion_anos = null;
    this.incertidumbre_exp = null;
  }

  private toFiniteNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private roundOrNull(value: number | null, decimals: number): number | null {
    if (value === null || value === undefined) return null;
    if (!Number.isFinite(value)) return null;
    const factor = Math.pow(10, Math.max(0, decimals));
    return Math.round(value * factor) / factor;
  }

  recalcularIntervalo(): {
    diferencia_tiempo_dias: number | null;
    desviacion_abs: number | null;
    deriva: number | null;
    intervalo_calibracion_dias: number | null;
    intervalo_calibracion_anos: number | null;
  } {
    // Diferencia de días
    let diferenciaDias: number | null = null;
    if (this.fecha_c1 && this.fecha_c2) {
      const f1 = new Date(this.fecha_c1);
      const f2 = new Date(this.fecha_c2);
      if (!isNaN(f1.getTime()) && !isNaN(f2.getTime())) {
        f1.setHours(0, 0, 0, 0);
        f2.setHours(0, 0, 0, 0);
        if (f2 >= f1) {
          diferenciaDias = Math.round((f2.getTime() - f1.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
    }

    // Desviación absoluta
    const e1 = this.toFiniteNumberOrNull(this.error_c1);
    const e2 = this.toFiniteNumberOrNull(this.error_c2);
    let desviacionAbs: number | null = null;
    if (e1 !== null && e2 !== null) {
      desviacionAbs = Math.abs(e2 - e1);
    }

    // Deriva
    let deriva: number | null = null;
    if (desviacionAbs !== null && diferenciaDias !== null && diferenciaDias > 0) {
      deriva = desviacionAbs / diferenciaDias;
    }

    // Intervalo calibración
    const tol = this.toFiniteNumberOrNull(this.tolerancia);
    let intervaloDias: number | null = null;
    if (tol !== null && deriva !== null && deriva !== 0) {
      intervaloDias = Math.abs(tol / deriva);
    }

    let intervaloAnos: number | null = null;
    if (intervaloDias !== null) {
      intervaloAnos = intervaloDias / 365;
    }

    // Persistir en el formulario (readonly)
    this.diferencia_tiempo_dias = diferenciaDias;
    this.desviacion_abs = this.roundOrNull(desviacionAbs, 6);
    this.deriva = this.roundOrNull(deriva, 9);
    this.intervalo_calibracion_dias = this.roundOrNull(intervaloDias, 2);
    this.intervalo_calibracion_anos = this.roundOrNull(intervaloAnos, 4);

    return {
      diferencia_tiempo_dias: this.diferencia_tiempo_dias,
      desviacion_abs: this.desviacion_abs,
      deriva: this.deriva,
      intervalo_calibracion_dias: this.intervalo_calibracion_dias,
      intervalo_calibracion_anos: this.intervalo_calibracion_anos
    };
  }

  // Toggle para formularios
  toggleFormulario(tipo: string) {
    if (this.formularioActivo === tipo) {
      this.formularioActivo = null;
    } else {
      // Limpiar todos los formularios antes de abrir uno nuevo
      this.resetFormMaterial();
      this.resetFormHistorial();
      this.resetFormIntervalo();
      this.limpiarBusqueda();

      if (tipo === 'historial') {
        this.formularioActivo = tipo;
        this.consecutivo_historial = null;
        this.codigo_material_historial = null;
        this.codigoHistorialSig.set(null);
        this.consecutivoHistorialSig.set(null);
      } else if (tipo === 'intervalo') {
        this.formularioActivo = tipo;
        this.consecutivo_intervalo = null;
        this.codigo_material_intervalo = null;
        this.codigoIntervaloSig.set(null);
        this.consecutivoIntervaloSig.set(null);
      } else if (tipo === 'documentos') {
        this.formularioActivo = tipo;
        this.volDocFiltroTipo = 'todos';
        this.volDocBusqueda = '';
        this.volDocResultados = [];
        this.volDocSeleccionado = null;
        this.volDocPlantillaId = null;
        this.volDocNombrePlantilla = '';
        this.volDocPlantillas.set([]);
        this.volDocTemplateFile = null;
        this.volDocMsg = '';
        this.volDocLoading = false;
        this.volDocUploadLoading = false;
        const el = this.volDocTemplateInput?.nativeElement;
        if (el) el.value = '';
        this.cargarPlantillasDocumentoVolumetrico();
      } else {
        this.formularioActivo = tipo;
      }
    }
  }

  filtrarVolumetricosDocumentos() {
    const q = String(this.volDocBusqueda || '').trim().toLowerCase();
    if (!q) {
      this.volDocResultados = [];
      return;
    }

    const out = (this.materialesRegistrados || []).filter((m: any) => {
      const codigo = String(m?.codigo_id ?? '').toLowerCase();
      const nombre = String(m?.nombre_material ?? '').toLowerCase();
      const marca = String(m?.marca ?? '').toLowerCase();
      const modelo = String(m?.modelo ?? '').toLowerCase();
      switch (this.volDocFiltroTipo) {
        case 'codigo': return codigo.includes(q);
        case 'nombre': return nombre.includes(q);
        case 'marca': return marca.includes(q);
        case 'modelo': return modelo.includes(q);
        case 'todos':
        default:
          return codigo.includes(q) || nombre.includes(q) || marca.includes(q) || modelo.includes(q);
      }
    });

    this.volDocResultados = out.slice(0, 50);
  }

  seleccionarVolumetricoDocumento(material: any) {
    this.volDocSeleccionado = material || null;
    this.volDocResultados = [];
    this.volDocBusqueda = '';
    this.volDocMsg = '';
  }

  limpiarSeleccionVolumetricoDocumento() {
    this.volDocSeleccionado = null;
    this.volDocBusqueda = '';
    this.volDocResultados = [];
    this.volDocPlantillaId = null;
    this.volDocNombrePlantilla = '';
    this.volDocTemplateFile = null;
    this.volDocMsg = '';
    this.volDocLoading = false;
    this.volDocUploadLoading = false;
    const el = this.volDocTemplateInput?.nativeElement;
    if (el) el.value = '';
  }

  onVolDocTemplateSelected(event: any): void {
    try {
      const f = event?.target?.files?.[0] || null;
      this.volDocTemplateFile = f;
      this.volDocMsg = '';
    } catch {
      this.volDocTemplateFile = null;
    }
  }

  async cargarPlantillasDocumentoVolumetrico(): Promise<void> {
    if (this.volDocListLoading()) return;
    this.volDocListLoading.set(true);
    this.volDocMsg = '';
    try {
      const rows = await this.volumetricosService.listarPlantillasDocumentoVolumetrico();
      this.volDocPlantillas.set(Array.isArray(rows) ? rows : []);
      if (this.volDocPlantillaId != null) {
        const exists = this.volDocPlantillas().some((t) => Number(t?.id) === Number(this.volDocPlantillaId));
        if (!exists) this.volDocPlantillaId = null;
      }
    } catch (err: any) {
      this.volDocMsg = err?.message || 'Error listando plantillas';
      this.snack.error(this.volDocMsg);
    } finally {
      this.volDocListLoading.set(false);
    }
  }

  async subirPlantillaDocumentoVolumetrico(): Promise<void> {
    if (this.volDocUploadLoading) return;
    if (!this.volDocTemplateFile) {
      this.volDocMsg = 'Selecciona una plantilla .xlsx o .docx';
      this.snack.warn(this.volDocMsg);
      return;
    }
    this.volDocUploadLoading = true;
    this.volDocMsg = '';
    try {
      const created = await this.volumetricosService.subirPlantillaDocumentoVolumetrico({
        template: this.volDocTemplateFile,
        nombre: this.volDocNombrePlantilla || undefined
      });
      await this.cargarPlantillasDocumentoVolumetrico();
      const id = Number(created?.id);
      if (Number.isFinite(id) && id > 0) this.volDocPlantillaId = id;
      this.volDocNombrePlantilla = '';
      this.volDocTemplateFile = null;
      const el = this.volDocTemplateInput?.nativeElement;
      if (el) el.value = '';
      this.snack.success('Plantilla guardada');
    } catch (err: any) {
      this.volDocMsg = err?.message || 'Error subiendo plantilla';
      this.snack.error(this.volDocMsg);
    } finally {
      this.volDocUploadLoading = false;
    }
  }

  async eliminarPlantillaDocumentoVolumetrico(): Promise<void> {
    const id = this.volDocPlantillaId;
    if (!id) {
      this.volDocMsg = 'Seleccione una plantilla';
      this.snack.warn(this.volDocMsg);
      return;
    }
    if (this.volDocDeleteLoading.has(id)) return;
    this.volDocDeleteLoading.add(id);
    this.volDocMsg = '';
    try {
      await this.volumetricosService.eliminarPlantillaDocumentoVolumetrico(id);
      await this.cargarPlantillasDocumentoVolumetrico();
      this.volDocPlantillaId = null;
      this.snack.success('Plantilla eliminada');
    } catch (err: any) {
      this.volDocMsg = err?.message || 'Error eliminando plantilla';
      this.snack.error(this.volDocMsg);
    } finally {
      this.volDocDeleteLoading.delete(id);
    }
  }

  async generarDocumentoVolumetricoDesdePlantilla(): Promise<void> {
    if (this.volDocLoading) return;
    const codigo = Number(this.volDocSeleccionado?.codigo_id);
    if (!Number.isFinite(codigo) || codigo <= 0) {
      this.volDocMsg = 'Debe seleccionar un material';
      this.snack.warn(this.volDocMsg);
      return;
    }
    const id = this.volDocPlantillaId;
    if (!id) {
      this.volDocMsg = 'Seleccione una plantilla';
      this.snack.warn(this.volDocMsg);
      return;
    }

    this.volDocLoading = true;
    this.volDocMsg = '';
    try {
      const selected = this.volDocPlantillas().find((t) => Number(t?.id) === Number(id));
      const fallbackName = selected?.nombre_archivo || selected?.nombre || null;
      const { blob, filename } = await this.volumetricosService.generarDocumentoVolumetricoDesdePlantilla({ id, codigo });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || fallbackName || 'documento_volumetrico';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.snack.success('Documento generado');
    } catch (err: any) {
      this.volDocMsg = err?.message || 'No se pudo generar el documento';
      this.snack.error(this.volDocMsg);
    } finally {
      this.volDocLoading = false;
    }
  }

  // Toggle para expandir/contraer detalles
  toggleDetalleMaterial(codigoMaterial: string) {
    this.materialExpandido = this.materialExpandido === codigoMaterial ? null : codigoMaterial;
    if (this.materialExpandido === codigoMaterial && !this.activeTab[codigoMaterial]) {
      this.activeTab[codigoMaterial] = 'general';
    }
  }

  // Toggle para expandir/contraer registros
  toggleHistorialRegistro(materialId: string, consecutivo: number) {
    const key = `${materialId}_${consecutivo}`;
    this.historialExpandido[key] = !this.historialExpandido[key];
  }

  toggleIntervaloRegistro(materialId: string, consecutivo: number) {
    const key = `${materialId}_${consecutivo}`;
    this.intervaloExpandido[key] = !this.intervaloExpandido[key];
  }

  // Seleccionar pestaña
  selectTab(codigo: string, tabKey: string) {
    this.activeTab[codigo] = tabKey;
    this.cdr.detectChanges();
  }

  // Obtener número de registros por pestaña
  getTabCount(material: any, tabKey: string): number {
    if (!material || !tabKey) return 0;
    const codigo = material.codigo_id;
    if (!codigo) return 0;
    
    if (tabKey === 'historial') {
      const arr = this.historialPorMaterial[codigo];
      return Array.isArray(arr) ? arr.length : 0;
    }
    
    if (tabKey === 'intervalo') {
      const arr = this.intervaloPorMaterial[codigo];
      return Array.isArray(arr) ? arr.length : 0;
    }
    
    return 0;
  }

  // Handlers para actualizar señales
  onSeleccionMaterialHistorialChange(codigo: number) {
    this.codigo_material_historial = codigo;
    this.codigoHistorialSig.set(codigo);
  }

  onSeleccionMaterialIntervaloChange(codigo: number) {
    this.codigo_material_intervalo = codigo;
    this.codigoIntervaloSig.set(codigo);
  }

  // PDF management methods (similares a equipos)
  async listarPdfs(codigo: string) {
    try {
      const data: any[] = await this.volumetricosService.listarPdfsPorMaterial(codigo);
      // Similar logic to equipos for PDF management
      const items: any[] = (data || []).map(p => ({
        id: p.id,
        name: p.nombre_archivo || p.name || 'Archivo',
        url: p.url_archivo || p.url,
        categoria: p.categoria,
        size: p.size_bytes,
        mime: p.mime,
        fecha_subida: p.fecha_subida ? new Date(p.fecha_subida) : null
      }));

      // Sort by fecha_subida
      items.sort((a, b) => {
        if (!a.fecha_subida && !b.fecha_subida) return 0;
        if (!a.fecha_subida) return 1;
        if (!b.fecha_subida) return -1;
        return a.fecha_subida.getTime() - b.fecha_subida.getTime();
      });

      // Assign display names
      this.computePdfDisplayNames(items);
      this.pdfListByMaterial[codigo] = items;
      this.selectedPdfByMaterial[codigo] = this.pdfListByMaterial[codigo]?.[0]?.url || null;
      this.cdr.detectChanges();
    } catch (err) {
      console.warn('Error listando PDFs', err);
      this.pdfListByMaterial[codigo] = [];
      this.selectedPdfByMaterial[codigo] = null;
      this.cdr.detectChanges();
    }
  }

  computePdfDisplayNames(items: any[]) {
    const groups: Record<string, any[]> = {};
    for (const it of items) {
      const cat = (it.categoria || '').trim();
      if (!cat) continue;
      groups[cat] = groups[cat] || [];
      groups[cat].push(it);
    }

    for (const cat of Object.keys(groups)) {
      const group = groups[cat];
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          group[i].displayName = `${cat} - ${i + 1}`;
        }
      } else {
        group[0].displayName = cat;
      }
    }

    for (const it of items) {
      if (!it.categoria || !it.categoria.toString().trim()) {
        it.displayName = it.name;
      }
    }
  }

  openPdf(codigo: string, event?: Event) {
    if (event) event.stopPropagation();
    const url = this.selectedPdfByMaterial[codigo] || this.pdfListByMaterial[codigo]?.[0]?.url;
    if (!url) {
      this.snack.warn('No hay PDF seleccionado para ver');
      return;
    }
    window.open(url, '_blank');
  }

  async deletePdf(codigo: string, event?: Event) {
    if (event) event.stopPropagation();
    const url = this.selectedPdfByMaterial[codigo];
    if (!url) {
      this.snack.warn('Seleccione un PDF para eliminar');
      return;
    }
    const item = (this.pdfListByMaterial[codigo] || []).find(p => p.url === url);
    if (!item || !item.id) {
      this.snack.warn('No se encontró el PDF para eliminar');
      return;
    }

    const confirmMsg = `¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`;
    const ok = await this.confirm.confirm({
      title: 'Eliminar PDF',
      message: confirmMsg,
      confirmText: 'Si, eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;

    try {
      await this.volumetricosService.eliminarPdf(item.id);
      this.snack.success('PDF eliminado');

      // Log auditoría
      logsService.crearLogAccion({
        modulo: 'MAT_VOLUMETRICOS',
        accion: 'ELIMINAR_PDF',
        descripcion: `Eliminación de PDF para material volumétrico: ${codigo}`,
        detalle: { id: Number(codigo), archivo: item.name, pdf_id: item.id, categoria: item.categoria || null }
      }).catch(console.error);

      await this.listarPdfs(codigo);
    } catch (err: any) {
      console.error('Error eliminando PDF', err);
      this.snack.error(err.message || 'Error al eliminar PDF');
    }
  }

  mostrarMenuCategoriaPdf(codigo: string, event?: Event) {
    if (event) event.stopPropagation();
    this.menuCategoriaPdfVisible[codigo] = !this.menuCategoriaPdfVisible[codigo];
    Object.keys(this.menuCategoriaPdfVisible).forEach(key => {
      if (key !== codigo) {
        this.menuCategoriaPdfVisible[key] = false;
      }
    });
  }

  iniciarUpload(codigo: string, categoria: string, event?: Event) {
    if (event) event.stopPropagation();
    this.menuCategoriaPdfVisible[codigo] = false;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await this.volumetricosService.subirPdfMaterial(codigo, categoria, file);
        this.snack.success('PDF subido correctamente');

        // Log auditoría
      logsService.crearLogAccion({
        modulo: 'MAT_VOLUMETRICOS',
        accion: 'SUBIR_PDF',
        descripcion: `Subida de PDF para material volumétrico: ${codigo}`,
        detalle: { id: Number(codigo), archivo: file.name, categoria: categoria || null }
      }).catch(console.error);

        await this.listarPdfs(codigo);
      } catch (err: any) {
        console.error('Error subiendo PDF', err);
        this.snack.error(err.message || 'Error al subir PDF');
      }
    };
    input.click();
  }

  // Eliminar material
  async eliminarMaterial(material: any, event?: Event) {
    if (event) event.stopPropagation();
    const codigo = material?.codigo_id;
    if (!codigo) return;
    
    const confirmado = await this.confirm.confirm({
      title: 'Eliminar material',
      message: `¿Eliminar el material "${material.nombre_material}" (${codigo})? Se eliminarán también sus historiales e intervalos.`,
      confirmText: 'Si, eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!confirmado) return;
    
    try {
      await this.volumetricosService.eliminarMaterial(codigo);
      this.snack.success('Material eliminado');

      // Log auditoría
      logsService.crearLogAccion({
        modulo: 'MAT_VOLUMETRICOS',
        accion: 'ELIMINAR',
        descripcion: `Eliminación de material volumétrico: ${codigo}`,
        detalle: { id: codigo, nombre_material: material?.nombre_material || null }
      }).catch(console.error);

      this.materialesRegistrados = this.materialesRegistrados.filter(m => m.codigo_id !== codigo);
      
      // Limpiar estados asociados
      delete this.historialPorMaterial[codigo];
      delete this.intervaloPorMaterial[codigo];
      delete this.activeTab[codigo];
      if (this.materialExpandido === codigo.toString()) this.materialExpandido = null;
    } catch (error: any) {
      this.snack.error(error.message || 'No se pudo eliminar el material');
    }
  }

  // Editar material
  abrirEditarMaterial(material: any, event?: Event) {
    if (event) event.stopPropagation();
    if (!material) return;
    
    // Prefill form fields
    this.codigoIdSig.set(material.codigo_id);
    this.nombre_material = material.nombre_material || '';
    this.volumen_nominal = material.volumen_nominal || null;
    this.rango_volumen = material.rango_volumen || '';
    this.marca = material.marca || '';
    this.resolucion = material.resolucion || null;
    this.error_max_permitido = material.error_max_permitido || null;
    this.modelo = material.modelo || '';
    
    this.editMaterialMode = true;
    this.editingMaterialCodigo = material.codigo_id;
    this.editOriginalMaterialPayload = this.buildEditMaterialPayload();
    this.editModalVisible = true;
    this.editModalClosing = false;
    this.editModalActiveTab = 'general';
  }

  private buildEditMaterialPayload(): any {
    return {
      codigo_id: this.codigoIdSig(),
      nombre_material: this.nombre_material,
      volumen_nominal: this.volumen_nominal,
      rango_volumen: this.rango_volumen,
      marca: this.marca,
      resolucion: this.resolucion,
      error_max_permitido: this.error_max_permitido,
      modelo: this.modelo
    };
  }

  private hasEditMaterialChanges(payload: any): boolean {
    return JSON.stringify(payload) !== JSON.stringify(this.editOriginalMaterialPayload);
  }

  async saveAllEditMaterial() {
    if (!this.editingMaterialCodigo) {
      this.snack.error('No se ha seleccionado material para editar');
      return;
    }
    
    const payload: any = this.buildEditMaterialPayload();
    if (!this.hasEditMaterialChanges(payload)) {
      this.snack.warn('No hay campos para actualizar');
      return;
    }

    try {
      await this.volumetricosService.actualizarMaterial(this.editingMaterialCodigo, payload);
      this.snack.success('Cambios guardados');

      // Log auditoría
      try {
        await logsService.crearLogAccion({
          modulo: 'MAT_VOLUMETRICOS',
          accion: 'ACTUALIZAR',
          descripcion: `Actualización de material volumétrico: ${this.editingMaterialCodigo}`,
          detalle: { id: this.editingMaterialCodigo, ...payload }
        });
      } catch (error) {
        console.error('Error al registrar log de auditoría:', error);
      }

      await this.obtenerMaterialesRegistrados();
      this.closeEditMaterialModal();
    } catch (err: any) {
      console.error('Error actualizando material:', err);
      this.snack.error(err?.message || 'Error al guardar cambios del material');
    }
  }

  closeEditMaterialModal() {
    this.editModalVisible = false;
    this.editModalClosing = false;
    this.editMaterialMode = false;
    this.editingMaterialCodigo = null;
    this.editOriginalMaterialPayload = null;
  }

  // --- Edición inline de historial ---
  editarRegistroHistorial(registro: any) {
    registro._backup = { ...registro };
    registro.editando = true;
  }

  cancelarEdicionHistorial(codigo_material: number, registro: any) {
    Object.assign(registro, registro._backup);
    delete registro._backup;
    registro.editando = false;
  }

  async guardarEdicionHistorial(codigo_material: number, registro: any) {
    try {
      await this.volumetricosService.actualizarHistorial(codigo_material, registro.consecutivo, {
        tipo_historial_instrumento: registro.tipo_historial_instrumento,
        codigo_registro: registro.codigo_registro,
        realizo: registro.realizo,
        superviso: registro.superviso
      });
      this.snack.success('Historial actualizado');

      // Log auditoría
      const materialNombre = (this.materialesRegistrados || []).find(m => Number(m?.codigo_id) === Number(codigo_material))?.nombre_material || null;
      logsService.crearLogAccion({
        modulo: 'MAT_VOLUMETRICOS',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de historial para volumétrico: ${codigo_material}`,
        detalle: {
          id: codigo_material,
          nombre_material: materialNombre,
          consecutivo: registro.consecutivo,
          tipo_historial_instrumento: registro.tipo_historial_instrumento,
          codigo_registro: registro.codigo_registro,
          realizo: registro.realizo,
          superviso: registro.superviso
        }
      }).catch(console.error);

      registro.editando = false;
      delete registro._backup;
      // Refrescar lista
      const data = await this.volumetricosService.listarHistorialPorMaterial(codigo_material);
      this.historialPorMaterial[codigo_material] = data;
    } catch (e: any) {
      this.snack.error(e.message || 'Error al actualizar historial');
    }
  }

  // --- Edición inline de intervalo ---
  editarRegistroIntervalo(registro: any) {
    registro._backup = { ...registro };
    registro.editando = true;
  }

  cancelarEdicionIntervalo(codigo_material: number, registro: any) {
    Object.assign(registro, registro._backup);
    delete registro._backup;
    registro.editando = false;
  }

  async guardarEdicionIntervalo(codigo_material: number, registro: any) {
    try {
      await this.volumetricosService.actualizarIntervalo(codigo_material, registro.consecutivo, {
        valor_nominal: registro.valor_nominal,
        fecha_c1: registro.fecha_c1,
        error_c1: registro.error_c1,
        fecha_c2: registro.fecha_c2,
        error_c2: registro.error_c2,
        diferencia_tiempo_dias: registro.diferencia_tiempo_dias,
        desviacion_abs: registro.desviacion_abs,
        deriva: registro.deriva,
        tolerancia: registro.tolerancia,
        intervalo_calibracion_dias: registro.intervalo_calibracion_dias,
        intervalo_calibracion_anos: registro.intervalo_calibracion_anos,
        incertidumbre_exp: registro.incertidumbre_exp
      });
      this.snack.success('Intervalo actualizado');

      // Log auditoría
      const materialNombre = (this.materialesRegistrados || []).find(m => Number(m?.codigo_id) === Number(codigo_material))?.nombre_material || null;
      logsService.crearLogAccion({
        modulo: 'MAT_VOLUMETRICOS',
        accion: 'ACTUALIZAR',
        descripcion: `Actualización de intervalo para volumétrico: ${codigo_material}`,
        detalle: {
          id: codigo_material,
          nombre_material: materialNombre,
          consecutivo: registro.consecutivo,
          valor_nominal: registro.valor_nominal,
          fecha_c1: registro.fecha_c1,
          error_c1: registro.error_c1,
          fecha_c2: registro.fecha_c2,
          error_c2: registro.error_c2,
          diferencia_tiempo_dias: registro.diferencia_tiempo_dias,
          desviacion_abs: registro.desviacion_abs,
          deriva: registro.deriva,
          tolerancia: registro.tolerancia,
          intervalo_calibracion_dias: registro.intervalo_calibracion_dias,
          intervalo_calibracion_anos: registro.intervalo_calibracion_anos,
          incertidumbre_exp: registro.incertidumbre_exp
        }
      }).catch(console.error);

      registro.editando = false;
      delete registro._backup;
      // Refrescar lista
      const data = await this.volumetricosService.listarIntervaloPorMaterial(codigo_material);
      this.intervaloPorMaterial[codigo_material] = data;
    } catch (e: any) {
      this.snack.error(e.message || 'Error al actualizar intervalo');
    }
  }
}

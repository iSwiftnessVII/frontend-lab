import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SnackbarService } from '../shared/snackbar.service';
import { equiposService } from '../services/equipos.service';

@Component({
	standalone: true,
	selector: 'app-equipos',
	templateUrl: './equipos.component.html',
	styleUrls: ['./equipos.component.css'],
	imports: [CommonModule, FormsModule, RouterModule]
})
export class EquiposComponent {
	// ===== Form model signals (wrappers preserve existing template bindings) =====
	private nombreSig = signal<string>('');
	get nombre() { return this.nombreSig(); } set nombre(v: string) { this.nombreSig.set(v); }
	private modeloSig = signal<string>('');
	get modelo() { return this.modeloSig(); } set modelo(v: string) { this.modeloSig.set(v); }
	private marcaSig = signal<string>('');
	get marca() { return this.marcaSig(); } set marca(v: string) { this.marcaSig.set(v); }
	private inventarioSenaSig = signal<string>('');
	get inventario_sena() { return this.inventarioSenaSig(); } set inventario_sena(v: string) { this.inventarioSenaSig.set(v); }
	private acreditacionSig = signal<'Si' | 'No aplica' | ''>('');
	get acreditacion() { return this.acreditacionSig(); } set acreditacion(v: 'Si' | 'No aplica' | '') { this.acreditacionSig.set(v); }
	private tipoManualSig = signal<'Fisico' | 'Digital' | ''>('');
	get tipo_manual() { return this.tipoManualSig(); } set tipo_manual(v: 'Fisico' | 'Digital' | '') { this.tipoManualSig.set(v); }
	private codigoIdentificacionSig = signal<string>('');
	get codigo_identificacion() { return this.codigoIdentificacionSig(); } set codigo_identificacion(v: string) { this.codigoIdentificacionSig.set(v); }
	private numeroSerieSig = signal<string>('');
	get numero_serie() { return this.numeroSerieSig(); } set numero_serie(v: string) { this.numeroSerieSig.set(v); }
	private tipoSig = signal<string>('');
	get tipo() { return this.tipoSig(); } set tipo(v: string) { this.tipoSig.set(v); }
	private clasificacionSig = signal<string>('');
	get clasificacion() { return this.clasificacionSig(); } set clasificacion(v: string) { this.clasificacionSig.set(v); }
	private manualUsuarioSig = signal<'Si' | 'No' | ''>('');
	get manual_usuario() { return this.manualUsuarioSig(); } set manual_usuario(v: 'Si' | 'No' | '') { this.manualUsuarioSig.set(v); }
	private puestaEnServicioSig = signal<string>('');
	get puesta_en_servicio() { return this.puestaEnServicioSig(); } set puesta_en_servicio(v: string) { this.puestaEnServicioSig.set(v); }
	private fechaAdquisicionSig = signal<string>('');
	get fecha_adquisicion() { return this.fechaAdquisicionSig(); } set fecha_adquisicion(v: string) { this.fechaAdquisicionSig.set(v); }

	private creandoSig = signal<boolean>(false);
	get creando() { return this.creandoSig(); } set creando(v: boolean) { this.creandoSig.set(v); }

	// ===== Formulario de mantenimiento =====
	private mEquipoIdSig = signal<number | null>(null);
	get m_equipo_id() { return this.mEquipoIdSig(); } set m_equipo_id(v: number | null) { this.mEquipoIdSig.set(v); }
	private mRequerimientosSig = signal<string>('');
	get m_requerimientos_equipo() { return this.mRequerimientosSig(); } set m_requerimientos_equipo(v: string) { this.mRequerimientosSig.set(v); }
	private mElementosVSig = signal<'Si' | 'No' | ''>('');
	get m_elementos_v() { return this.mElementosVSig(); } set m_elementos_v(v: 'Si' | 'No' | '') { this.mElementosVSig.set(v); }
	private mVoltajeSig = signal<string>('');
	get m_voltaje() { return this.mVoltajeSig(); } set m_voltaje(v: string) { this.mVoltajeSig.set(v); }
	private mElementosFSig = signal<'Si' | 'No' | ''>('');
	get m_elementos_f() { return this.mElementosFSig(); } set m_elementos_f(v: 'Si' | 'No' | '') { this.mElementosFSig.set(v); }
	private mFrecuenciaSig = signal<string>('');
	get m_frecuencia() { return this.mFrecuenciaSig(); } set m_frecuencia(v: string) { this.mFrecuenciaSig.set(v); }
	private mGuardandoSig = signal<boolean>(false);
	get m_guardando() { return this.mGuardandoSig(); } set m_guardando(v: boolean) { this.mGuardandoSig.set(v); }

	// ===== Formulario VCC =====
	private vEquipoIdSig = signal<number | null>(null);
	get v_equipo_id() { return this.vEquipoIdSig(); } set v_equipo_id(v: number | null) { this.vEquipoIdSig.set(v); }
	private vCampoMedicionSig = signal<string>('');
	get v_campo_medicion() { return this.vCampoMedicionSig(); } set v_campo_medicion(v: string) { this.vCampoMedicionSig.set(v); }
	private vExactitudSig = signal<string>('');
	get v_exactitud() { return this.vExactitudSig(); } set v_exactitud(v: string) { this.vExactitudSig.set(v); }
	private vSujVerificarSig = signal<'Si' | 'No' | ''>('');
	get v_sujeto_verificar() { return this.vSujVerificarSig(); } set v_sujeto_verificar(v: 'Si' | 'No' | '') { this.vSujVerificarSig.set(v); }
	private vSujCalibracionSig = signal<'Si' | 'No' | ''>('');
	get v_sujeto_calibracion() { return this.vSujCalibracionSig(); } set v_sujeto_calibracion(v: 'Si' | 'No' | '') { this.vSujCalibracionSig.set(v); }
	private vResolucionSig = signal<string>('');
	get v_resolucion_division() { return this.vResolucionSig(); } set v_resolucion_division(v: string) { this.vResolucionSig.set(v); }
	private vSujCalificacionSig = signal<'Si' | 'No' | ''>('');
	get v_sujeto_calificacion() { return this.vSujCalificacionSig(); } set v_sujeto_calificacion(v: 'Si' | 'No' | '') { this.vSujCalificacionSig.set(v); }
	private vAccesoriosSig = signal<string>('');
	get v_accesorios() { return this.vAccesoriosSig(); } set v_accesorios(v: string) { this.vAccesoriosSig.set(v); }
	private vGuardandoSig = signal<boolean>(false);
	get v_guardando() { return this.vGuardandoSig(); } set v_guardando(v: boolean) { this.vGuardandoSig.set(v); }

	// ===== Formulario Historial Instrumento =====
	private hEquipoIdSig = signal<number | null>(null); get h_equipo_id() { return this.hEquipoIdSig(); } set h_equipo_id(v: number | null) { this.hEquipoIdSig.set(v); }
	private hNumeroSig = signal<string>(''); get h_numero() { return this.hNumeroSig(); } set h_numero(v: string) { this.hNumeroSig.set(v); }
	private hFechaSig = signal<string>(''); get h_fecha() { return this.hFechaSig(); } set h_fecha(v: string) { this.hFechaSig.set(v); }
	private hTipoHistSig = signal<string>(''); get h_tipo_historial() { return this.hTipoHistSig(); } set h_tipo_historial(v: string) { this.hTipoHistSig.set(v); }
	private hCodigoRegSig = signal<string>(''); get h_codigo_registro() { return this.hCodigoRegSig(); } set h_codigo_registro(v: string) { this.hCodigoRegSig.set(v); }
	private hTolGSig = signal<string>(''); get h_tolerancia_g() { return this.hTolGSig(); } set h_tolerancia_g(v: string) { this.hTolGSig.set(v); }
	private hTolErrGSig = signal<string>(''); get h_tolerancia_error_g() { return this.hTolErrGSig(); } set h_tolerancia_error_g(v: string) { this.hTolErrGSig.set(v); }
	private hIncUSig = signal<string>(''); get h_incertidumbre_u() { return this.hIncUSig(); } set h_incertidumbre_u(v: string) { this.hIncUSig.set(v); }
	private hRealizoSig = signal<string>(''); get h_realizo() { return this.hRealizoSig(); } set h_realizo(v: string) { this.hRealizoSig.set(v); }
	private hSupervisoSig = signal<string>(''); get h_superviso() { return this.hSupervisoSig(); } set h_superviso(v: string) { this.hSupervisoSig.set(v); }
	private hObservacionesSig = signal<string>(''); get h_observaciones() { return this.hObservacionesSig(); } set h_observaciones(v: string) { this.hObservacionesSig.set(v); }
	private hGuardandoSig = signal<boolean>(false); get h_guardando() { return this.hGuardandoSig(); } set h_guardando(v: boolean) { this.hGuardandoSig.set(v); }

	// Highlight last created equipo
	private lastCreatedEquipoIdSig = signal<number | null>(null);
	get lastCreatedEquipoId() { return this.lastCreatedEquipoIdSig(); }

	// Listado de equipos (simple) con Signals
	listaSig = signal<any[]>([]);
	listaFiltradaSig = signal<any[]>([]);
	cargando = false;
	error = '';
	// filtro único
	q = '';

	// control de expansión por id
	expandido = new Set<string>();

	// Sub-colapsable: estado de apertura para Mantenimiento por equipo
	private mOpen = new Set<number>();
	// Sub-colapsable: estado de apertura para VCC por equipo
	private vOpen = new Set<number>();
	// Sub-colapsable: estado de apertura para Historial por equipo
	private hOpen = new Set<number>();

	// Mantenimientos por equipo (cache y estados) usando Signals (zoneless-friendly)
	private mMapSig = signal<Record<number, any[]>>({});
	private mLoadingSig = signal<Record<number, boolean>>({});
	private mErrorSig = signal<Record<number, string>>({});

	// VCC por equipo (cache y estados) usando Signals
	private vMapSig = signal<Record<number, any[]>>({});
	private vLoadingSig = signal<Record<number, boolean>>({});
	private vErrorSig = signal<Record<number, string>>({});

	// Historial por equipo (cache y estados) usando Signals
	private hMapSig = signal<Record<number, any[]>>({});
	private hLoadingSig = signal<Record<number, boolean>>({});
	private hErrorSig = signal<Record<number, string>>({});

	// Exponer getters para mantener el template intacto (mMap[e.id], mLoading[e.id], etc.)
	get mMap() { return this.mMapSig(); }
	get mLoading() { return this.mLoadingSig(); }
	get mError() { return this.mErrorSig(); }
	get vMap() { return this.vMapSig(); }
	get vLoading() { return this.vLoadingSig(); }
	get vError() { return this.vErrorSig(); }
	get hMap() { return this.hMapSig(); }
	get hLoading() { return this.hLoadingSig(); }
	get hError() { return this.hErrorSig(); }

	constructor(public snack: SnackbarService) {}

	async ngOnInit() {
		await this.cargarLista();
	}

	// Nota: lista simple, sin expand/collapse ni acciones

	async cargarLista() {
		this.cargando = true; this.error = '';
		try {
				const resp = await equiposService.listarEquipos('');
			const rows = Array.isArray(resp) ? resp : (resp.rows || resp.data || []);
			this.listaSig.set(rows);
			this.listaFiltradaSig.set(rows);
		} catch (e: any) {
			this.error = e?.message || 'Error cargando equipos';
			this.listaSig.set([]); this.listaFiltradaSig.set([]);
			} finally { this.cargando = false; }
	}

	filtrar() {
		const q = (this.q || '').toLowerCase().trim();
		// Defer update to next microtask to avoid ExpressionChanged after input events
		queueMicrotask(() => {
			const filtered = !q ? this.listaSig() : this.listaSig().filter(x => {
				const nombre = String(x.nombre||'').toLowerCase();
				const marca = String(x.marca||'').toLowerCase();
				const codigo = String(x.codigo_identificacion||'').toLowerCase();
				const inv = String(x.inventario_sena||'').toLowerCase();
				return nombre.includes(q) || marca.includes(q) || codigo.includes(q) || inv.includes(q);
			});
			this.listaFiltradaSig.set(filtered);
		});
	}

	async toggleFila(e: any) {
		const key = this.getKey(e);
		if (!key) return;
		if (this.expandido.has(key)) {
			this.expandido.delete(key);
		} else {
			this.expandido.add(key);
			const idNum = Number(e?.id);
			if (!isNaN(idNum)) {
				// Fire-and-forget the async loads to the next microtasks
				Promise.resolve().then(() => this.cargarMantenimientosSiNecesario(idNum));
				Promise.resolve().then(() => this.cargarVccSiNecesario(idNum));
				Promise.resolve().then(() => this.cargarHistorialSiNecesario(idNum));
			}
		}
	}
	isFilaExpandida(e: any): boolean { const key = this.getKey(e); return key ? this.expandido.has(key) : false; }
	private getKey(e: any): string { return String(e?.id ?? e?.codigo_identificacion ?? e?.numero_serie ?? ''); }
	trackById(index: number, e: any) { return e?.id ?? e?.codigo_identificacion ?? index; }

	// --- Nested collapsible: Mantenimiento ---
	toggleMantenimiento(e: any, ev?: Event) {
		if (ev) ev.stopPropagation();
		const id = Number(e?.id);
		if (isNaN(id)) return;
		if (this.mOpen.has(id)) this.mOpen.delete(id); else this.mOpen.add(id);
	}
	isMOpen(e: any): boolean {
		const id = Number(e?.id);
		return !isNaN(id) && this.mOpen.has(id);
	}

	// --- Nested collapsible: VCC ---
	toggleVcc(e: any, ev?: Event) {
		if (ev) ev.stopPropagation();
		const id = Number(e?.id);
		if (isNaN(id)) return;
		if (this.vOpen.has(id)) this.vOpen.delete(id); else this.vOpen.add(id);
	}
	isVOpen(e: any): boolean {
		const id = Number(e?.id);
		return !isNaN(id) && this.vOpen.has(id);
	}

	// --- Nested collapsible: Historial ---
	toggleHistorial(e: any, ev?: Event) {
		if (ev) ev.stopPropagation();
		const id = Number(e?.id);
		if (isNaN(id)) return;
		if (this.hOpen.has(id)) this.hOpen.delete(id); else this.hOpen.add(id);
	}
	isHOpen(e: any): boolean {
		const id = Number(e?.id);
		return !isNaN(id) && this.hOpen.has(id);
	}

	private async cargarMantenimientosSiNecesario(equipoId: number) {
		if (!equipoId) return;
		if (this.mMapSig()[equipoId]) return; // ya cargado
		this.mLoadingSig.update(s => ({ ...s, [equipoId]: true }));
		this.mErrorSig.update(s => ({ ...s, [equipoId]: '' }));
		try {
			const rows = await equiposService.listarMantenimientos(equipoId);
			this.mMapSig.update(s => ({ ...s, [equipoId]: Array.isArray(rows) ? rows : [] }));
		} catch (e: any) {
			this.mErrorSig.update(s => ({ ...s, [equipoId]: e?.message || 'Error cargando mantenimientos' }));
			this.mMapSig.update(s => ({ ...s, [equipoId]: [] }));
		} finally { this.mLoadingSig.update(s => ({ ...s, [equipoId]: false })); }
	}

	private async cargarVccSiNecesario(equipoId: number) {
		if (!equipoId) return;
		if (this.vMapSig()[equipoId]) return; // ya cargado
		this.vLoadingSig.update(s => ({ ...s, [equipoId]: true }));
		this.vErrorSig.update(s => ({ ...s, [equipoId]: '' }));
		try {
			const rows = await equiposService.listarVerificaciones(equipoId);
			this.vMapSig.update(s => ({ ...s, [equipoId]: Array.isArray(rows) ? rows : [] }));
		} catch (e: any) {
			this.vErrorSig.update(s => ({ ...s, [equipoId]: e?.message || 'Error cargando verificaciones/calibraciones/calificaciones' }));
			this.vMapSig.update(s => ({ ...s, [equipoId]: [] }));
		} finally { this.vLoadingSig.update(s => ({ ...s, [equipoId]: false })); }
	}

	private async cargarHistorialSiNecesario(equipoId: number) {
		if (!equipoId) return;
		if (this.hMapSig()[equipoId]) return; // ya cargado
		this.hLoadingSig.update(s => ({ ...s, [equipoId]: true }));
		this.hErrorSig.update(s => ({ ...s, [equipoId]: '' }));
		try {
			const rows = await equiposService.listarHistorial(equipoId);
			this.hMapSig.update(s => ({ ...s, [equipoId]: Array.isArray(rows) ? rows : [] }));
		} catch (e: any) {
			this.hErrorSig.update(s => ({ ...s, [equipoId]: e?.message || 'Error cargando historial' }));
			this.hMapSig.update(s => ({ ...s, [equipoId]: [] }));
		} finally { this.hLoadingSig.update(s => ({ ...s, [equipoId]: false })); }
	}

	async crearEquipo(ev: Event) {
		ev.preventDefault();
		if (!this.nombre.trim()) {
			this.snack.warn('El nombre es requerido');
			return;
		}
		const payload = {
			nombre: this.nombre.trim(),
			modelo: this.modelo?.trim() || null,
			marca: this.marca?.trim() || null,
			inventario_sena: this.inventario_sena?.trim() || null,
			acreditacion: this.acreditacion || null,
			tipo_manual: this.tipo_manual || null,
			codigo_identificacion: this.codigo_identificacion?.trim() || null,
			numero_serie: this.numero_serie?.trim() || null,
			tipo: this.tipo?.trim() || null,
			clasificacion: this.clasificacion?.trim() || null,
			manual_usuario: this.manual_usuario || null,
			puesta_en_servicio: this.puesta_en_servicio || null,
			fecha_adquisicion: this.fecha_adquisicion || null,
		};
		this.creando = true;
		try {
			const creado = await equiposService.crearEquipo(payload);
			this.snack.success('Equipo creado');
			// Insertar placeholder y luego reemplazar por el registro completo desde el backend
			const nuevoId = Number(creado?.id);
			let insertado: any = creado;
			if (!isNaN(nuevoId)) {
				try {
					const fullRow = await equiposService.obtenerEquipo(nuevoId);
					insertado = fullRow || creado;
				} catch {
					// si falla, usamos lo que devolvió el POST
				}
			}
			this.listaSig.update(arr => [insertado, ...arr]);
			this.filtrar();
			// Expandir automáticamente el nuevo equipo y precargar (vacío) mantenimiento/VCC
			if (!isNaN(nuevoId)) {
				this.expandido.add(String(nuevoId));
				// preload empty arrays (reactive) so UI muestra bloques sin esperar fetch
				this.mMapSig.update(s => ({ ...s, [nuevoId]: [] }));
				this.vMapSig.update(s => ({ ...s, [nuevoId]: [] }));
				this.hMapSig.update(s => ({ ...s, [nuevoId]: [] }));
				// Lanzar carga real en segundo plano
				Promise.resolve().then(() => this.cargarMantenimientosSiNecesario(nuevoId));
				Promise.resolve().then(() => this.cargarVccSiNecesario(nuevoId));
				Promise.resolve().then(() => this.cargarHistorialSiNecesario(nuevoId));
				this.lastCreatedEquipoIdSig.set(nuevoId);
			}
			this.resetForm();
		} catch (e: any) {
			this.snack.error(e?.message || 'Error creando equipo');
		} finally {
			this.creando = false;
		}
	}

	resetForm() {
		this.nombre = '';
		this.modelo = '';
		this.marca = '';
		this.inventario_sena = '';
		this.acreditacion = '';
		this.tipo_manual = '';
		this.codigo_identificacion = '';
		this.numero_serie = '';
		this.tipo = '';
		this.clasificacion = '';
		this.manual_usuario = '';
		this.puesta_en_servicio = '';
		this.fecha_adquisicion = '';
	}

	async crearMantenimiento(ev: Event) {
		ev.preventDefault();
		if (!this.m_equipo_id) { this.snack.warn('Seleccione un equipo'); return; }
		const payload = {
			requerimientos_equipo: this.m_requerimientos_equipo?.trim() || null,
			elementos_v: this.m_elementos_v || null,
			voltaje: this.m_voltaje?.trim() || null,
			elementos_f: this.m_elementos_f || null,
			frecuencia: this.m_frecuencia?.trim() || null,
		};
		this.m_guardando = true;
		try {
			await equiposService.crearMantenimiento(this.m_equipo_id, payload);
			this.snack.success('Mantenimiento registrado');
			const idNum = Number(this.m_equipo_id);
			if (!isNaN(idNum)) {
				// Refetch completo para obtener todos los campos (requerimientos, enums normalizados, etc.)
				try {
					const rows = await equiposService.listarMantenimientos(idNum);
					this.mMapSig.update(s => ({ ...s, [idNum]: Array.isArray(rows) ? rows : [] }));
				} catch (e) {
					// En caso de fallo mantener lista previa
				}
			}
			this.m_equipo_id = null;
			this.m_requerimientos_equipo = '';
			this.m_elementos_v = '';
			this.m_voltaje = '';
			this.m_elementos_f = '';
			this.m_frecuencia = '';
		} catch (e: any) {
			this.snack.error(e?.message || 'Error registrando mantenimiento');
		} finally {
			this.m_guardando = false;
		}
	}

	async crearVcc(ev: Event) {
		ev.preventDefault();
		if (!this.v_equipo_id) { this.snack.warn('Seleccione un equipo'); return; }
		const payload = {
			campo_medicion: this.v_campo_medicion?.trim() || null,
			exactitud: this.v_exactitud?.trim() || null,
			sujeto_verificar: this.v_sujeto_verificar || null,
			sujeto_calibracion: this.v_sujeto_calibracion || null,
			resolucion_division: this.v_resolucion_division?.trim() || null,
			sujeto_calificacion: this.v_sujeto_calificacion || null,
			accesorios: this.v_accesorios?.trim() || null,
		};
		this.v_guardando = true;
		try {
			await equiposService.crearVerificacion(this.v_equipo_id, payload);
			this.snack.success('Registro VCC guardado');
			const idNum = Number(this.v_equipo_id);
			if (!isNaN(idNum)) {
				// Refetch para tener todos los campos normalizados
				try {
					const rows = await equiposService.listarVerificaciones(idNum);
					this.vMapSig.update(s => ({ ...s, [idNum]: Array.isArray(rows) ? rows : [] }));
				} catch {}
			}
			// limpiar
			this.v_equipo_id = null;
			this.v_campo_medicion = '';
			this.v_exactitud = '';
			this.v_sujeto_verificar = '';
			this.v_sujeto_calibracion = '';
			this.v_resolucion_division = '';
			this.v_sujeto_calificacion = '';
			this.v_accesorios = '';
		} catch (e: any) {
			this.snack.error(e?.message || 'Error guardando VCC');
		} finally {
			this.v_guardando = false;
		}
	}

	async crearHistorial(ev: Event) {
		ev.preventDefault();
		if (!this.h_equipo_id) { this.snack.warn('Seleccione un equipo'); return; }
		const payload = {
			numero: String(this.h_numero || '').trim() || null,
			fecha: this.h_fecha || null,
			tipo_historial: String(this.h_tipo_historial || '').trim() || null,
			codigo_registro: String(this.h_codigo_registro || '').trim() || null,
			tolerancia_g: String(this.h_tolerancia_g || '').trim() || null,
			tolerancia_error_g: String(this.h_tolerancia_error_g || '').trim() || null,
			incertidumbre_u: String(this.h_incertidumbre_u || '').trim() || null,
			realizo: String(this.h_realizo || '').trim() || null,
			superviso: String(this.h_superviso || '').trim() || null,
			observaciones: String(this.h_observaciones || '').trim() || null,
		};
		this.h_guardando = true;
		try {
			await equiposService.crearHistorial(this.h_equipo_id, payload);
			this.snack.success('Historial registrado');
			// reset
			this.h_equipo_id = null;
			this.h_numero = '';
			this.h_fecha = '';
			this.h_tipo_historial = '';
			this.h_codigo_registro = '';
			this.h_tolerancia_g = '';
			this.h_tolerancia_error_g = '';
			this.h_incertidumbre_u = '';
			this.h_realizo = '';
			this.h_superviso = '';
			this.h_observaciones = '';
		} catch (e: any) {
			this.snack.error(e?.message || 'Error creando historial');
		} finally {
			this.h_guardando = false;
		}
	}

	// Propiedades para el formulario de intervalo de calibración
	ic_equipo_id: number | null = null;
	ic_numero: number | null = null;
	ic_unidad_nominal_g: number | null = null;
	ic_calibracion_1: string | null = null;
	ic_fecha_c1: string | null = null;
	ic_error_c1_g: number | null = null;
	ic_calibracion_2: string | null = null;
	ic_fecha_c2: string | null = null;
	ic_error_c2_g: number | null = null;
	ic_diferencia_dias: number | null = null;
	ic_desviacion: number | null = null;
	ic_deriva: number | null = null;
	ic_tolerancia_g: number | null = null;
	ic_intervalo_calibraciones_dias: number | null = null;
	ic_intervalo_calibraciones_anios: number | null = null;
	ic_guardando: boolean = false;

	// Lista para almacenar los intervalos de calibración
	listaIntervalos: any[] = [];

	// Método para manejar el envío del formulario
	crearIntervaloCalibracion(event: Event): void {
		event.preventDefault();
		this.ic_guardando = true;

		const nuevoIntervalo = {
			equipo_id: this.ic_equipo_id,
			numero: this.ic_numero,
			unidad_nominal_g: this.ic_unidad_nominal_g,
			calibracion_1: this.ic_calibracion_1,
			fecha_c1: this.ic_fecha_c1,
			error_c1_g: this.ic_error_c1_g,
			calibracion_2: this.ic_calibracion_2,
			fecha_c2: this.ic_fecha_c2,
			error_c2_g: this.ic_error_c2_g,
			diferencia_dias: this.ic_diferencia_dias,
			desviacion: this.ic_desviacion,
			deriva: this.ic_deriva,
			tolerancia_g: this.ic_tolerancia_g,
			intervalo_calibraciones_dias: this.ic_intervalo_calibraciones_dias,
			intervalo_calibraciones_anios: this.ic_intervalo_calibraciones_anios,
		};

		this.ic_guardando = true;
		const equipoId = this.ic_equipo_id;
		equiposService.crearIntervalo(equipoId!, nuevoIntervalo)
			.then(() => {
				alert('Intervalo de calibración guardado con éxito');
				this.cargarIntervalos(equipoId!);
				this.limpiarFormulario();
			})
			.catch((err: any) => {
				alert('Error al guardar intervalo');
				console.error(err);
			})
			.finally(() => {
				this.ic_guardando = false;
			});
	}

	// Método para limpiar el formulario después de guardar
	limpiarFormulario(): void {
		this.ic_equipo_id = null;
		this.ic_numero = null;
		this.ic_unidad_nominal_g = null;
		this.ic_calibracion_1 = null;
		this.ic_fecha_c1 = null;
		this.ic_error_c1_g = null;
		this.ic_calibracion_2 = null;
		this.ic_fecha_c2 = null;
		this.ic_error_c2_g = null;
		this.ic_diferencia_dias = null;
		this.ic_desviacion = null;
		this.ic_deriva = null;
		this.ic_tolerancia_g = null;
		this.ic_intervalo_calibraciones_dias = null;
		this.ic_intervalo_calibraciones_anios = null;
	}

	// Getters para usar Signals en el template sin cambiar binding existentes
	get lista() { return this.listaSig(); }
	get listaFiltrada() { return this.listaFiltradaSig(); }

	// Propiedades para manejar el estado de los intervalos de calibración
	intervalosLoading: { [key: number]: boolean } = {};
	intervalosError: { [key: number]: string } = {};
	intervalosMap: { [key: number]: any[] } = {};
	intervalosOpen: { [key: number]: boolean } = {};

	// Método para alternar el estado del desplegable de intervalos de calibración
	toggleIntervalos(equipo: any, event: Event): void {
		event.stopPropagation();
		const equipoId = equipo.id;
		this.intervalosOpen[equipoId] = !this.intervalosOpen[equipoId];

		if (this.intervalosOpen[equipoId] && !this.intervalosMap[equipoId]) {
			this.cargarIntervalos(equipoId);
		}
	}

	// Método para verificar si el desplegable está abierto
	isIntervalosOpen(equipo: any): boolean {
		return !!this.intervalosOpen[equipo.id];
	}

	// Método para cargar los intervalos de calibración de un equipo
	cargarIntervalos(equipoId: number): void {
		this.intervalosLoading[equipoId] = true;
		this.intervalosError[equipoId] = '';

		// Lógica real: consulta al backend
		equiposService.listarIntervalos(equipoId)
			.then((intervalos: any[]) => {
				this.intervalosMap[equipoId] = Array.isArray(intervalos) ? intervalos : [];
				this.intervalosLoading[equipoId] = false;
			})
			.catch((err: any) => {
				this.intervalosError[equipoId] = err?.message || 'Error cargando intervalos';
				this.intervalosMap[equipoId] = [];
				this.intervalosLoading[equipoId] = false;
			});
	}

	// --- Utilidades de fecha ---
	private parseFlexibleDate(value: any): Date | null {
		if (!value) return null;
		if (value instanceof Date && !isNaN(value.getTime())) return value;
		let str = String(value).trim();
		if (!str) return null;
		// Normalizar separadores
		const isoLike = /^\d{4}-\d{2}-\d{2}(?:[Tt].*)?$/;
		const ymd = /^\d{4}-\d{2}-\d{2}$/;
		const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;

		// ISO o yyyy-MM-dd
		if (isoLike.test(str)) {
			const d = new Date(str);
			return isNaN(d.getTime()) ? null : d;
		}
		if (ymd.test(str)) {
			const [y, m, d] = str.split('-').map(n => parseInt(n, 10));
			const dt = new Date(y, m - 1, d);
			return isNaN(dt.getTime()) ? null : dt;
		}

		// dd/MM/yyyy o dd-MM-yyyy (por defecto día/mes/año)
		const mDmy = str.match(dmy);
		if (mDmy) {
			let dd = parseInt(mDmy[1], 10);
			let mm = parseInt(mDmy[2], 10);
			let yy = parseInt(mDmy[3], 10);
			if (yy < 100) yy += 2000; // manejar años de 2 dígitos como 20xx
			const dt = new Date(yy, mm - 1, dd);
			return isNaN(dt.getTime()) ? null : dt;
		}

		// Intento final con Date.parse
		const dt = new Date(str);
		return isNaN(dt.getTime()) ? null : dt;
	}

	formatFechaPuesta(value: any): string {
		const dt = this.parseFlexibleDate(value);
		if (!dt) return '—';
		const dd = String(dt.getDate()).padStart(2, '0');
		const mm = String(dt.getMonth() + 1).padStart(2, '0');
		const yyyy = dt.getFullYear();
		return `${dd}/${mm}/${yyyy}`;
	}

	// Método para eliminar un equipo
	eliminarEquipo(equipoId: number, event: Event): void {
		event.stopPropagation();

		if (confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
			equiposService.eliminarEquipo(equipoId)
				.then(() => {
					alert('Equipo eliminado con éxito');
					// Refresca la lista usando signals
					this.cargarLista();
				})
				.catch(err => {
					alert('Error al eliminar el equipo');
					console.error(err);
				});
		}
	}
}


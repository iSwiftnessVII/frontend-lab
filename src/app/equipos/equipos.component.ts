import { Component, signal, ChangeDetectorRef } from '@angular/core';
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
	// Form model
	nombre = '';
	modelo = '';
	marca = '';
	inventario_sena = '';
	acreditacion: 'Si' | 'No aplica' | '' = '';
	tipo_manual: 'Fisico' | 'Digital' | '' = '';
	codigo_identificacion = '';
	numero_serie = '';
	tipo = '';
	clasificacion = '';
	manual_usuario: 'Si' | 'No' | '' = '';
	puesta_en_servicio = '';
	fecha_adquisicion = '';

	creando = false;

	// Formulario de mantenimiento (dentro del apartado Equipos)
	m_equipo_id: number | null = null;
	m_requerimientos_equipo = '';
	m_elementos_v: 'Si' | 'No' | '' = '';
	m_voltaje = '';
	m_elementos_f: 'Si' | 'No' | '' = '';
	m_frecuencia = '';
	m_guardando = false;

	// Formulario VCC (Verificación/Calibración/Calificación)
	v_equipo_id: number | null = null;
	v_campo_medicion = '';
	v_exactitud = '';
	v_sujeto_verificar: 'Si' | 'No' | '' = '';
	v_sujeto_calibracion: 'Si' | 'No' | '' = '';
	v_resolucion_division = '';
	v_sujeto_calificacion: 'Si' | 'No' | '' = '';
	v_accesorios = '';
	v_guardando = false;

	// Listado de equipos (simple) con Signals
	listaSig = signal<any[]>([]);
	listaFiltradaSig = signal<any[]>([]);
	cargando = false;
	error = '';
	// filtro único
	q = '';

	// control de expansión por id
	expandido = new Set<string>();

	// Mantenimientos por equipo (cache y estados)
	mMap: Record<number, any[]> = {};
	mLoading: Record<number, boolean> = {};
	mError: Record<number, string> = {};

	// VCC por equipo (cache y estados)
	vMap: Record<number, any[]> = {};
	vLoading: Record<number, boolean> = {};
	vError: Record<number, string> = {};

	constructor(public snack: SnackbarService, private cdr: ChangeDetectorRef) {}

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
			try { this.cdr.detectChanges(); } catch {}
		} catch (e: any) {
			this.error = e?.message || 'Error cargando equipos';
			this.listaSig.set([]); this.listaFiltradaSig.set([]);
			try { this.cdr.detectChanges(); } catch {}
		} finally { this.cargando = false; try { this.cdr.detectChanges(); } catch {} }
	}

	filtrar() {
		const q = (this.q || '').toLowerCase().trim();
		const filtered = !q ? this.listaSig() : this.listaSig().filter(x => {
			const nombre = String(x.nombre||'').toLowerCase();
			const marca = String(x.marca||'').toLowerCase();
			const codigo = String(x.codigo_identificacion||'').toLowerCase();
			const inv = String(x.inventario_sena||'').toLowerCase();
			return nombre.includes(q) || marca.includes(q) || codigo.includes(q) || inv.includes(q);
		});
		this.listaFiltradaSig.set(filtered);
		try { this.cdr.detectChanges(); } catch {}
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
				await this.cargarMantenimientosSiNecesario(idNum);
				await this.cargarVccSiNecesario(idNum);
			}
		}
		try { this.cdr.detectChanges(); } catch {}
	}
	isFilaExpandida(e: any): boolean { const key = this.getKey(e); return key ? this.expandido.has(key) : false; }
	private getKey(e: any): string { return String(e?.id ?? e?.codigo_identificacion ?? e?.numero_serie ?? ''); }
	trackById(index: number, e: any) { return e?.id ?? e?.codigo_identificacion ?? index; }

	private async cargarMantenimientosSiNecesario(equipoId: number) {
		if (!equipoId) return;
		if (this.mMap[equipoId]) return; // ya cargado
		this.mLoading[equipoId] = true; this.mError[equipoId] = '';
		try {
			const rows = await equiposService.listarMantenimientos(equipoId);
			this.mMap[equipoId] = Array.isArray(rows) ? rows : [];
		} catch (e: any) {
			this.mError[equipoId] = e?.message || 'Error cargando mantenimientos';
			this.mMap[equipoId] = [];
		} finally { this.mLoading[equipoId] = false; try { this.cdr.detectChanges(); } catch {} }
	}

	private async cargarVccSiNecesario(equipoId: number) {
		if (!equipoId) return;
		if (this.vMap[equipoId]) return; // ya cargado
		this.vLoading[equipoId] = true; this.vError[equipoId] = '';
		try {
			const rows = await equiposService.listarVerificaciones(equipoId);
			this.vMap[equipoId] = Array.isArray(rows) ? rows : [];
		} catch (e: any) {
			this.vError[equipoId] = e?.message || 'Error cargando verificaciones/calibraciones/calificaciones';
			this.vMap[equipoId] = [];
		} finally { this.vLoading[equipoId] = false; try { this.cdr.detectChanges(); } catch {} }
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
			await equiposService.crearEquipo(payload);
			this.snack.success('Equipo creado');
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
			// refrescar mantenimientos si el equipo está expandido
			const expKeys = Array.from(this.expandido);
			for (const k of expKeys) {
				const idNum = Number(k);
				if (!isNaN(idNum) && idNum === this.m_equipo_id) {
					try {
						const rows = await equiposService.listarMantenimientos(idNum);
						this.mMap[idNum] = Array.isArray(rows) ? rows : [];
					} catch {}
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
			// refrescar si expandido
			const expKeys = Array.from(this.expandido);
			for (const k of expKeys) {
				const idNum = Number(k);
				if (!isNaN(idNum) && idNum === this.v_equipo_id) {
					try {
						const rows = await equiposService.listarVerificaciones(idNum);
						this.vMap[idNum] = Array.isArray(rows) ? rows : [];
					} catch {}
				}
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

	// Getters para usar Signals en el template sin cambiar binding existentes
	get lista() { return this.listaSig(); }
	get listaFiltrada() { return this.listaFiltradaSig(); }

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
}


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

	// Listado de equipos (simple) con Signals
	listaSig = signal<any[]>([]);
	listaFiltradaSig = signal<any[]>([]);
	cargando = false;
	error = '';
	// filtro único
	q = '';

	// control de expansión por id
	expandido = new Set<string>();

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

	toggleFila(e: any) {
		const key = this.getKey(e);
		if (!key) return;
		if (this.expandido.has(key)) this.expandido.delete(key); else this.expandido.add(key);
		try { this.cdr.detectChanges(); } catch {}
	}
	isFilaExpandida(e: any): boolean { const key = this.getKey(e); return key ? this.expandido.has(key) : false; }
	private getKey(e: any): string { return String(e?.id ?? e?.codigo_identificacion ?? e?.numero_serie ?? ''); }
	trackById(index: number, e: any) { return e?.id ?? e?.codigo_identificacion ?? index; }

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

	// Getters para usar Signals en el template sin cambiar binding existentes
	get lista() { return this.listaSig(); }
	get listaFiltrada() { return this.listaFiltradaSig(); }
}


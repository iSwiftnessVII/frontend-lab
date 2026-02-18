import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { insumosService } from '../services/insumos.service';
import { reactivosService } from '../services/reactivos.service';
import { authService, authUser } from '../services/auth.service';
import { equiposService } from '../services/equipos.service';
import { PapeleriaService } from '../services/papeleria.service';
import { VolumetricosService } from '../services/volumetricos.service';
import { ReferenciaService } from '../services/referencia.service';
import { HttpClientModule } from '@angular/common/http';

const API_SOLICITUDES_BASE = (window as any).__env?.API_SOLICITUDES || 'http://localhost:42420/api/solicitudes';
const API_SOLICITUDES_DETALLE_LISTA = (window as any).__env?.API_SOLICITUDES_DETALLE_LISTA || (API_SOLICITUDES_BASE + '/detalle/lista');

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, RouterModule, HttpClientModule]
})
export class DashboardComponent implements OnInit {
  // Estado de carga
  cargando = signal(true);
  proximosVencerExpanded = false;
  vencidosExpanded = false;
  
  // Métricas principales - extendidas
  metricas = signal({
    totalInsumos: 0,
    totalReactivos: 0,
    totalSolicitudes: 0,
    totalClientes: 0,
    totalPapeleria: 0,
    totalEquipos: 0,
    totalVolumetricos: 0,
    totalReferencia: 0
  });

  // Datos para gráficos
  insumosData = signal<any[]>([]);
  reactivosData = signal<any[]>([]);
  solicitudesData = signal<any[]>([]);
  clientesData = signal<any[]>([]);
  papeleriaData = signal<any[]>([]);
  equiposData = signal<any[]>([]);
  volumetricosData = signal<any[]>([]);
  referenciaData = signal<any[]>([]);
  consumoData = signal<any[]>([]);

  // Reactivos próximos a vencer
  reactivosProximosVencer = signal<any[]>([]);
  // Reactivos vencidos
  reactivosVencidos = signal<any[]>([]);

  // Detectar si el usuario es auxiliar
  get esAuxiliar() {
    const user = authUser();
    return user?.rol === 'Auxiliar';
  }

  constructor(
    private referenciaService: ReferenciaService,
    private papeleriaService: PapeleriaService,
    private volumetricosService: VolumetricosService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarDashboard();
    this.cargando.set(false);
  }

  navigate(path: string) {
    if (this.esAuxiliar) return;
    this.router.navigateByUrl(path);
  }

  async cargarDashboard() {
    try {
      // Cargar datos en paralelo - OPTIMIZADO
      const tasks: Promise<void>[] = [
        this.cargarInsumos(),
        this.cargarReactivos(),
        this.cargarPapeleria(),
        this.cargarEquipos(),
        this.cargarVolumetricos(),
        this.cargarReferencia(),
        this.cargarClientes(),
        this.cargarConsumos()
      ];

      if (!this.esAuxiliar) {
        tasks.push(this.cargarSolicitudes());
      }

      await Promise.all(tasks);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  }

  async cargarPapeleria() {
    try {
      const pap = await this.papeleriaService.listar('', 1000);
      const rows = Array.isArray(pap) ? pap : ((pap as any)?.rows ?? []);
      const total = Array.isArray(pap) ? pap.length : (pap as any)?.total ?? rows.length;
      this.papeleriaData.set(rows);
      this.metricas.update(m => ({ ...m, totalPapeleria: total }));
    } catch (error) {
      console.error('Error cargando papelería:', error);
      this.metricas.update(m => ({ ...m, totalPapeleria: 0 }));
      this.papeleriaData.set([]);
    }
  }

  async cargarEquipos() {
    try {
      const equipos = await equiposService.listarEquipos();
      const rows = Array.isArray(equipos) ? equipos : ((equipos as any)?.rows ?? []);
      const total = Array.isArray(equipos) ? equipos.length : (equipos as any)?.total ?? rows.length;
      this.equiposData.set(rows);
      this.metricas.update(m => ({ ...m, totalEquipos: total }));
    } catch (error) {
      console.error('Error cargando equipos:', error);
      this.metricas.update(m => ({ ...m, totalEquipos: 0 }));
      this.equiposData.set([]);
    }
  }

  async cargarVolumetricos() {
    try {
      const mats = await this.volumetricosService.listarMateriales();
      const rows = Array.isArray(mats) ? mats : ((mats as any)?.rows ?? []);
      const total = Array.isArray(mats) ? mats.length : (mats as any)?.total ?? rows.length;
      this.volumetricosData.set(rows);
      this.metricas.update(m => ({ ...m, totalVolumetricos: total }));
    } catch (error) {
      console.error('Error cargando materiales volumétricos:', error);
      this.metricas.update(m => ({ ...m, totalVolumetricos: 0 }));
      this.volumetricosData.set([]);
    }
  }

  async cargarReferencia() {
    try {
      const mats = await this.referenciaService.listarMateriales();
      const rows = Array.isArray(mats) ? mats : ((mats as any)?.rows ?? []);
      const total = Array.isArray(mats) ? mats.length : (mats as any)?.total ?? rows.length;
      this.referenciaData.set(rows);
      this.metricas.update(m => ({ ...m, totalReferencia: total }));
    } catch (error) {
      console.error('Error cargando materiales de referencia:', error);
      this.metricas.update(m => ({ ...m, totalReferencia: 0 }));
      this.referenciaData.set([]);
    }
  }

  async cargarInsumos() {
    try {
      const insumos = await insumosService.listarInsumos('', 1000);
      this.insumosData.set(insumos);
      this.metricas.update(m => ({ ...m, totalInsumos: insumos.length }));
    } catch (error) {
      console.error('Error cargando insumos:', error);
    }
  }

  async cargarReactivos() {
    try {
      const resp = await reactivosService.listarReactivos('', 1000);
      const reactivos = Array.isArray(resp) ? resp : (resp?.rows || []);
      const visible = reactivos.filter((r: any) => {
        const v = r?.activo;
        if (v === undefined || v === null) return true;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1;
        const s = String(v).trim().toLowerCase();
        return s === '1' || s === 'true' || s === 't' || s === 'yes' || s === 'y';
      });
      const total = Array.isArray(resp) ? visible.length : (resp?.total ?? visible.length);
      this.reactivosData.set(visible);
      this.metricas.update(m => ({ ...m, totalReactivos: total }));
      
      // Calcular reactivos próximos a vencer (30 días)
      const hoy = new Date();
      const limite = new Date();
      limite.setDate(hoy.getDate() + 30);
      
      const proximos = visible.filter((reactivo: any) => {
        if (!reactivo.fecha_vencimiento) return false;
        const fechaVenc = new Date(reactivo.fecha_vencimiento);
        return fechaVenc <= limite && fechaVenc >= hoy;
      });
      
      this.reactivosProximosVencer.set(proximos);

      // Vencidos: fecha_vencimiento estrictamente menor a hoy
      const vencidos = visible.filter((reactivo: any) => {
        if (!reactivo.fecha_vencimiento) return false;
        const fechaVenc = new Date(reactivo.fecha_vencimiento);
        return fechaVenc < hoy;
      });
      this.reactivosVencidos.set(vencidos);
    } catch (error) {
      console.error('Error cargando reactivos:', error);
    }
  }

  async cargarConsumos() {
    try {
      const rows = await reactivosService.listarConsumos(200);
      this.consumoData.set(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('Error cargando consumos:', error);
      this.consumoData.set([]);
    }
  }

  async cargarSolicitudes() {
    try {
      const token = authService.getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(API_SOLICITUDES_DETALLE_LISTA, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const solicitudes = Array.isArray(payload) ? payload : (payload?.rows || payload?.data || []);
      const total = Array.isArray(payload) ? solicitudes.length : (payload?.total ?? solicitudes.length);
      this.solicitudesData.set(solicitudes);
      this.metricas.update(m => ({ ...m, totalSolicitudes: total }));
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      this.solicitudesData.set([]); // ← SETEAR ARRAY VACÍO EN CASO DE ERROR
    }
  }

  async cargarClientes() {
    try {
      const token = authService.getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(API_SOLICITUDES_BASE + '/clientes', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const clientes = await res.json();
      this.clientesData.set(clientes);
      this.metricas.update(m => ({ ...m, totalClientes: clientes.length }));
    } catch (error) {
      console.error('Error cargando clientes:', error);
      this.clientesData.set([]); // ← SETEAR ARRAY VACÍO EN CASO DE ERROR
    }
  }

  // Métodos para cálculos
  private isTruthyFlag(val: any): boolean {
    return val === true || val === 1 || val === '1' || val === 'true';
  }

  private isUnset(val: any): boolean {
    return val === null || val === undefined || val === '';
  }

  private getConceptoFinal(val: any): string {
    return String(val || '').trim().toUpperCase();
  }

  private isActiveFlag(val: any): boolean | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    const s = String(val).trim().toUpperCase();
    if (s === 'ACTIVO' || s === 'ACTIVE') return true;
    if (s === 'INACTIVO' || s === 'INACTIVE' || s === 'BAJA' || s === 'SUSPENDIDO') return false;
    if (s === '1' || s === 'TRUE' || s === 'YES' || s === 'Y') return true;
    if (s === '0' || s === 'FALSE' || s === 'NO' || s === 'N') return false;
    return null;
  }

  private buildEstadoSegments(list: any[]): Array<{ label: string; value: number }> {
    let activos = 0;
    let inactivos = 0;
    let otros = 0;

    for (const item of list) {
      const val = item?.estado ?? item?.activo ?? item?.status;
      const flag = this.isActiveFlag(val);
      if (flag === true) activos += 1;
      else if (flag === false) inactivos += 1;
      else otros += 1;
    }

    const segments: Array<{ label: string; value: number }> = [];
    if (activos) segments.push({ label: 'Activos', value: activos });
    if (inactivos) segments.push({ label: 'Inactivos', value: inactivos });
    if (otros) segments.push({ label: 'Otros', value: otros });
    return segments;
  }

  private buildGroupSegments(list: any[], fields: string[], fallbackLabel: string): Array<{ label: string; value: number }> {
    const counts = new Map<string, number>();
    for (const item of list) {
      let label: string | null = null;
      for (const field of fields) {
        const raw = item?.[field];
        if (raw !== undefined && raw !== null && String(raw).trim()) {
          label = String(raw).trim();
          break;
        }
      }
      const key = label ?? fallbackLabel;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const sorted = Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 3) return sorted;
    const top = sorted.slice(0, 3);
    const rest = sorted.slice(3).reduce((acc, item) => acc + item.value, 0);
    if (rest > 0) top.push({ label: 'Otros', value: rest });
    return top;
  }

  private readonly pieColors = ['#2563eb', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#64748b'];

  private buildPieSegments(segments: Array<{ label: string; value: number }>): Array<{ label: string; value: number; color: string }> {
    return segments
      .filter(seg => seg.value > 0)
      .map((seg, idx) => ({ ...seg, color: this.pieColors[idx % this.pieColors.length] }));
  }

  private buildPieStyle(segments: Array<{ label: string; value: number; color: string }>): string {
    const total = segments.reduce((acc, seg) => acc + seg.value, 0);
    if (!total) return 'conic-gradient(#e2e8f0 0 360deg)';
    let start = 0;
    const stops = segments.map(seg => {
      const pct = (seg.value / total) * 100;
      const end = start + pct;
      const stop = `${seg.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      start = end;
      return stop;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  getInsumosPieSegments() {
    return this.buildPieSegments(this.buildEstadoSegments(this.insumosData()));
  }

  getInsumosPieStyle() {
    return this.buildPieStyle(this.getInsumosPieSegments());
  }

  getReactivosPieSegments() {
    const counts = { S: 0, R: 0, M: 0, Otros: 0 };
    for (const r of this.reactivosData()) {
      const codigo = String(r?.codigo || '').trim().toUpperCase();
      if (codigo.startsWith('S-')) counts.S += 1;
      else if (codigo.startsWith('R-')) counts.R += 1;
      else if (codigo.startsWith('M-')) counts.M += 1;
      else counts.Otros += 1;
    }
    return this.buildPieSegments([
      { label: 'S', value: counts.S },
      { label: 'R', value: counts.R },
      { label: 'M', value: counts.M },
      { label: 'Otros', value: counts.Otros }
    ]);
  }

  getReactivosPieStyle() {
    return this.buildPieStyle(this.getReactivosPieSegments());
  }

  getConsumoTotal(): number {
    return this.consumoData().length;
  }

  getConsumoUltimaFecha(): Date | null {
    const rows = this.consumoData();
    if (!rows.length) return null;
    const latest = rows.reduce<Date | null>((acc, item) => {
      const val = item?.fecha;
      if (!val) return acc;
      const d = new Date(val);
      if (isNaN(d.getTime())) return acc;
      return !acc || d > acc ? d : acc;
    }, null);
    return latest;
  }

  getConsumoPieSegments() {
    const counts = { S: 0, R: 0, M: 0, Otros: 0 };
    for (const c of this.consumoData()) {
      const codigo = String(c?.codigo || '').trim().toUpperCase();
      if (codigo.startsWith('S-')) counts.S += 1;
      else if (codigo.startsWith('R-')) counts.R += 1;
      else if (codigo.startsWith('M-')) counts.M += 1;
      else counts.Otros += 1;
    }
    return this.buildPieSegments([
      { label: 'S', value: counts.S },
      { label: 'R', value: counts.R },
      { label: 'M', value: counts.M },
      { label: 'Otros', value: counts.Otros }
    ]);
  }

  getConsumoPieStyle() {
    return this.buildPieStyle(this.getConsumoPieSegments());
  }

  getSolicitudesPieSegments() {
    return this.buildPieSegments([
      { label: 'Viables', value: this.contarSolicitudesViable() },
      { label: 'No viables', value: this.contarSolicitudesNoViable() },
      { label: 'En revision', value: this.contarSolicitudesRevisionPendiente() }
    ]);
  }

  getSolicitudesPieStyle() {
    return this.buildPieStyle(this.getSolicitudesPieSegments());
  }

  getClientesPieSegments() {
    const segments = this.buildGroupSegments(this.clientesData(), ['tipo_usuario', 'tipo', 'categoria'], 'Sin tipo');
    return this.buildPieSegments(segments);
  }

  getClientesPieStyle() {
    return this.buildPieStyle(this.getClientesPieSegments());
  }

  getPapeleriaPieSegments() {
    return this.buildPieSegments(this.buildEstadoSegments(this.papeleriaData()));
  }

  getPapeleriaPieStyle() {
    return this.buildPieStyle(this.getPapeleriaPieSegments());
  }

  getEquiposPieSegments() {
    return this.buildPieSegments(this.buildEstadoSegments(this.equiposData()));
  }

  getEquiposPieStyle() {
    return this.buildPieStyle(this.getEquiposPieSegments());
  }

  getVolumetricosPieSegments() {
    return this.buildPieSegments(this.buildEstadoSegments(this.volumetricosData()));
  }

  getVolumetricosPieStyle() {
    return this.buildPieStyle(this.getVolumetricosPieSegments());
  }

  getReferenciaPieSegments() {
    return this.buildPieSegments(this.buildEstadoSegments(this.referenciaData()));
  }

  getReferenciaPieStyle() {
    return this.buildPieStyle(this.getReferenciaPieSegments());
  }

  getSolicitudesTotal(): number {
    return this.solicitudesData().length;
  }

  getPctRounded(value: number, total?: number): number {
    const base = total ?? this.getSolicitudesTotal();
    if (!base) return 0;
    return Math.round((value / base) * 100);
  }

  private getPct(value: number, total: number): number {
    if (!total) return 0;
    return (value / total) * 100;
  }

  getOfertaPieStyle(): string {
    const total = this.getSolicitudesTotal();
    if (!total) return 'conic-gradient(#e2e8f0 0 360deg)';
    const con = this.contarSolicitudesConOferta();
    const sin = this.contarSolicitudesSinOferta();
    const pCon = this.getPct(con, total);
    const pSin = this.getPct(sin, total);
    const pPend = Math.max(0, 100 - pCon - pSin);
    const s1 = pCon.toFixed(2);
    const s2 = (pCon + pSin).toFixed(2);
    return `conic-gradient(#3b82f6 0 ${s1}%, #94a3b8 ${s1}% ${s2}%, #a855f7 ${s2}% 100%)`;
  }

  contarSolicitudesViable(): number {
    return this.solicitudesData().filter(s => {
      const concepto = this.getConceptoFinal((s as any).concepto_final);
      if (concepto === 'SOLICITUD_VIABLE' || concepto === 'SOLICITUD_VIABLE_CON_OBSERVACIONES') return true;
      if (concepto === 'SOLICITUD_NO_VIABLE') return false;
      return this.isTruthyFlag((s as any).servicio_es_viable);
    }).length;
  }

  contarSolicitudesConOferta(): number {
    return this.solicitudesData().filter(s => {
      return this.isTruthyFlag((s as any).genero_cotizacion);
    }).length;
  }

  contarSolicitudesNoViable(): number {
    return this.solicitudesData().filter(s => {
      const concepto = this.getConceptoFinal((s as any).concepto_final);
      if (concepto === 'SOLICITUD_NO_VIABLE') return true;
      if (concepto === 'SOLICITUD_VIABLE' || concepto === 'SOLICITUD_VIABLE_CON_OBSERVACIONES') return false;
      const val = (s as any).servicio_es_viable;
      return !this.isUnset(val) && !this.isTruthyFlag(val);
    }).length;
  }

  contarSolicitudesRevisionPendiente(): number {
    return this.solicitudesData().filter(s => {
      const concepto = this.getConceptoFinal((s as any).concepto_final);
      if (concepto) return false;
      return this.isUnset((s as any).servicio_es_viable);
    }).length;
  }

  contarSolicitudesOfertaPendiente(): number {
    return this.solicitudesData().filter(s => this.isUnset((s as any).genero_cotizacion)).length;
  }

  contarSolicitudesSinOferta(): number {
    return this.solicitudesData().filter(s => {
      const val = (s as any).genero_cotizacion;
      return !this.isUnset(val) && !this.isTruthyFlag(val);
    }).length;
  }


  contarClientesPorTipo(tipo: string): number {
    return this.clientesData().filter(c => c.tipo_usuario === tipo).length;
  }

  formatearNumero(num: number): string {
    return num.toLocaleString('es-CO');
  }

    // Métodos para alternar expansión
  toggleProximosVencer() {
    this.proximosVencerExpanded = !this.proximosVencerExpanded;
  }

  toggleVencidos() {
    this.vencidosExpanded = !this.vencidosExpanded;
  }
}

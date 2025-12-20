import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { insumosService } from '../services/insumos.service';
import { reactivosService } from '../services/reactivos.service';
import { authService } from '../services/auth.service';
import { equiposService } from '../services/equipos.service';
import { PapeleriaService } from '../services/papeleria.service';
import { VolumetricosService } from '../services/volumetricos.service';
import { ReferenciaService } from '../services/referencia.service';
import { HttpClientModule } from '@angular/common/http';

const API_SOLICITUDES = (window as any).__env?.API_SOLICITUDES || 'http://localhost:42420/api/solicitudes';

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

  // Reactivos próximos a vencer
  reactivosProximosVencer = signal<any[]>([]);
  // Reactivos vencidos
  reactivosVencidos = signal<any[]>([]);

  // Detectar si el usuario es auxiliar
  get esAuxiliar() {
    const user = (window as any).authUser?.() || null;
    return user && user.rol === 'Auxiliar';
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
      await Promise.all([
        this.cargarInsumos(),
        this.cargarReactivos(),
        this.cargarSolicitudes(),
        this.cargarClientes(),
        this.cargarPapeleria(),
        this.cargarEquipos(),
        this.cargarVolumetricos(),
        this.cargarReferencia()
      ]);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  }

  async cargarPapeleria() {
    try {
      const pap = await this.papeleriaService.listar('', 1000);
      const total = Array.isArray(pap) ? pap.length : (pap as any)?.total ?? ((pap as any)?.rows?.length ?? 0);
      this.metricas.update(m => ({ ...m, totalPapeleria: total }));
    } catch (error) {
      console.error('Error cargando papelería:', error);
      this.metricas.update(m => ({ ...m, totalPapeleria: 0 }));
    }
  }

  async cargarEquipos() {
    try {
      const equipos = await equiposService.listarEquipos();
      const total = Array.isArray(equipos) ? equipos.length : (equipos as any)?.total ?? ((equipos as any)?.rows?.length ?? 0);
      this.metricas.update(m => ({ ...m, totalEquipos: total }));
    } catch (error) {
      console.error('Error cargando equipos:', error);
      this.metricas.update(m => ({ ...m, totalEquipos: 0 }));
    }
  }

  async cargarVolumetricos() {
    try {
      const mats = await this.volumetricosService.listarMateriales();
      const total = Array.isArray(mats) ? mats.length : (mats as any)?.total ?? ((mats as any)?.rows?.length ?? 0);
      this.metricas.update(m => ({ ...m, totalVolumetricos: total }));
    } catch (error) {
      console.error('Error cargando materiales volumétricos:', error);
      this.metricas.update(m => ({ ...m, totalVolumetricos: 0 }));
    }
  }

  async cargarReferencia() {
    try {
      const mats = await this.referenciaService.listarMateriales();
      const total = Array.isArray(mats) ? mats.length : (mats as any)?.total ?? ((mats as any)?.rows?.length ?? 0);
      this.metricas.update(m => ({ ...m, totalReferencia: total }));
    } catch (error) {
      console.error('Error cargando materiales de referencia:', error);
      this.metricas.update(m => ({ ...m, totalReferencia: 0 }));
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

  async cargarSolicitudes() {
    try {
      const token = authService.getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(API_SOLICITUDES, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const solicitudes = await res.json();
      this.solicitudesData.set(solicitudes);
      this.metricas.update(m => ({ ...m, totalSolicitudes: solicitudes.length }));
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
      
      const res = await fetch(API_SOLICITUDES + '/clientes', { headers });
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
  contarSolicitudesViable(): number {
    return this.solicitudesData().filter(s => {
      const val = s.servicio_es_viable;
      return val === true || val === 1 || val === '1' || val === 'true';
    }).length;
  }

  contarSolicitudesConOferta(): number {
    return this.solicitudesData().filter(s => {
      const val = s.genero_cotizacion;
      return val === true || val === 1 || val === '1' || val === 'true';
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

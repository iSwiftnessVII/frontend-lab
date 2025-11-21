// src/app/reportes/reportes.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { reportesService, ReporteInventario, ReporteMovimiento, ReporteVencimiento } from '../services/reportes.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  // Señales para el estado
  tipoReporte = signal<string>('inventario');
  cargando = signal<boolean>(false);
  
  // Filtros
  fechaDesde = signal<string>('');
  fechaHasta = signal<string>('');
  diasVencimiento = signal<number>(30);
  
  // Datos de reportes
  datosInventario = signal<ReporteInventario[]>([]);
  datosMovimientos = signal<ReporteMovimiento[]>([]);
  datosVencimientos = signal<ReporteVencimiento[]>([]);

  constructor() {}

  // ✅ CARGAR AUTOMÁTICAMENTE AL INICIAR
  ngOnInit() {
    this.cargarReporteInicial();
  }

  // ✅ CARGAR REPORTE DE INVENTARIO GENERAL POR DEFECTO
  private async cargarReporteInicial() {
    this.cargando.set(true);
    try {
      const inventario = await reportesService.getInventario();
      this.datosInventario.set(inventario || []);
    } catch (error) {
      console.error('Error cargando reporte inicial:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  // Generar reporte según el tipo seleccionado
  async generarReporte() {
    this.cargando.set(true);
    
    try {
      switch (this.tipoReporte()) {
        case 'inventario':
          const inventario = await reportesService.getInventario();
          this.datosInventario.set(inventario || []);
          break;
          
        case 'entradas':
          const entradas = await reportesService.getEntradas(
            this.fechaDesde(), 
            this.fechaHasta()
          );
          this.datosMovimientos.set(entradas || []);
          break;
          
        case 'salidas':
          const salidas = await reportesService.getSalidas(
            this.fechaDesde(), 
            this.fechaHasta()
          );
          this.datosMovimientos.set(salidas || []);
          break;
          
        case 'vencimientos':
          const vencimientos = await reportesService.getVencimientos(
            this.diasVencimiento()
          );
          this.datosVencimientos.set(vencimientos || []);
          break;
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.diasVencimiento.set(30);
  }

  // Exportar a PDF
  exportarPDF() {
    const datos = this.obtenerDatosActuales();
    this.generarPDF(datos);
  }

  private obtenerDatosActuales(): any[] {
    switch (this.tipoReporte()) {
      case 'inventario': return this.datosInventario();
      case 'entradas': return this.datosMovimientos();
      case 'salidas': return this.datosMovimientos();
      case 'vencimientos': return this.datosVencimientos();
      default: return [];
    }
  }

  private generarPDF(datos: any[]) {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const contenido = this.crearContenidoPDF(datos);
    const ventana = window.open('', '_blank');
    
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.print();
    }
  }

  private crearContenidoPDF(datos: any[]): string {
    const titulo = this.obtenerTituloReporte();
    const fecha = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #001f5b; border-bottom: 2px solid #00b8b5; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #001f5b; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .fecha { color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          <div class="fecha">Generado: ${fecha}</div>
        </div>
        ${this.crearTablaPDF(datos)}
      </body>
      </html>
    `;
  }

  private obtenerTituloReporte(): string {
    switch (this.tipoReporte()) {
      case 'inventario': return 'Reporte de Inventario General';
      case 'entradas': return 'Reporte de Entradas';
      case 'salidas': return 'Reporte de Salidas';
      case 'vencimientos': return 'Reporte de Vencimientos';
      default: return 'Reporte';
    }
  }

  private crearTablaPDF(datos: any[]): string {
    if (datos.length === 0) return '<p>No hay datos disponibles</p>';
    
    const headers = this.obtenerHeadersPDF();
    const rows = datos.map(item => this.crearFilaPDF(item)).join('');
    
    return `
      <table>
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin-top: 20px; color: #666;">Total de registros: ${datos.length}</p>
    `;
  }

  private obtenerHeadersPDF(): string {
    switch (this.tipoReporte()) {
      case 'inventario':
        return `
          <th>Tipo</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Presentación</th>
          <th>Marca</th>
          <th>Referencia</th>
          <th>Ubicación</th>
        `;
      case 'entradas':
      case 'salidas':
        return `
          <th>Fecha</th>
          <th>Tipo Producto</th>
          <th>Referencia</th>
          <th>Usuario ID</th>
          <th>Movimiento</th>
        `;
      case 'vencimientos':
        return `
          <th>Nombre</th>
          <th>Lote</th>
          <th>Cantidad</th>
          <th>Fecha Vencimiento</th>
          <th>Días Restantes</th>
          <th>Marca</th>
        `;
      default:
        return '<th>Datos</th>';
    }
  }

  private crearFilaPDF(item: any): string {
    switch (this.tipoReporte()) {
      case 'inventario':
        return `
          <tr>
            <td>${item.tipo_producto}</td>
            <td>${item.nombre || ''}</td>
            <td>${item.cantidad || 0}</td>
            <td>${item.presentacion || ''}</td>
            <td>${item.marca || ''}</td>
            <td>${item.referencia || ''}</td>
            <td>${item.ubicacion || ''}</td>
          </tr>
        `;
      case 'entradas':
      case 'salidas':
        return `
          <tr>
            <td>${item.fecha ? new Date(item.fecha).toLocaleDateString() : ''}</td>
            <td>${item.producto_tipo || ''}</td>
            <td>${item.producto_referencia || ''}</td>
            <td>${item.usuario_id || ''}</td>
            <td>${item.tipo_movimiento || ''}</td>
          </tr>
        `;
      case 'vencimientos':
        return `
          <tr>
            <td>${item.nombre || ''}</td>
            <td>${item.id_producto || ''}</td>
            <td>${item.cantidad_total || 0}</td>
            <td>${item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString() : ''}</td>
            <td>${item.dias_restantes || 0}</td>
            <td>${item.marca || ''}</td>
          </tr>
        `;
      default:
        return '<tr><td>Sin datos</td></tr>';
    }
  }
}
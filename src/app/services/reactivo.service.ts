import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Reactivo {
  codigo: string;
  reactivo: string;
  presentacion?: string;
  cantidad_envase?: string;
  fecha_adquisicion?: string;
  fecha_vencimiento?: string;
  tipo_id?: number;
  clasificacion_id?: number;
  unidad_id?: number;
  estado_id?: number;
  marca?: string;
  lote?: string;
  id_referencia?: string;
  almacenamiento_id?: number;
  tipo_recipiente_id?: number;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class ReactivoService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getReactivos(): Observable<Reactivo[]> {
    return this.http.get<Reactivo[]>(`${this.apiUrl}/reactivos`);
  }

  addReactivo(data: Reactivo): Observable<any> {
    return this.http.post(`${this.apiUrl}/reactivos`, data);
  }

  getTipos(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`${this.apiUrl}/tipos`);
  }

  getClasificaciones(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`${this.apiUrl}/clasificaciones`);
  }

  getUnidades(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`${this.apiUrl}/unidades`);
  }

  getEstados(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`${this.apiUrl}/estados`);
  }

  getTiposRecipiente(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`${this.apiUrl}/tipos_recipiente`);
  }

  getAlmacenamientos(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`${this.apiUrl}/almacenamiento`);
  }

  // Nuevo método para obtener PDFs por reactivo
  getPdfsByReactivo(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reactivos/${codigo}/pdf`);
  }
}
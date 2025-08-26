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
  hoja_seguridad?: string;
  almacenamiento_id?: number;
  tipo_recipiente_id?: number;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class ReactivoService {
  private apiUrl = 'http://localhost:3000/api/reactivos'; // Endpoint principal

  constructor(private http: HttpClient) {}

  getReactivos(): Observable<Reactivo[]> {
    return this.http.get<Reactivo[]>(this.apiUrl);
  }

  addReactivo(data: Reactivo): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getTipos(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`http://localhost:3000/api/tipos`);
  }

  getClasificaciones(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`http://localhost:3000/api/clasificaciones`);
  }

  getUnidades(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`http://localhost:3000/api/unidades`);
  }

  getEstados(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`http://localhost:3000/api/estados`);
  }

  getTiposRecipiente(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`http://localhost:3000/api/tipos_recipiente`);
  }

  // Cambié descripcion a nombre para que coincida con tu backend
  getAlmacenamientos(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id:number, nombre:string}[]>(`http://localhost:3000/api/almacenamiento`);
  }
}

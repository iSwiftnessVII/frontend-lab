import { Injectable } from '@angular/core';
import { authService } from './auth.service';

const API_BASE = (window as any).__env?.API_MATERIALES_VOL || 'http://localhost:4000/api/materiales-volumetricos';

function authHeaders(): HeadersInit {
  const token = authService.getToken?.();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

@Injectable({ providedIn: 'root' })
export class MaterialesVolService {
  async crear(body: any){
    const res = await fetch(API_BASE, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...authHeaders() }, 
      body: JSON.stringify(body) 
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if(!res.ok) throw new Error((data && data.message) || 'Error creando material');
    return data;
  }

  async listar(){
    const res = await fetch(API_BASE, { method: 'GET' });
    let data: any = null; try { data = await res.json(); } catch {}
    if(!res.ok) throw new Error((data && data.message) || 'Error listando materiales');
    return data;
  }

  async eliminar(id: number){
    const res = await fetch(`${API_BASE}/${id}`, { 
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if(!res.ok) throw new Error((data && data.message) || 'Error eliminando material');
    return data;
  }
}
import { Injectable } from '@angular/core';

const API_BASE = (window as any).__env?.API_MATERIALES_VOL || 'http://localhost:4000/api/materiales-volumetricos';

@Injectable({ providedIn: 'root' })
export class MaterialesVolService {
  async crear(body: any){
    const res = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data: any = null; try { data = await res.json(); } catch {}
    if(!res.ok) {
      const status = res.status;
      const baseMsg = (data && data.message) || 'Error creando material';
      throw new Error(`${baseMsg} (HTTP ${status})`);
    }
    return data;
  }
}

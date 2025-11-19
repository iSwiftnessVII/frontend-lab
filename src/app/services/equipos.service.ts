const API_BASE = (window as any).__env?.API_EQUIPOS || 'http://localhost:4000/api/equipos';

export const equiposService = {
      async crearIntervalo(equipoId: number, item: any) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/intervalos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(item)
        });
        let data: any = null; try { data = await res.json(); } catch {}
        if (!res.ok) throw new Error((data && data.message) || 'Error creando intervalo');
        return data;
      },
    async listarIntervalos(equipoId: number) {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/intervalos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      let data: any = null; try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error((data && data.message) || 'Error listando intervalos');
      return data;
    },
  async crearEquipo(item: any) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando equipo');
    return data;
  },
  async obtenerEquipo(id: number) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(id))}`);
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error obteniendo equipo');
    return data;
  },
  async listarEquipos(q: string = '') {
    const url = new URL(API_BASE);
    if (q) url.searchParams.set('q', q);
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async listarMantenimientos(equipoId: number) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/mantenimientos`);
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error listando mantenimientos');
    return data;
  },
  async crearMantenimiento(equipoId: number, item: any) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/mantenimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando mantenimiento');
    return data;
  },
  async crearVerificacion(equipoId: number, item: any) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/verificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando verificación/calibración/calificación');
    return data;
  },
  async listarVerificaciones(equipoId: number) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/verificaciones`);
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error listando verificaciones/calibraciones/calificaciones');
    return data;
  },
  async listarHistorial(equipoId: number) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/historial`);
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error listando historial de instrumento');
    return data;
  },
  async crearHistorial(equipoId: number, item: any) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(equipoId))}/historial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error creando historial de instrumento');
    return data;
  },
  async eliminarEquipo(id: number) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    let data: any = null; try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.message) || 'Error eliminando equipo');
    return data;
  },
};

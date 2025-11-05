const API_BASE = (window as any).__env?.API_EQUIPOS || 'http://localhost:4000/api/equipos';

export const equiposService = {
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
  async listarEquipos(q: string = '') {
    const url = new URL(API_BASE);
    if (q) url.searchParams.set('q', q);
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

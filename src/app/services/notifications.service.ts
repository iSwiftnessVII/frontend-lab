import { authService } from './auth.service';

function getNotificacionesApiBase(): string {
  const apiBase = (window as any).__env?.API_NOTIFICACIONES;
  if (typeof apiBase === 'string' && apiBase.trim()) return apiBase.trim();
  const root = (window as any).__env?.API_BASE;
  if (typeof root === 'string' && root.trim()) return `${root.trim().replace(/\/+$/g, '')}/notificaciones`;
  return 'http://localhost:42420/api/notificaciones';
}

export const notificationsService = {
  async getReadUpdateIds(): Promise<number[]> {
    const token = authService.getToken();
    if (!token) return [];

    const res = await fetch(`${getNotificacionesApiBase()}/reads`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'No se pudieron cargar las notificaciones');
    }

    if (!Array.isArray(data?.readIds)) return [];
    return data.readIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id));
  },

  async markUpdatesRead(ids: number[]): Promise<void> {
    const token = authService.getToken();
    if (!token) throw new Error('Token requerido');

    const cleanIds = (ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!cleanIds.length) return;

    const res = await fetch(`${getNotificacionesApiBase()}/reads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ids: cleanIds })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'No se pudo guardar el estado');
    }
  }
};

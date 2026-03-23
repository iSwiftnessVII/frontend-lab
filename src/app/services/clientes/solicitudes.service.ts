import { Injectable, signal } from '@angular/core';
import { authService } from '../auth.service';

type EntityRef = { nombre?: string; nombre_completo?: string } | null;
type ProductoRef = { nombre?: string } | null;
type RevisionRef = { concepto_final?: unknown; conceptoFinal?: unknown } | null;

interface ApiRecord {
  id?: unknown;
  solicitud_id?: unknown;
  id_solicitud?: unknown;
  solicitudId?: unknown;
  id_cliente?: unknown;
  id_estado?: unknown;
  id_admin?: unknown;
  id_tipo_af?: unknown;
  tipo_solicitud?: unknown;
  tipo?: unknown;
  fecha_solicitud?: unknown;
  created_at?: unknown;
  fecha?: unknown;
  nombre_solicitante?: unknown;
  cliente_nombre?: unknown;
  nombre_cliente?: unknown;
  cliente?: EntityRef;
  nombre_muestra?: unknown;
  muestra_nombre?: unknown;
  producto_nombre?: unknown;
  producto?: ProductoRef;
  nombre_estado?: unknown;
  estado_solicitud?: unknown;
  admin_email?: unknown;
  lote_producto?: unknown;
  fecha_vencimiento_muestra?: unknown;
  tipo_muestra?: unknown;
  tipo_empaque?: unknown;
  analisis_requerido?: unknown;
  req_analisis?: unknown;
  cant_muestras?: unknown;
  solicitud_recibida?: unknown;
  fecha_entrega_muestra?: unknown;
  recibe_personal?: unknown;
  cargo_personal?: unknown;
  observaciones?: unknown;
  genero_cotizacion?: unknown;
  valor_cotizacion?: unknown;
  fecha_envio_oferta?: unknown;
  realizo_seguimiento_oferta?: unknown;
  observacion_oferta?: unknown;
  fecha_limite_entrega?: unknown;
  tipo_muestra_especificado?: unknown;
  ensayos_requeridos_claros?: unknown;
  equipos_calibrados?: unknown;
  personal_competente?: unknown;
  infraestructura_adecuada?: unknown;
  insumos_vigentes?: unknown;
  cumple_tiempos_entrega?: unknown;
  normas_metodos_especificados?: unknown;
  metodo_validado_verificado?: unknown;
  metodo_adecuado?: unknown;
  observaciones_tecnicas?: unknown;
  concepto_final?: unknown;
  conceptoFinal?: unknown;
  revision?: RevisionRef;
  revision_oferta?: RevisionRef;
  revisionOferta?: RevisionRef;
  servicio_es_viable?: unknown;
  fecha_encuesta?: unknown;
  fecha_realizacion_encuesta?: unknown;
  comentarios?: unknown;
  recomendaria_servicio?: unknown;
  cliente_respondio?: unknown;
  solicito_nueva_encuesta?: unknown;
  numero_solicitud_front?: unknown;
  message?: unknown;
  error?: unknown;
  rows?: unknown;
  todos?: unknown;
  entidad?: unknown;
}
type ErrorWithStatus = Error & { status?: number };

const env = (window as unknown as { __env?: Record<string, string | undefined> }).__env;

const API = env?.['API_SOLICITUDES'] || 'http://localhost:4000/api/solicitudes';
const API_DETALLE_LISTA = env?.['API_SOLICITUDES_DETALLE_LISTA'] || 
                         'http://localhost:4000/api/solicitudes/detalle/lista';
const API_DETALLE = env?.['API_SOLICITUDES_DETALLE'] || (API + '/detalle');
const API_ESTADOS = env?.['API_SOLICITUDES_ESTADOS'] || (API + '/estados');
const API_DOC_PLANTILLAS_BASE = String(
  env?.['API_SOLICITUDES_DOC_PLANTILLAS'] ?? (API + '/documentos/plantillas')
).replace(/\/+$/g, '');
let tplDocEndpointMissing = false;

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private _solicitudes = signal<ApiRecord[]>([]);
  solicitudes = this._solicitudes.asReadonly();

  private asObject(value: unknown): ApiRecord | null {
    return value && typeof value === 'object' ? (value as ApiRecord) : null;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private getAuthHeadersMultipart(): Record<string, string> {
    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async readApiError(res: Response, fallback: string): Promise<string> {
    try {
      const data = this.asObject(await res.json());
      return String(data?.message ?? data?.error ?? fallback);
    } catch {
      void 0;
    }
    try {
      const text = await res.text();
      return text || fallback;
    } catch {
      void 0;
    }
    return fallback;
  }

  async loadSolicitudes(): Promise<void> {
    try {
      const res = await fetch(API_DETALLE_LISTA, {
        headers: this.getAuthHeaders()
      });
      
      if (res.status === 401) {
        throw new Error('No autorizado - Token inválido o expirado');
      }
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }
      
      const data = await res.json();
      const raw = Array.isArray(data) ? data : [];
      
      // Normalizar los datos
      const normalized = raw.map((r: unknown) => this.normalizeSolicitud(r));
      this._solicitudes.set(normalized);
      
    } catch (err) {
      console.error('Error cargando solicitudes detalladas:', err);
      
      // Fallback al endpoint básico
      try {
        const res2 = await fetch(API, { headers: this.getAuthHeaders() });
        if (res2.ok) {
          const data2 = await res2.json();
          const raw2 = Array.isArray(data2) ? data2 : [];
          const normalized2 = raw2.map((r: unknown) => this.normalizeSolicitud(r));
          this._solicitudes.set(normalized2);
          return;
        }
      } catch (e2) {
        console.error('Error en fallback loadSolicitudes:', e2);
      }
      
      this._solicitudes.set([]);
      throw err;
    }
  }

  async getSolicitudDetalleById(id: number): Promise<ApiRecord> {
    const res = await fetch(`${API_DETALLE}/${id}`, {
      headers: this.getAuthHeaders()
    });
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const normalized = this.normalizeSolicitud(data);
    try {
      const current = this._solicitudes();
      const next = current.map((s) => {
        const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
        return sid === Number(id) ? normalized : s;
      });
      const has = next.some((s) => Number(s?.solicitud_id ?? s?.id_solicitud ?? 0) === Number(id));
      this._solicitudes.set(has ? next : [normalized, ...next]);
    } catch {
      void 0;
    }
    return normalized;
  }

  // Normalización corregida
  private normalizeSolicitud(input: unknown): ApiRecord {
    const s = this.asObject(input);
    if (!s) return {};
    
    const idRaw = s?.solicitud_id ?? s?.id_solicitud ?? s?.solicitudId ?? s?.id ?? null;
    const id = (idRaw === null || idRaw === undefined) ? null : Number(idRaw);

    const tipo = (s?.tipo_solicitud ?? s?.tipo ?? '').toString();
    const fecha = s?.fecha_solicitud ?? s?.created_at ?? s?.fecha ?? null;

    const nombreSolicitante = s?.nombre_solicitante ?? s?.cliente_nombre ?? s?.nombre_cliente ?? (s?.cliente && (s.cliente.nombre || s.cliente.nombre_completo)) ?? '';
    const nombreMuestra = s?.nombre_muestra ?? s?.muestra_nombre ?? s?.producto_nombre ?? s?.producto?.nombre ?? '';

    // IMPORTANTE: Los campos vienen directamente del JOIN en solicitudesController.js
    // Usamos los nombres exactos que devuelve la consulta SQL
    
    const parseNumericString = (value: string): number | null => {
      const rawInput = String(value || '').replace(/[^0-9,.-]/g, '').trim();
      if (!rawInput) return null;
      const negative = rawInput.startsWith('-');
      const raw = rawInput.replace(/-/g, '');
      const hasComma = raw.includes(',');
      const hasDot = raw.includes('.');
      const lastDot = raw.lastIndexOf('.');
      const lastComma = raw.lastIndexOf(',');
      let intPart = '';
      let decPart = '';

      if (hasComma && (!hasDot || lastComma > lastDot)) {
        const normalized = raw.replace(/\./g, '').replace(/,/g, '.');
        const parts = normalized.split('.');
        intPart = parts[0] || '';
        decPart = parts[1] || '';
      } else if (hasDot) {
        const digitsAfterDot = raw.length - lastDot - 1;
        if (digitsAfterDot > 2) {
          intPart = raw.replace(/\./g, '');
        } else {
          intPart = raw.slice(0, lastDot).replace(/\./g, '');
          decPart = raw.slice(lastDot + 1).replace(/\./g, '');
        }
      } else {
        intPart = raw;
      }

      const normalizedValue = decPart ? `${intPart}.${decPart}` : intPart;
      if (!normalizedValue) return null;
      const parsed = Number(normalizedValue);
      if (isNaN(parsed)) return null;
      return negative ? -parsed : parsed;
    };

    // Procesar valor_cotizacion
    let valor_cotizacion = s?.valor_cotizacion ?? null;
    if (typeof valor_cotizacion === 'string') {
      const parsed = parseNumericString(valor_cotizacion);
      valor_cotizacion = parsed === null ? null : parsed;
    }

    const toBoolOrNull = (val: unknown): boolean | null => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') {
        if (val === 1) return true;
        if (val === 0) return false;
        return null;
      }
      const s = String(val).trim().toLowerCase();
      if (!s) return null;
      if (s === '1' || s === 'true' || s === 't' || s === 'si' || s === 'sí' || s === 'yes' || s === 'y') return true;
      if (s === '0' || s === 'false' || s === 'f' || s === 'no' || s === 'n') return false;
      return null;
    };

    const rawEstado = s?.id_estado ?? null;
    let id_estado = rawEstado === null || rawEstado === undefined || rawEstado === ''
      ? null
      : Number(rawEstado);
    if (!Number.isFinite(id_estado)) id_estado = null;

    const rawAdmin = s?.id_admin ?? null;
    let id_admin = rawAdmin === null || rawAdmin === undefined || rawAdmin === ''
      ? null
      : Number(rawAdmin);
    if (!Number.isFinite(id_admin)) id_admin = null;

    const conceptoFinal =
      s?.concepto_final ??
      s?.conceptoFinal ??
      s?.revision?.concepto_final ??
      s?.revision?.conceptoFinal ??
      s?.revision_oferta?.concepto_final ??
      s?.revision_oferta?.conceptoFinal ??
      s?.revisionOferta?.concepto_final ??
      s?.revisionOferta?.conceptoFinal ??
      null;

    return {
      ...s,
      solicitud_id: id,
      id_solicitud: id,
      tipo_solicitud: tipo,
      fecha_solicitud: fecha,
      nombre_solicitante: nombreSolicitante,
      nombre_muestra: nombreMuestra,
      id_estado,
      nombre_estado: s?.nombre_estado ?? s?.estado_solicitud ?? null,
      id_admin,
      admin_email: s?.admin_email ?? null,

      // Campos básicos de la solicitud
      lote_producto: s?.lote_producto ?? null,
      fecha_vencimiento_muestra: s?.fecha_vencimiento_muestra ?? null,
      tipo_muestra: s?.tipo_muestra ?? null,
      tipo_empaque: s?.tipo_empaque ?? null,
      analisis_requerido: s?.analisis_requerido ?? null,
      req_analisis: toBoolOrNull(s?.req_analisis),
      cant_muestras: s?.cant_muestras ?? null,
      solicitud_recibida: s?.solicitud_recibida ?? null,
      fecha_entrega_muestra: s?.fecha_entrega_muestra ?? null,
      recibe_personal: s?.recibe_personal ?? null,
      cargo_personal: s?.cargo_personal ?? null,
      observaciones: s?.observaciones ?? null,

      // Oferta - nombres exactos del JOIN
      genero_cotizacion: toBoolOrNull(s?.genero_cotizacion),
      valor_cotizacion: valor_cotizacion,
      fecha_envio_oferta: s?.fecha_envio_oferta ?? null,
      realizo_seguimiento_oferta: toBoolOrNull(s?.realizo_seguimiento_oferta),
      observacion_oferta: s?.observacion_oferta ?? null,

      // Revisión - nombres exactos del JOIN
      fecha_limite_entrega: s?.fecha_limite_entrega ?? null,
      tipo_muestra_especificado: s?.tipo_muestra_especificado ?? null,
      ensayos_requeridos_claros: toBoolOrNull(s?.ensayos_requeridos_claros),
      equipos_calibrados: toBoolOrNull(s?.equipos_calibrados),
      personal_competente: toBoolOrNull(s?.personal_competente),
      infraestructura_adecuada: toBoolOrNull(s?.infraestructura_adecuada),
      insumos_vigentes: toBoolOrNull(s?.insumos_vigentes),
      cumple_tiempos_entrega: toBoolOrNull(s?.cumple_tiempos_entrega),
      normas_metodos_especificados: toBoolOrNull(s?.normas_metodos_especificados),
      metodo_validado_verificado: toBoolOrNull(s?.metodo_validado_verificado),
      metodo_adecuado: toBoolOrNull(s?.metodo_adecuado),
      observaciones_tecnicas: s?.observaciones_tecnicas ?? null,
      concepto_final: conceptoFinal,
      servicio_es_viable: s?.servicio_es_viable === null || s?.servicio_es_viable === undefined
        ? (conceptoFinal === 'SOLICITUD_VIABLE' || conceptoFinal === 'SOLICITUD_VIABLE_CON_OBSERVACIONES')
        : (Number(s.servicio_es_viable) === 1 || s.servicio_es_viable === true),

      // Encuesta - nombres exactos del JOIN
      fecha_encuesta: s?.fecha_encuesta ?? null,
      fecha_realizacion_encuesta: s?.fecha_realizacion_encuesta ?? null,
      comentarios: s?.comentarios ?? null,
      recomendaria_servicio: toBoolOrNull(s?.recomendaria_servicio),
      cliente_respondio: toBoolOrNull(s?.cliente_respondio),
      solicito_nueva_encuesta: toBoolOrNull(s?.solicito_nueva_encuesta)
    };
  }

  async createSolicitud(body: ApiRecord): Promise<ApiRecord> {
    const res = await fetch(API, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body)
    });
    
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
      const payload = this.asObject(await res.json().catch(() => ({}))) || {};
      const newId = payload?.solicitud_id ?? payload?.id ?? body?.solicitud_id ?? null;
      // Optimistic item using canonical fields; oferta/revisión/encuesta null
      const optimisticRaw = {
        ...body,
        solicitud_id: newId,
        id_solicitud: newId,
        genero_cotizacion: null,
        valor_cotizacion: null,
        fecha_envio_oferta: null,
        realizo_seguimiento_oferta: null,
        observacion_oferta: null,
        fecha_limite_entrega: null,
        servicio_es_viable: null,
        fecha_encuesta: null,
        comentarios: null,
        recomendaria_servicio: null,
        cliente_respondio: null,
        solicito_nueva_encuesta: null
      };
      const optimistic = this.normalizeSolicitud(optimisticRaw);
      try {
        const current = this._solicitudes();
        // Prepend so it appears at top (sorted DESC by id)
        this._solicitudes.set([optimistic, ...current]);
      } catch {
        void 0;
      }
      // Refresh in background to reconcile with DB (joined data)
      this.loadSolicitudes().catch(err => console.warn('Refresh after create failed', err));
      return optimistic;
  }

  async listarEstadosSolicitud(): Promise<unknown[]> {
    const res = await fetch(API_ESTADOS, { headers: this.getAuthHeaders() });
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(await this.readApiError(res, 'Error cargando estados'));
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async actualizarEstadoSolicitud(id: number, id_estado: number): Promise<void> {
    const res = await fetch(`${API}/${id}/estado`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ id_estado })
    });
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(await this.readApiError(res, 'Error actualizando estado'));
    }
  }

  async asignarSolicitud(id: number, id_admin: number | null): Promise<void> {
    const res = await fetch(`${API}/${id}/asignacion`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ id_admin })
    });
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(await this.readApiError(res, 'Error actualizando asignación'));
    }
  }

  async upsertOferta(id_solicitud: number, body: ApiRecord): Promise<void> {
    const url = API + '/oferta/' + id_solicitud;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });

    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    // Optimistic merge for oferta fields
    try {
      const current = this._solicitudes();
      const next = current.map((s) => {
        const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
        if (sid !== Number(id_solicitud)) return s;
        let valor_cotizacion = body?.valor_cotizacion ?? s?.valor_cotizacion ?? null;
        if (typeof valor_cotizacion === 'string') {
          const cleaned = valor_cotizacion.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleaned);
          valor_cotizacion = isNaN(parsed) ? null : parsed;
        }
        const merged = {
          ...s,
          genero_cotizacion: body?.genero_cotizacion ?? s?.genero_cotizacion ?? null,
          valor_cotizacion,
          fecha_envio_oferta: body?.fecha_envio_oferta ?? s?.fecha_envio_oferta ?? null,
          realizo_seguimiento_oferta: body?.realizo_seguimiento_oferta ?? s?.realizo_seguimiento_oferta ?? null,
          observacion_oferta: body?.observacion_oferta ?? s?.observacion_oferta ?? null
        };
        return this.normalizeSolicitud(merged);
      });
      this._solicitudes.set(next);
    } catch {
      void 0;
    }
  }

  async upsertRevision(id_solicitud: number, body: ApiRecord): Promise<void> {
    const url = API + '/revision/' + id_solicitud;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });

    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    // Optimistic merge into the existing item so UI updates instantly
    try {
      const current = this._solicitudes();
      const next = current.map((s) => {
        const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
        if (sid !== Number(id_solicitud)) return s;
        const merged = {
          ...s,
          fecha_limite_entrega: body?.fecha_limite_entrega ?? s?.fecha_limite_entrega ?? null,
          tipo_muestra_especificado: body?.tipo_muestra_especificado ?? s?.tipo_muestra_especificado ?? null,
          ensayos_requeridos_claros: body?.ensayos_requeridos_claros ?? s?.ensayos_requeridos_claros ?? null,
          equipos_calibrados: body?.equipos_calibrados ?? s?.equipos_calibrados ?? null,
          personal_competente: body?.personal_competente ?? s?.personal_competente ?? null,
          infraestructura_adecuada: body?.infraestructura_adecuada ?? s?.infraestructura_adecuada ?? null,
          insumos_vigentes: body?.insumos_vigentes ?? s?.insumos_vigentes ?? null,
          cumple_tiempos_entrega: body?.cumple_tiempos_entrega ?? s?.cumple_tiempos_entrega ?? null,
          normas_metodos_especificados: body?.normas_metodos_especificados ?? s?.normas_metodos_especificados ?? null,
          metodo_validado_verificado: body?.metodo_validado_verificado ?? s?.metodo_validado_verificado ?? null,
          metodo_adecuado: body?.metodo_adecuado ?? s?.metodo_adecuado ?? null,
          observaciones_tecnicas: body?.observaciones_tecnicas ?? s?.observaciones_tecnicas ?? null,
          concepto_final: body?.concepto_final ?? s?.concepto_final ?? null,
          servicio_es_viable: body?.servicio_es_viable ?? s?.servicio_es_viable ?? null
        };
        return this.normalizeSolicitud(merged);
      });
      this._solicitudes.set(next);
    } catch {
      void 0;
    }
  }

  async upsertSeguimientoEncuesta(id_solicitud: number, body: ApiRecord): Promise<void> {
    const url = API + '/seguimiento-encuesta/' + id_solicitud;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });

    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    // Optimistic merge for encuesta fields
    try {
      const current = this._solicitudes();
      const next = current.map((s) => {
        const sid = Number(s?.solicitud_id ?? s?.id_solicitud ?? 0);
        if (sid !== Number(id_solicitud)) return s;
        const merged = {
          ...s,
          fecha_encuesta: body?.fecha_encuesta ?? s?.fecha_encuesta ?? null,
          comentarios: body?.comentarios ?? s?.comentarios ?? null,
          recomendaria_servicio: body?.recomendaria_servicio ?? s?.recomendaria_servicio ?? null,
          cliente_respondio: body?.cliente_respondio ?? s?.cliente_respondio ?? null,
          solicito_nueva_encuesta: body?.solicito_nueva_encuesta ?? s?.solicito_nueva_encuesta ?? null
        };
        return this.normalizeSolicitud(merged);
      });
      this._solicitudes.set(next);
    } catch {
      void 0;
    }
  }

  async updateSolicitud(id: number | string, body: ApiRecord): Promise<void> {
    const res = await fetch(API + '/' + id, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });
    
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    await this.loadSolicitudes();
  }

  async deleteSolicitud(id: number): Promise<void> {
    const res = await fetch(API + '/' + id, { 
      method: 'DELETE', 
      headers: this.getAuthHeaders()
    });
    
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    await this.loadSolicitudes();
  }

  async createEncuesta(body: ApiRecord): Promise<void> {
    const res = await fetch(API + '/encuestas', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });
    
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    await this.loadSolicitudes();
  }

  async suscribirseSolicitudes(email: string): Promise<ApiRecord | null> {
    const res = await fetch(API + '/suscripciones-solicitudes', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    let data: ApiRecord | null = null; try { data = this.asObject(await res.json()); } catch { void 0; }
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(String(data?.error ?? 'Error al suscribirse a solicitudes'));
    }
    return data;
  }

  async estadoSuscripcionSolicitudes(email: string): Promise<{ suscrito: boolean }> {
    const res = await fetch(API + '/suscripciones-solicitudes/' + encodeURIComponent(email), {
      headers: this.getAuthHeaders()
    });
    let data: ApiRecord | null = null; try { data = this.asObject(await res.json()); } catch { void 0; }
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(String(data?.error ?? 'Error consultando suscripción de solicitudes'));
    }
    return data as { suscrito: boolean };
  }

  async cancelarSuscripcionSolicitudes(email: string): Promise<ApiRecord | null> {
    const res = await fetch(API + '/suscripciones-solicitudes/' + encodeURIComponent(email), {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    let data: ApiRecord | null = null; try { data = this.asObject(await res.json()); } catch { void 0; }
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(String(data?.error ?? 'Error al cancelar suscripción de solicitudes'));
    }
    return data;
  }

  async suscribirseRevision(email: string): Promise<ApiRecord | null> {
    const res = await fetch(API + '/suscripciones-revision', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    let data: ApiRecord | null = null; try { data = this.asObject(await res.json()); } catch { void 0; }
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(String(data?.error ?? 'Error al suscribirse a revisión'));
    }
    return data;
  }

  async estadoSuscripcionRevision(email: string): Promise<{ suscrito: boolean }> {
    const res = await fetch(API + '/suscripciones-revision/' + encodeURIComponent(email), {
      headers: this.getAuthHeaders()
    });
    let data: ApiRecord | null = null; try { data = this.asObject(await res.json()); } catch { void 0; }
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(String(data?.error ?? 'Error consultando suscripción de revisión'));
    }
    return data as { suscrito: boolean };
  }

  async cancelarSuscripcionRevision(email: string): Promise<ApiRecord | null> {
    const res = await fetch(API + '/suscripciones-revision/' + encodeURIComponent(email), {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    let data: ApiRecord | null = null; try { data = this.asObject(await res.json()); } catch { void 0; }
    if (res.status === 401) {
      throw new Error('No autorizado - Token inválido o expirado');
    }
    if (!res.ok) {
      throw new Error(String(data?.error ?? 'Error al cancelar suscripción de revisión'));
    }
    return data;
  }

  async listarPlantillasDocumentoSolicitud(): Promise<unknown[]> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const res = await fetch(API_DOC_PLANTILLAS_BASE, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      void 0;
    }
    if (!res.ok) {
      if (res.status === 404) {
        tplDocEndpointMissing = true;
        throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
      }
      const dataObj = this.asObject(data);
      const err: ErrorWithStatus = new Error((dataObj && (dataObj.message || dataObj.error) ? String(dataObj.message || dataObj.error) : '') || 'Error listando plantillas');
      err.status = res.status;
      throw err;
    }
    const dataObj = this.asObject(data);
    const rows = dataObj?.rows;
    return Array.isArray(data) ? data : (Array.isArray(rows) ? rows : []);
  }

  async subirPlantillaDocumentoSolicitud(params: { template: File; nombre?: string }): Promise<ApiRecord | null> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const template = params?.template;
    if (!template) throw new Error('Debe seleccionar una plantilla');

    const fd = new FormData();
    fd.append('template', template);
    const nombre = typeof params?.nombre === 'string' ? params.nombre.trim() : '';
    if (nombre) fd.append('nombre', nombre);

    const res = await fetch(API_DOC_PLANTILLAS_BASE, {
      method: 'POST',
      headers: this.getAuthHeadersMultipart(),
      body: fd
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      void 0;
    }
    if (!res.ok) {
      if (res.status === 404) {
        tplDocEndpointMissing = true;
        throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
      }
      const dataObj = this.asObject(data);
      const err: ErrorWithStatus = new Error((dataObj && (dataObj.message || dataObj.error) ? String(dataObj.message || dataObj.error) : '') || 'Error subiendo plantilla');
      err.status = res.status;
      throw err;
    }
    return this.asObject(data);
  }

  async eliminarPlantillaDocumentoSolicitud(id: number): Promise<ApiRecord | null> {
    if (tplDocEndpointMissing) throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
    const tplId = Number(id);
    if (!Number.isFinite(tplId) || tplId <= 0) throw new Error('ID inválido');

    const res = await fetch(API_DOC_PLANTILLAS_BASE + '/' + encodeURIComponent(String(tplId)), {
      method: 'DELETE',
      headers: this.getAuthHeadersMultipart()
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      void 0;
    }
    if (!res.ok) {
      if (res.status === 404) {
        tplDocEndpointMissing = true;
        throw new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
      }
      const dataObj = this.asObject(data);
      const err: ErrorWithStatus = new Error((dataObj && (dataObj.message || dataObj.error) ? String(dataObj.message || dataObj.error) : '') || 'Error eliminando plantilla');
      err.status = res.status;
      throw err;
    }
    return this.asObject(data);
  }

  async exportarClientesExcel(): Promise<{ blob: Blob; filename: string | null }> {
    const res = await fetch(API + '/clientes/export/excel', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err: ErrorWithStatus = new Error(await this.readApiError(res, 'Error exportando clientes a Excel'));
      err.status = res.status;
      throw err;
    }
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    let filename: string | null = null;
    const m = /filename\*?=(?:UTF-8''|"?)([^";]+)"?/i.exec(cd);
    if (m && m[1]) {
      try {
        filename = decodeURIComponent(m[1]);
      } catch {
        filename = m[1];
      }
    }
    return { blob, filename };
  }

  async exportarClientesSolicitudesExcel(): Promise<{ blob: Blob; filename: string | null }> {
    const res = await fetch(API + '/clientes-solicitudes/export/excel', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err: ErrorWithStatus = new Error(await this.readApiError(res, 'Error exportando solicitudes y clientes a Excel'));
      err.status = res.status;
      throw err;
    }
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    let filename: string | null = null;
    const m = /filename\*?=(?:UTF-8''|"?)([^";]+)"?/i.exec(cd);
    if (m && m[1]) {
      try {
        filename = decodeURIComponent(m[1]);
      } catch {
        filename = m[1];
      }
    }
    return { blob, filename };
  }

  async exportarSolicitudesExcel(): Promise<{ blob: Blob; filename: string | null }> {
    const res = await fetch(API + '/export/excel', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err: ErrorWithStatus = new Error(await this.readApiError(res, 'Error exportando solicitudes a Excel'));
      err.status = res.status;
      throw err;
    }
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    let filename: string | null = null;
    const m = /filename\*?=(?:UTF-8''|"?)([^";]+)"?/i.exec(cd);
    if (m && m[1]) {
      try {
        filename = decodeURIComponent(m[1]);
      } catch {
        filename = m[1];
      }
    }
    return { blob, filename };
  }

  async generarDocumentoDesdePlantilla(params: {
    templateId: number;
    solicitud_id?: number;
    id_cliente?: number;
    todos?: boolean;
    entidad?: 'solicitud' | 'cliente';
  }): Promise<{ blob: Blob; filename: string | null }> {
    const templateId = Number(params?.templateId);
    const solicitud_id = params?.solicitud_id === undefined ? undefined : Number(params?.solicitud_id);
    const id_cliente = params?.id_cliente === undefined ? undefined : Number(params?.id_cliente);
    const todos = !!params?.todos;
    const entidad = params?.entidad;
    if (!Number.isFinite(templateId) || templateId <= 0) throw new Error('Debe seleccionar una plantilla');
    const hasSolicitud = Number.isFinite(solicitud_id) && (solicitud_id as number) > 0;
    const hasCliente = Number.isFinite(id_cliente) && (id_cliente as number) > 0;
    // Permitir requests vacías: si la plantilla tiene loops, el backend genera "todos".
    // Si no hay loops, el backend devolverá un 400 con el mensaje correspondiente.

    const body: ApiRecord = {};
    if (hasSolicitud) body.solicitud_id = solicitud_id;
    if (hasCliente) body.id_cliente = id_cliente;
    if (todos) body.todos = true;
    if (entidad) body.entidad = entidad;

    const res = await fetch(API_DOC_PLANTILLAS_BASE + '/' + encodeURIComponent(String(templateId)) + '/generar', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (res.status === 404) {
        tplDocEndpointMissing = true;
        const err: ErrorWithStatus = new Error('El backend no tiene habilitada la ruta de plantillas persistentes');
        err.status = res.status;
        throw err;
      }
      const err: ErrorWithStatus = new Error(await this.readApiError(res, 'Error generando documento'));
      err.status = res.status;
      throw err;
    }

    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    let filename: string | null = null;
    const m = /filename\*?=(?:UTF-8''|"?)([^";]+)"?/i.exec(cd);
    if (m && m[1]) {
      try {
        filename = decodeURIComponent(m[1]);
      } catch {
        filename = m[1];
      }
    }

    return { blob, filename };
  }
}

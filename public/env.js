(function(window) {
  window.__env = window.__env || {};

  const API_ORIGIN = window.__env.API_ORIGIN || 'http://localhost:42420';

  window.__env.API_BASE = API_ORIGIN + '/api';
  window.__env.API_AUTH = window.__env.API_BASE + '/auth';
  window.__env.API_EQUIPOS = window.__env.API_BASE + '/equipos';
  window.__env.API_INSUMOS = window.__env.API_BASE + '/insumos';
  window.__env.API_REACTIVOS = window.__env.API_BASE + '/reactivos';
  window.__env.API_PAPELERIA = window.__env.API_BASE + '/papeleria';
  window.__env.API_LOGS = window.__env.API_BASE + '/logs';
  window.__env.API_REPORTES = window.__env.API_BASE + '/reportes';
  window.__env.API_USUARIOS = window.__env.API_BASE + '/usuarios';
  window.__env.API_DASHBOARD = window.__env.API_BASE + '/dashboard';
  window.__env.API_SOLICITUDES = window.__env.API_BASE + '/solicitudes';
  window.__env.API_VOLUMETRICOS = window.__env.API_BASE + '/volumetricos';
  window.__env.API_REFERENCIA = window.__env.API_BASE + '/referencia';
  window.__env.API_SOLICITUDES_DETALLE = window.__env.API_SOLICITUDES + '/detalle';
  window.__env.API_SOLICITUDES_DETALLE_LISTA = window.__env.API_SOLICITUDES_DETALLE + '/lista';
  window.__env.API_HISTORIAL_HV = window.__env.API_EQUIPOS + '/historial';
  window.__env.API_INTERVALO_HV = window.__env.API_EQUIPOS + '/intervalo';
  window.__env.API_FICHA_TECNICA = window.__env.API_EQUIPOS + '/ficha-tecnica';
}(window));

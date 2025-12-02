// Production environment configuration
// ngrok URL for backend
(function(window) {
  window.__env = window.__env || {};
  
  // API URL for production (Public IP)
  const RENDER_URL = 'http://181.234.10.70:42420';
  
  window.__env.API_BASE = RENDER_URL + '/api';
  // Core modules
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
  // Equipos submodules
  window.__env.API_HISTORIAL_HV = window.__env.API_EQUIPOS + '/historial';
  window.__env.API_INTERVALO_HV = window.__env.API_EQUIPOS + '/intervalo';
  window.__env.API_FICHA_TECNICA = window.__env.API_EQUIPOS + '/ficha-tecnica';
}(window));

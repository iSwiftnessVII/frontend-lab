// Environment configuration
(function(window) {
  window.__env = window.__env || {};
  
  // API URL - will be replaced in production
  window.__env.API_BASE = 'http://localhost:4000/api';
  window.__env.API_EQUIPOS = 'http://localhost:4000/api/equipos';
  window.__env.API_HISTORIAL_HV = 'http://localhost:4000/api/equipos/historial';
  window.__env.API_INTERVALO_HV = 'http://localhost:4000/api/equipos/intervalo';
  window.__env.API_AUTH = 'http://localhost:4000/api/auth';
}(window));

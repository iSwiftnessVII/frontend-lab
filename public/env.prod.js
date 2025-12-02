// Production environment configuration
// ngrok URL for backend
(function(window) {
  window.__env = window.__env || {};
  
  // API URL for production (ngrok)
  const NGROK_URL = 'https://al-wigless-unhurryingly.ngrok-free.dev';
  
  window.__env.API_BASE = NGROK_URL + '/api';
  window.__env.API_EQUIPOS = NGROK_URL + '/api/equipos';
  window.__env.API_HISTORIAL_HV = NGROK_URL + '/api/equipos/historial';
  window.__env.API_INTERVALO_HV = NGROK_URL + '/api/equipos/intervalo';
  window.__env.API_AUTH = NGROK_URL + '/api/auth';
}(window));

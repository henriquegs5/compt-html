// ============================================================
// config.js
// Configurações globais do front-end.
//
// API: endereço base do backend. Vem da variável de ambiente do Vite
// (VITE_API_URL) se definida — útil em produção/deploy — e cai em
// http://localhost:3001 no desenvolvimento, sem precisar configurar nada.
// ============================================================

export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

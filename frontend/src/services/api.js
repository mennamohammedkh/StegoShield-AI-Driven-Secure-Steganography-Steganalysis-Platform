// services/api.js — Axios client for StegoShield backend
import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Log requests in dev
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Normalise errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail  = err.response?.data?.detail;
    const message =
      (typeof detail === 'object' ? detail?.message : detail) ||
      err.message ||
      'Unknown error';
    const code =
      (typeof detail === 'object' ? detail?.error_code : null) || 'ERROR';
    return Promise.reject({ message, code, status: err.response?.status });
  }
);

// ─── Encode ────────────────────────────────────────────────────────────────
export const encodeAPI = (imageFile, message, key = null, payload = 0.2) => {
  const fd = new FormData();
  fd.append('image',   imageFile);
  fd.append('message', message);
  fd.append('payload', payload);
  if (key) fd.append('key', key);
  return api.post('/encode', fd, { responseType: 'blob' });
};

// ─── Decode ────────────────────────────────────────────────────────────────
export const decodeAPI = (imageFile, key = null, payload = 0.2) => {
  const fd = new FormData();
  fd.append('image',   imageFile);
  fd.append('payload', payload);
  if (key) fd.append('key', key);
  return api.post('/decode', fd);
};

// ─── Detect ────────────────────────────────────────────────────────────────
export const detectAPI = (imageFile, threshold = 0.5) => {
  const fd = new FormData();
  fd.append('image', imageFile);
  fd.append('confidence_threshold', threshold);
  return api.post('/detect', fd);
};

// ─── Attack ────────────────────────────────────────────────────────────────
export const attackAPI = (imageFile, message, attackType, params = {}, payload = 0.2) => {
  const fd = new FormData();
  fd.append('image',         imageFile);
  fd.append('message',       message);
  fd.append('attack_type',   attackType);
  fd.append('attack_params', JSON.stringify(params));
  fd.append('payload',       payload);
  return api.post('/attack', fd);
};

// ─── Health ────────────────────────────────────────────────────────────────
export const healthAPI = () => api.get('/health');

export default api;

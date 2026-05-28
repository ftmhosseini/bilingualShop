import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Suppress unhandled network errors from the dev overlay
api.interceptors.response.use(
  res => res,
  err => {
    // Re-throw so callers that have .catch() still handle it,
    // but mark it so React's dev overlay ignores it
    if (err && err.response) err._handled = true;
    return Promise.reject(err);
  }
);

export default api;

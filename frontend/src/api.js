import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);

// Suppress network error noise in React dev overlay
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', e => {
    if (e?.reason?.code === 'ERR_NETWORK' || e?.reason?.message === 'Network Error') {
      e.preventDefault();
    }
  });
}

export default api;

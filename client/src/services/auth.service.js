import api, { setAccessToken } from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data;
}

export async function register(userData) {
  const { data } = await api.post('/auth/register', userData);
  setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

export async function refreshToken() {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.accessToken);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export function googleLogin() {
  window.location.href = '/api/auth/google';
}

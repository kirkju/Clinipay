import api from './api';

export async function getActivePackages() {
  const { data } = await api.get('/packages');
  return data;
}

export async function getPackageById(id) {
  const { data } = await api.get(`/packages/${id}`);
  return data;
}

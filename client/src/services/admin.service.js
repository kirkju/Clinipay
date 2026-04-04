import api from './api';

export async function getDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}

export async function getOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params });
  return data;
}

export async function getOrderDetail(id) {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data;
}

export async function updateOrderStatus(id, status, notes) {
  const { data } = await api.patch(`/admin/orders/${id}/status`, { status, notes });
  return data;
}

export async function getPackages() {
  const { data } = await api.get('/admin/packages');
  return data;
}

export async function createPackage(packageData) {
  const { data } = await api.post('/admin/packages', packageData);
  return data;
}

export async function updatePackage(id, packageData) {
  const { data } = await api.put(`/admin/packages/${id}`, packageData);
  return data;
}

export async function togglePackage(id) {
  const { data } = await api.patch(`/admin/packages/${id}/toggle`);
  return data;
}

export async function getUsers() {
  const { data } = await api.get('/admin/users');
  return data;
}

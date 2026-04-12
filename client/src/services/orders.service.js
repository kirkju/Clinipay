import api from './api';

export async function createOrder(items) {
  const { data } = await api.post('/orders', { items });
  return data;
}

export async function getMyOrders() {
  const { data } = await api.get('/orders/my-orders');
  return data;
}

export async function getOrderById(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

export async function simulatePayment(orderId, success) {
  const { data } = await api.post(`/orders/${orderId}/simulate-payment`, { success });
  return data;
}

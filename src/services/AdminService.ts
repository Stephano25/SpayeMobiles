// src/services/AdminService.ts
import api from './api';

export const AdminService = {
  getDashboardStats: () => api.get('/admin/dashboard/stats').then(res => res.data),
  getAllUsers: () => api.get('/admin/users').then(res => res.data),
  getAllTransactions: () => api.get('/admin/transactions').then(res => res.data),
  updateUserStatus: (userId: string, isActive: boolean) =>
    api.patch(`/admin/users/${userId}/status`, { isActive }).then(res => res.data),
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`).then(res => res.data),
  getSettings: () => api.get('/admin/settings').then(res => res.data),
  updateSettings: (settings: any) =>
    api.patch('/admin/settings', settings).then(res => res.data),
};
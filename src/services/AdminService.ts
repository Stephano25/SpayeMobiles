import api from './api';
import { User, Transaction, AdminDashboardStats } from '../types';

export const AdminService = {
  getDashboardStats: () => api.get('/admin/dashboard/stats').then(res => res.data),
  getAllUsers: () => api.get('/admin/users').then(res => res.data),
  getAllTransactions: () => api.get('/admin/transactions').then(res => res.data),
  updateUserStatus: (userId: string, isActive: boolean) => 
    api.patch(`/admin/users/${userId}/status`, { isActive }).then(res => res.data),
  updateUserRole: (userId: string, role: string) => 
    api.patch(`/admin/users/${userId}/role`, { role }).then(res => res.data),
  deleteUser: (userId: string) => 
    api.delete(`/admin/users/${userId}`).then(res => res.data),
  getSettings: () => api.get('/admin/settings').then(res => res.data),
  updateSettings: (settings: any) => 
    api.patch('/admin/settings', settings).then(res => res.data),
  getSystemLogs: () => api.get('/admin/system/logs').then(res => res.data),
  getSystemStats: () => api.get('/admin/system/stats').then(res => res.data),
};
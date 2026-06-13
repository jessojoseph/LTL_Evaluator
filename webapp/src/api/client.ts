import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 
           (import.meta.env.DEV ? '/api' : 'https://ltl-evaluator.onrender.com/api'),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to /login for the login endpoint itself (that would hide error messages)
    const isLoginRequest = error.config?.url === '/auth/login';
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Employees
export const employeeApi = {
  getAll: (params?: Record<string, string>) => api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: Record<string, unknown>) => api.post('/employees', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/employees/${id}`, data),
  remove: (id: string) => api.delete(`/employees/${id}`),
  toggleStatus: (id: string) => api.patch(`/employees/${id}/toggle-status`),
};

// Projects
export const projectApi = {
  getAll: (params?: Record<string, string>) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: Record<string, unknown>) => api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data),
  remove: (id: string) => api.delete(`/projects/${id}`),
  toggleStatus: (id: string) => api.patch(`/projects/${id}/toggle-status`),
};

// Weeks
export const weekApi = {
  getAll: (params?: Record<string, string>) => api.get('/weeks', { params }),
  getById: (id: string) => api.get(`/weeks/${id}`),
  create: (data: Record<string, unknown>) => api.post('/weeks', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/weeks/${id}`, data),
  remove: (id: string) => api.delete(`/weeks/${id}`),
  copyFromPrevious: (id: string, previousWeekId: string) =>
    api.post(`/weeks/${id}/copy-from/${previousWeekId}`),
  toggleStatus: (id: string) => api.patch(`/weeks/${id}/toggle-status`),
};

// Allocations
export const allocationApi = {
  getAll: (params?: Record<string, string>) => api.get('/allocations', { params }),
  getById: (id: string) => api.get(`/allocations/${id}`),
  create: (data: Record<string, unknown>) => api.post('/allocations', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/allocations/${id}`, data),
  remove: (id: string) => api.delete(`/allocations/${id}`),
  bulkCreate: (data: { allocations: Record<string, unknown>[] }) => api.post('/allocations/bulk', data),
  toggleStatus: (id: string) => api.patch(`/allocations/${id}/toggle-status`),
};

// Reports
export const reportApi = {
  dashboard: (params?: Record<string, string>) => api.get('/reports/dashboard', { params }),
  employeeUtilization: (params?: Record<string, string>) =>
    api.get('/reports/employee-utilization', { params }),
  projectWise: (params?: Record<string, string>) => api.get('/reports/project-wise', { params }),
  leadSummary: (params?: Record<string, string>) => api.get('/reports/lead-summary', { params }),
  freeResources: (params?: Record<string, string>) => api.get('/reports/free-resources', { params }),
  overbookedResources: (params?: Record<string, string>) =>
    api.get('/reports/overbooked-resources', { params }),
  weekComparison: (params?: Record<string, string>) =>
    api.get('/reports/week-comparison', { params }),
  employeeWise: (params?: Record<string, string>) =>
    api.get('/reports/employee-wise', { params }),
};

// Export
export const exportApi = {
  weeklyReport: (params?: Record<string, string>) =>
    api.get('/export/weekly-report', { params, responseType: 'blob' }),
  employeeUtilization: (params?: Record<string, string>) =>
    api.get('/export/employee-utilization', { params, responseType: 'blob' }),
  projectWise: (params?: Record<string, string>) =>
    api.get('/export/project-wise', { params, responseType: 'blob' }),
  employeeWise: (params?: Record<string, string>) =>
    api.get('/export/employee-wise', { params, responseType: 'blob' }),
};

// Roles
export const roleApi = {
  getAll: (params?: Record<string, string>) => api.get('/roles', { params }),
  getById: (id: string) => api.get(`/roles/${id}`),
  create: (data: Record<string, unknown>) => api.post('/roles', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/roles/${id}`, data),
  remove: (id: string) => api.delete(`/roles/${id}`),
  toggleStatus: (id: string) => api.patch(`/roles/${id}/toggle-status`),
};

// Permissions
export const permissionApi = {
  getAll: (params?: Record<string, string>) => api.get('/permissions', { params }),
  getById: (id: string) => api.get(`/permissions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/permissions', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/permissions/${id}`, data),
  remove: (id: string) => api.delete(`/permissions/${id}`),
  toggleStatus: (id: string) => api.patch(`/permissions/${id}/toggle-status`),
};

// Users
export const userApi = {
  getAll: (params?: Record<string, string>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: { name: string; email: string; password: string; roleId: string }) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
  toggleStatus: (id: string) => api.patch(`/users/${id}/toggle-status`),
};

export function downloadExcel(response: Blob, filename: string) {
  const url = window.URL.createObjectURL(response);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

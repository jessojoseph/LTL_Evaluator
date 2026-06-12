export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  isLead?: boolean;
  defaultLeadId?: { _id: string; name: string };
  status: string;
}

export interface Project {
  _id: string;
  name: string;
  projectLeadId: { _id: string; name: string; email?: string };
  clientName?: string;
  projectType?: string;
  status: string;
  priority?: string;
  isActive?: boolean;
}

export interface Week {
  _id: string;
  weekName: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  hoursPerDay: number;
  weeklyCapacity: number;
  status: string;
  isActive?: boolean;
}

export interface LoginUser {
  _id: string;
  name: string;
  email: string;
  roleId: { _id: string; name: string; permissions: string[] };
  status: string;
}

export interface Allocation {
  _id: string;
  weekId: { _id: string; weekName: string; hoursPerDay?: number; weeklyCapacity?: number };
  projectLeadId: { _id: string; name: string };
  projectId: { _id: string; name: string };
  employeeId: { _id: string; name: string };
  allocatedDays: number;
  extraHours: number;
  allocatedWH: number;
  remarks?: string;
  status?: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  status: string;
}

export interface Permission {
  _id: string;
  name: string;
  label: string;
  description: string;
  module: string;
  isSystem: boolean;
  status: string;
}

export interface DashboardData {
  week: { id: string; name: string };
  totalEmployees: number;
  totalProjects: number;
  totalWeeklyCapacity: number;
  totalAllocatedWH: number;
  totalFreeWH: number;
  totalOverbookedWH: number;
  averageUtilization: number;
  leadWiseAllocation: { _id: string; leadName: string; totalWH: number }[];
  projectWiseAllocation: { _id: string; projectName: string; totalWH: number }[];
}

export interface EmployeeUtilization {
  employee: string;
  lead: string;
  capacityWH: number;
  allocatedWH: number;
  freeWH: number;
  overbookedWH: number;
  utilization: number;
  statusLabel: string;
  color: string;
}

export interface ProjectWiseReport {
  projectLead: string;
  project: string;
  employee: string;
  days: number;
  extraHours: number;
  allocatedWH: number;
}

export interface LeadSummary {
  projectLead: string;
  projectCount: number;
  employeeCount: number;
  totalCapacity: number;
  allocatedWH: number;
  freeWH: number;
  utilization: number;
}

export interface FreeResource {
  employee: string;
  lead: string;
  capacityWH: number;
  allocatedWH: number;
  freeWH: number;
}

export interface EmployeeWiseProject {
  project: string;
  lead: string;
  days: number;
  extraHours: number;
  allocatedWH: number;
}

export interface EmployeeWiseItem {
  employeeId: string;
  employee: string;
  lead: string;
  projects: EmployeeWiseProject[];
  totalWH: number;
  statusLabel: string;
  color: string;
}

export interface OverbookedResource {
  employee: string;
  capacityWH: number;
  allocatedWH: number;
  overbookedWH: number;
  projects: string[];
}

export const defaultPermissions = [
  // Employees
  { name: 'employees:create', label: 'Create Employees', description: 'Create new employee records', module: 'Employees', isSystem: true },
  { name: 'employees:read', label: 'Read Employees', description: 'View employee records', module: 'Employees', isSystem: true },
  { name: 'employees:update', label: 'Update Employees', description: 'Edit employee records', module: 'Employees', isSystem: true },
  { name: 'employees:delete', label: 'Delete Employees', description: 'Deactivate/delete employee records', module: 'Employees', isSystem: true },

  // Project Leads
  { name: 'project_leads:create', label: 'Create Project Leads', description: 'Create new project lead records', module: 'Project Leads', isSystem: true },
  { name: 'project_leads:read', label: 'Read Project Leads', description: 'View project lead records', module: 'Project Leads', isSystem: true },
  { name: 'project_leads:update', label: 'Update Project Leads', description: 'Edit project lead records', module: 'Project Leads', isSystem: true },
  { name: 'project_leads:delete', label: 'Delete Project Leads', description: 'Deactivate project lead records', module: 'Project Leads', isSystem: true },

  // Projects
  { name: 'projects:create', label: 'Create Projects', description: 'Create new projects', module: 'Projects', isSystem: true },
  { name: 'projects:read', label: 'Read Projects', description: 'View projects', module: 'Projects', isSystem: true },
  { name: 'projects:update', label: 'Update Projects', description: 'Edit projects', module: 'Projects', isSystem: true },
  { name: 'projects:delete', label: 'Delete Projects', description: 'Delete projects', module: 'Projects', isSystem: true },

  // Weeks
  { name: 'weeks:create', label: 'Create Weeks', description: 'Create weekly planning entries', module: 'Weeks', isSystem: true },
  { name: 'weeks:read', label: 'Read Weeks', description: 'View weekly entries', module: 'Weeks', isSystem: true },
  { name: 'weeks:update', label: 'Update Weeks', description: 'Edit weekly entries', module: 'Weeks', isSystem: true },
  { name: 'weeks:delete', label: 'Delete Weeks', description: 'Delete weekly entries', module: 'Weeks', isSystem: true },
  { name: 'weeks:copy', label: 'Copy Week', description: 'Copy allocations from a previous week', module: 'Weeks', isSystem: true },

  // Allocations
  { name: 'allocations:create', label: 'Create Allocations', description: 'Create resource allocations', module: 'Allocations', isSystem: true },
  { name: 'allocations:read', label: 'Read Allocations', description: 'View resource allocations', module: 'Allocations', isSystem: true },
  { name: 'allocations:update', label: 'Update Allocations', description: 'Edit resource allocations', module: 'Allocations', isSystem: true },
  { name: 'allocations:delete', label: 'Delete Allocations', description: 'Delete resource allocations', module: 'Allocations', isSystem: true },
  { name: 'allocations:bulk_create', label: 'Bulk Create Allocations', description: 'Bulk import resource allocations from Excel', module: 'Allocations', isSystem: true },

  // Reports
  { name: 'reports:read', label: 'Read Reports', description: 'View dashboard and utilization reports', module: 'Reports', isSystem: true },

  // Export
  { name: 'export:read', label: 'Export Reports', description: 'Export reports to Excel', module: 'Export', isSystem: true },

  // Roles
  { name: 'roles:create', label: 'Create Roles', description: 'Create new roles', module: 'Roles', isSystem: true },
  { name: 'roles:read', label: 'Read Roles', description: 'View roles', module: 'Roles', isSystem: true },
  { name: 'roles:update', label: 'Update Roles', description: 'Edit roles and their permissions', module: 'Roles', isSystem: true },
  { name: 'roles:delete', label: 'Delete Roles', description: 'Delete non-system roles', module: 'Roles', isSystem: true },

  // Leaves
  { name: 'leaves:create', label: 'Create Leaves', description: 'Create leave requests', module: 'Leaves', isSystem: true },
  { name: 'leaves:read', label: 'Read Leaves', description: 'View leave requests', module: 'Leaves', isSystem: true },
  { name: 'leaves:update', label: 'Update Leaves', description: 'Edit leave requests', module: 'Leaves', isSystem: true },
  { name: 'leaves:delete', label: 'Delete Leaves', description: 'Delete leave requests', module: 'Leaves', isSystem: true },
  { name: 'leaves:approve', label: 'Approve Leaves', description: 'Approve or reject leave requests', module: 'Leaves', isSystem: true },
  { name: 'leaves:self', label: 'Self Leave', description: 'Apply for and view own leave requests', module: 'Leaves', isSystem: true },

  // Leave Rules
  { name: 'leave_rules:create', label: 'Create Leave Rules', description: 'Create leave allocation rules', module: 'Leave Rules', isSystem: true },
  { name: 'leave_rules:read', label: 'Read Leave Rules', description: 'View leave allocation rules', module: 'Leave Rules', isSystem: true },
  { name: 'leave_rules:update', label: 'Update Leave Rules', description: 'Edit leave allocation rules', module: 'Leave Rules', isSystem: true },
  { name: 'leave_rules:delete', label: 'Delete Leave Rules', description: 'Delete leave allocation rules', module: 'Leave Rules', isSystem: true },

  // Holidays
  { name: 'holidays:create', label: 'Create Holidays', description: 'Create new holidays', module: 'Holidays', isSystem: true },
  { name: 'holidays:read', label: 'Read Holidays', description: 'View holidays', module: 'Holidays', isSystem: true },
  { name: 'holidays:update', label: 'Update Holidays', description: 'Edit holidays', module: 'Holidays', isSystem: true },
  { name: 'holidays:delete', label: 'Delete Holidays', description: 'Delete holidays', module: 'Holidays', isSystem: true },

  // Payroll
  { name: 'reports:payroll', label: 'Monthly Payroll Reports', description: 'View monthly leave summary for payroll calculation', module: 'Payroll', isSystem: true },

  // Permissions
  { name: 'permissions:create', label: 'Create Permissions', description: 'Create new permissions', module: 'Permissions', isSystem: true },
  { name: 'permissions:read', label: 'Read Permissions', description: 'View permissions', module: 'Permissions', isSystem: true },
  { name: 'permissions:update', label: 'Update Permissions', description: 'Edit permissions', module: 'Permissions', isSystem: true },
  { name: 'permissions:delete', label: 'Delete Permissions', description: 'Delete non-system permissions', module: 'Permissions', isSystem: true },
];

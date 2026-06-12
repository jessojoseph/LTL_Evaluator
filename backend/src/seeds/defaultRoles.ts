export const defaultRoles = [
  {
    name: 'Admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: [
      'employees:create', 'employees:read', 'employees:update', 'employees:delete',
      'project_leads:create', 'project_leads:read', 'project_leads:update', 'project_leads:delete',
      'projects:create', 'projects:read', 'projects:update', 'projects:delete',
      'weeks:create', 'weeks:read', 'weeks:update', 'weeks:delete', 'weeks:copy',
      'allocations:create', 'allocations:read', 'allocations:update', 'allocations:delete', 'allocations:bulk_create',
      'reports:read', 'export:read',
      'roles:create', 'roles:read', 'roles:update', 'roles:delete',
      'permissions:create', 'permissions:read', 'permissions:update', 'permissions:delete',
    ],
  },
  {
    name: 'Project Manager',
    description: 'Can manage allocations, weeks, projects, and view reports',
    isSystem: true,
    permissions: [
      'employees:read',
      'project_leads:read',
      'projects:read', 'projects:create', 'projects:update',
      'weeks:read', 'weeks:create', 'weeks:update', 'weeks:copy',
      'allocations:read', 'allocations:create', 'allocations:update', 'allocations:delete', 'allocations:bulk_create',
      'reports:read', 'export:read',
    ],
  },
  {
    name: 'Project Lead',
    description: 'Can view team allocations and suggest assignments',
    isSystem: true,
    permissions: [
      'employees:read',
      'project_leads:read',
      'projects:read',
      'weeks:read',
      'allocations:read', 'allocations:create', 'allocations:update',
      'reports:read',
    ],
  },
  {
    name: 'Employee',
    description: 'Can view assigned projects and allocations',
    isSystem: true,
    permissions: [
      'projects:read',
      'weeks:read',
      'allocations:read',
      'reports:read',
    ],
  },
];

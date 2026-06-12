import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Employee validators
export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    defaultLeadId: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    defaultLeadId: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Project Lead validators
export const createProjectLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Invalid email'),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateProjectLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    email: z.string().email().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Project validators
export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').trim(),
    projectLeadId: z.string().min(1, 'Project lead is required'),
    clientName: z.string().optional(),
    projectType: z.enum(['internal', 'client', 'support']).optional(),
    status: z.enum(['active', 'on_hold', 'completed', 'no_work']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    projectLeadId: z.string().optional(),
    clientName: z.string().optional(),
    projectType: z.enum(['internal', 'client', 'support']).optional(),
    status: z.enum(['active', 'on_hold', 'completed', 'no_work']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Week validators
export const createWeekSchema = z.object({
  body: z.object({
    weekName: z.string().min(1, 'Week name is required').trim(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    workingDays: z.number().min(1, 'Working days must be greater than 0'),
    hoursPerDay: z.number().min(0.5, 'Hours per day must be greater than 0'),
    status: z.enum(['draft', 'published', 'closed']).optional(),
  }),
});

export const updateWeekSchema = z.object({
  body: z.object({
    weekName: z.string().min(1).trim().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    workingDays: z.number().min(1).optional(),
    hoursPerDay: z.number().min(0.5).optional(),
    status: z.enum(['draft', 'published', 'closed']).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Allocation validators
export const createAllocationSchema = z.object({
  body: z.object({
    weekId: z.string().min(1, 'Week is required'),
    projectLeadId: z.string().min(1, 'Project lead is required'),
    projectId: z.string().min(1, 'Project is required'),
    employeeId: z.string().min(1, 'Employee is required'),
    allocatedDays: z.number().min(0, 'Days cannot be negative'),
    extraHours: z.number().min(0, 'Extra hours cannot be negative').default(0),
    remarks: z.string().optional(),
  }),
});

export const updateAllocationSchema = z.object({
  body: z.object({
    weekId: z.string().optional(),
    projectLeadId: z.string().optional(),
    projectId: z.string().optional(),
    employeeId: z.string().optional(),
    allocatedDays: z.number().min(0).optional(),
    extraHours: z.number().min(0).optional(),
    remarks: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const bulkAllocationSchema = z.object({
  body: z.object({
    allocations: z
      .array(
        z.object({
          weekId: z.string().min(1),
          projectLeadId: z.string().min(1),
          projectId: z.string().min(1),
          employeeId: z.string().min(1),
          allocatedDays: z.number().min(0),
          extraHours: z.number().min(0).default(0),
          remarks: z.string().optional(),
        })
      )
      .min(1, 'At least one allocation is required'),
  }),
});
